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
// Every query is parameterized ($1, $2, ...): user input is sent to Postgres
// separately from the SQL text, so it can never be interpreted as SQL.
// Inputs are also validated up front (allowed types, integer ranges).
// session_id is deliberately never returned.

import { Client } from 'pg';

interface Env {
  HYPERDRIVE: { connectionString: string };
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
    const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
    try {
      await client.connect();
      const { rows } = await client.query(query.text, query.values);
      return Response.json(rows);
    } catch (err) {
      // Log details server-side only; never echo database errors to callers.
      console.error('database error:', err instanceof Error ? err.message : err);
      return Response.json({ error: 'internal error' }, { status: 500 });
    } finally {
      await client.end().catch(() => {});
    }
  },
};
