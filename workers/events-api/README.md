# events-api

Read-only JSON API over the Postgres `events` table (M5 Phase 2). A Cloudflare
Worker that reaches Postgres through Hyperdrive with the `pg` driver.

| Endpoint | Query parameters | Returns |
|---|---|---|
| `GET /stats/daily` | `type` (optional), `days` (1-90, default 7) | daily counts per event type |
| `GET /stats/top-works` | `days` (1-365, default 30), `limit` (1-50, default 10) | most viewed works |
| `GET /events` | `type` (optional), `limit` (1-100, default 20) | latest events (no `session_id`) |

Invalid input returns `400`, unknown paths `404`, non-GET methods `405`.
Event types: `work_viewed`, `random_pick`, `quiz_completed`.

## Run locally

Needs the local Postgres from `docker-compose.yml`, migrated and seeded
(`db/migrations/001_create_events.sql`, `scripts/seed-events.mjs`).

Run from this directory. The connection string is built from the repo's `.env`
(gitignored) and passed through the environment variable Hyperdrive reads in
local dev, so no credentials are stored in `wrangler.jsonc`:

```bash
set -a; . ../../.env; set +a
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@127.0.0.1:5432/$POSTGRES_DB"
npx wrangler dev --port 8788
```

Then: `curl 'http://localhost:8788/stats/top-works?limit=3'`.

The variable name is `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_<BINDING>`;
the binding here is `HYPERDRIVE`. If the password contains URL-special
characters it must be percent-encoded. In this mode the Worker connects to
Postgres directly (Hyperdrive pooling and caching are not active).

## Not done yet

`wrangler.jsonc` holds a placeholder Hyperdrive id, so this Worker cannot be
deployed as is. Production database and deployment are Phase 3 of M5.
