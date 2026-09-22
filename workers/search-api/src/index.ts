// Public search API over the Meilisearch "works" index (M6).
//
// A Cloudflare Worker in front of the Meilisearch instance running on Render
// Free (see search/README.md). Unlike workers/events-api, this one is called
// directly from the visitor's browser, so it has no authentication — a
// Bearer token placed in browser JS is visible to everyone anyway. What it
// does instead:
//   - CORS: only the site's own origins can read the response in a browser.
//     (This does not stop curl or other servers; it only stops other
//     websites' JS from reading the response on a visitor's behalf.)
//   - A search-only Meilisearch key (MEILI_SEARCH_KEY secret): if it leaked,
//     the worst case is someone else running searches, not writing data.
//   - A short timeout, because the Meilisearch instance is on Render's free
//     plan and spins down after 15 idle minutes (~1 minute to wake back up).
//     The frontend is expected to fall back to the client-side search
//     (src/pages/search.json.js) when this API is unavailable.
//
// Endpoints (GET only):
//   /search?q=&limit=   search the works index (q: 1-100 chars, limit: 1-20, default 10)
//   /warmup              fire-and-forget health check to wake a sleeping instance
//
// Meilisearch errors are never echoed to callers (only logged): the search
// key or the shape of internal errors should not leak to the public internet.

interface Env {
  MEILI_URL: string;
  MEILI_SEARCH_KEY?: string;
  ALLOWED_ORIGINS: string;
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Hit {
  id: string;
  title: string;
  author: string;
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin');
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  const headers: Record<string, string> = { Vary: 'Origin' };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return headers;
}

function json(body: unknown, status: number, headers: HeadersInit, extra?: HeadersInit): Response {
  return Response.json(body, { status, headers: { ...headers, ...extra } });
}

function parseSearchParams(url: URL): { q: string; limit: number } {
  const q = url.searchParams.get('q') ?? '';
  if (q.length < 1 || q.length > 100) {
    throw new HttpError(400, 'q must be between 1 and 100 characters');
  }

  const rawLimit = url.searchParams.get('limit');
  let limit = 10;
  if (rawLimit !== null) {
    if (!/^\d+$/.test(rawLimit)) throw new HttpError(400, 'limit must be an integer');
    limit = Number(rawLimit);
    if (limit < 1 || limit > 20) throw new HttpError(400, 'limit must be between 1 and 20');
  }

  return { q, limit };
}

// Call Meilisearch with a timeout, so a slow or sleeping instance fails fast
// with our own 503 instead of hanging the caller.
async function searchMeilisearch(env: Env, q: string, limit: number): Promise<Hit[]> {
  if (!env.MEILI_SEARCH_KEY) {
    console.error('MEILI_SEARCH_KEY is not configured; refusing to search');
    throw new HttpError(500, 'internal error');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const res = await fetch(`${env.MEILI_URL}/indexes/works/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MEILI_SEARCH_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q, limit }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error('meilisearch error:', res.status, await res.text());
      throw new HttpError(503, 'search unavailable');
    }
    const data = (await res.json()) as { hits: Hit[] };
    return data.hits;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    // Network error, DNS failure, or the AbortController firing (timeout).
    console.error('meilisearch request failed:', err instanceof Error ? err.message : err);
    throw new HttpError(503, 'search unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(request, env);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (request.method !== 'GET') {
        throw new HttpError(405, 'method not allowed');
      }

      switch (url.pathname) {
        case '/warmup': {
          // Wake a sleeping Render instance without making the caller wait for
          // it: the fetch runs in the background (waitUntil), the response
          // returns immediately.
          ctx.waitUntil(fetch(`${env.MEILI_URL}/health`).catch(() => {}));
          return json({ status: 'waking' }, 202, cors);
        }

        case '/search': {
          const { q, limit } = parseSearchParams(url);
          const hits = await searchMeilisearch(env, q, limit);
          const results = hits.map((hit) => ({
            id: hit.id,
            title: hit.title,
            author: hit.author,
            url: `/works/${hit.id}`,
          }));
          return json({ results }, 200, cors);
        }

        default:
          throw new HttpError(404, 'not found');
      }
    } catch (err) {
      if (err instanceof HttpError) {
        const extra = err.status === 405 ? { Allow: 'GET, OPTIONS' } : undefined;
        return json({ error: err.message }, err.status, cors, extra);
      }
      console.error('unexpected error:', err instanceof Error ? err.message : err);
      return json({ error: 'internal error' }, 500, cors);
    }
  },
};
