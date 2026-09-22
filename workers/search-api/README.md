# search-api

Public JSON search API over the Meilisearch `works` index (M6), which runs on
Render Free (see `../../search/README.md`). A Cloudflare Worker that adds CORS,
input validation, and a short timeout in front of it.

| Endpoint | Query parameters | Returns |
|---|---|---|
| `GET /search` | `q` (required, 1-100 chars), `limit` (1-20, default 10) | `{ results: [{id, title, author, url}] }` |
| `GET /warmup` | — | `202` immediately; wakes a sleeping Meilisearch instance in the background |

## No authentication, by design

Unlike `workers/events-api` (Bearer token, called only from our own scripts),
this API is called directly from the visitor's browser. A token placed in
browser JavaScript is visible to anyone who opens dev tools, so it would not
protect anything — it would only give a false sense of security. Instead:

- **CORS** restricts which *websites* can read the response in a browser
  (`ALLOWED_ORIGINS` in `wrangler.jsonc`). It does not stop a direct `curl`.
- **A search-only Meilisearch key** (`MEILI_SEARCH_KEY` secret) means that even
  if the key were extracted from the Worker, it can only run searches — not
  write, delete, or read other indexes or the Meilisearch admin API.
- Abuse volume is bounded by the Workers Free plan (100,000 requests/day;
  going over just errors, it does not bill).

Other responses: invalid input `400`, unknown path `404`, non-GET `405`,
Meilisearch unreachable/slow/misconfigured `503`/`500` (the upstream error is
logged, never echoed to the caller).

## Run locally

Needs the local Meilisearch from `docker-compose.yml`, with a `works` index
built the same way `search/entrypoint.sh` builds it in production:

```bash
set -a; . ../../.env; set +a
B=http://127.0.0.1:7700
curl -s -X POST $B/indexes -H "Authorization: Bearer $MEILI_MASTER_KEY" \
  -H 'Content-Type: application/json' -d '{"uid":"works","primaryKey":"id"}'
curl -s -X PATCH $B/indexes/works/settings -H "Authorization: Bearer $MEILI_MASTER_KEY" \
  -H 'Content-Type: application/json' --data-binary @../../search/settings.json
curl -s -X POST $B/indexes/works/documents -H "Authorization: Bearer $MEILI_MASTER_KEY" \
  -H 'Content-Type: application/json' --data-binary @../../search/documents.json
curl -s -X POST $B/keys -H "Authorization: Bearer $MEILI_MASTER_KEY" -H 'Content-Type: application/json' \
  -d '{"name":"local dev","actions":["search"],"indexes":["works"],"expiresAt":null}'
# copy the returned "key" value into .dev.vars below
```

Create `workers/search-api/.dev.vars` (gitignored), pointing at the local
Meilisearch instead of production:

```
MEILI_SEARCH_KEY=<the key from above>
MEILI_URL=http://127.0.0.1:7700
```

Then, from this directory:

```bash
npx wrangler dev --port 8789
curl "http://localhost:8789/search?q=太宰"
```

## Production setup

1. The Render Meilisearch instance must already be deployed (see
   `search/README.md`) and its search-only key obtained.
2. Update `MEILI_URL` and `ALLOWED_ORIGINS` in `wrangler.jsonc` if they change
   (neither is a secret — the URL is public, and the allow-list only limits
   which sites' browsers can read the response).
3. Deploy and set the secret, from this directory:

   ```bash
   npx wrangler deploy
   npx wrangler secret put MEILI_SEARCH_KEY
   ```

   Deploy first, then set the secret — the Worker fails closed (`500`) on
   `/search` while the secret is missing, so there is no window where search
   works unauthenticated.
4. `npx wrangler logout` afterwards (this project does not stay logged in
   between sessions).
