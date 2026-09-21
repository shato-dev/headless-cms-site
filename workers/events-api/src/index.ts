// Read-only JSON API over the `events` table (see db/migrations/001_create_events.sql).
//
// A Cloudflare Worker: a small function that runs at the edge and answers
// HTTP requests. It reaches Postgres through Hyperdrive (Cloudflare's
// connection pooler for external databases); `env.HYPERDRIVE.connectionString`
// is what the binding in wrangler.jsonc provides.
//
// Endpoints (GET only):
//   /stats/daily?type=&days=       daily event counts (type optional, days 1-90, default 7)
//   /stats/top-works?days=&limit=  most viewed works (days 1-365 default 30, limit 1-50 default 10)
//   /events?type=&limit=           latest events (limit 1-100, default 20)
//
// Authentication: every request needs `Authorization: Bearer <token>`, checked
// against the API_TOKEN secret (set with `wrangler secret put API_TOKEN`; local
// dev reads it from .dev.vars). It is checked before anything else, so
// unauthenticated callers get 401 for every path and never reach the database.
// If API_TOKEN is not configured the Worker refuses to serve (fail closed).
//
// Every query is parameterized ($1, $2, ...): user input is sent to Postgres
// separately from the SQL text, so it can never be interpreted as SQL.
// Inputs are also validated up front (allowed types, integer ranges).
// session_id is deliberately never returned.

import { Client } from 'pg';

interface Env {
  HYPERDRIVE: { connectionString: string };
  API_TOKEN?: string;
}

const EVENT_TYPES = ['work_viewed', 'random_pick', 'quiz_completed'] as const;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// Parse an optional integer query parameter and enforce min/max.
function intParam(params: URLSearchParams, name: string, fallback: number, min: number, max: number): number {
  const raw = params.get(name);
  if (raw === null) return fallback;
  if (!/^\d+$/.test(raw)) throw new HttpError(400, `${name} must be an integer`);
  const value = Number(raw);
  if (value < min || value > max) throw new HttpError(400, `${name} must be between ${min} and ${max}`);
  return value;
}

function typeParam(params: URLSearchParams): string | null {
  const raw = params.get('type');
  if (raw === null) return null;
  if (!(EVENT_TYPES as readonly string[]).includes(raw)) {
    throw new HttpError(400, `type must be one of: ${EVENT_TYPES.join(', ')}`);
  }
  return raw;
}

// Compare tokens without leaking, through timing, how much of them matched.
// Hashing both first gives fixed-length digests, so the loop always runs the
// same number of steps regardless of the input lengths.
async function tokenMatches(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i += 1) diff |= x[i] ^ y[i];
  return diff === 0;
}

interface Query {
  text: string;
  values: unknown[];
}

// Validate the request and pick the SQL. Throws HttpError for bad input, so
// this runs before any database connection is opened.
// Note: pg returns bigint (count) as a string and date as a JS Date, so the
// queries cast in SQL (::int, to_char) to get plain JSON values.
function buildQuery(url: URL): Query {
  const params = url.searchParams;

  switch (url.pathname) {
    case '/stats/daily': {
      const type = typeParam(params);
      const days = intParam(params, 'days', 7, 1, 90);
      return {
        text: `SELECT to_char(occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
                event_type,
                count(*)::int AS count
         FROM events
         WHERE occurred_at >= now() - make_interval(days => $1::int)
           AND ($2::text IS NULL OR event_type = $2)
         GROUP BY 1, 2
         ORDER BY 1 DESC, 2`,
        values: [days, type],
      };
    }

    case '/stats/top-works': {
      const days = intParam(params, 'days', 30, 1, 365);
      const limit = intParam(params, 'limit', 10, 1, 50);
      return {
        text: `SELECT work_id, count(*)::int AS views
         FROM events
         WHERE event_type = 'work_viewed'
           AND occurred_at >= now() - make_interval(days => $1::int)
         GROUP BY work_id
         ORDER BY views DESC, work_id
         LIMIT $2`,
        values: [days, limit],
      };
    }

    case '/events': {
      const type = typeParam(params);
      const limit = intParam(params, 'limit', 20, 1, 100);
      return {
        text: `SELECT id::text AS id, event_type, work_id, occurred_at, payload
         FROM events
         WHERE ($1::text IS NULL OR event_type = $1)
         ORDER BY occurred_at DESC, id DESC
         LIMIT $2`,
        values: [type, limit],
      };
    }

    default:
      throw new HttpError(404, 'not found');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.API_TOKEN) {
      console.error('API_TOKEN is not configured; refusing to serve');
      return Response.json({ error: 'internal error' }, { status: 500 });
    }
    const bearer = /^Bearer\s+(.+)$/i.exec(request.headers.get('Authorization') ?? '');
    if (!bearer || !(await tokenMatches(bearer[1], env.API_TOKEN))) {
      return Response.json({ error: 'unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } });
    }

    if (request.method !== 'GET') {
      return Response.json({ error: 'method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
    }

    let query: Query;
    try {
      query = buildQuery(new URL(request.url));
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    // A new Client per request is the documented pattern: Hyperdrive keeps the
    // real connection pool, so this is cheap.
    // The timeouts make an unreachable database fail with our JSON 500 instead
    // of hanging (Neon waking from scale-to-zero took ~2-3 s in testing).
    const client = new Client({
      connectionString: env.HYPERDRIVE.connectionString,
      connectionTimeoutMillis: 10_000,
      query_timeout: 10_000,
    });
    let connected = false;
    try {
      await client.connect();
      connected = true;
      const { rows } = await client.query(query.text, query.values);
      return Response.json(rows);
    } catch (err) {
      // Log details server-side only; never echo database errors to callers.
      console.error('database error:', err instanceof Error ? err.message : err);
      return Response.json({ error: 'internal error' }, { status: 500 });
    } finally {
      // end() on a client that never connected waits forever (the Worker then
      // hangs instead of returning the 500 above), so only close real connections.
      if (connected) await client.end().catch(() => {});
    }
  },
};
