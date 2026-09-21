# events-api

Read-only JSON API over the Postgres `events` table (M5). A Cloudflare Worker
that reaches Postgres through Hyperdrive with the `pg` driver. The database is
Neon (Free plan); the Worker connects as `events_reader`, a role that can only
`SELECT` from `events`.

| Endpoint | Query parameters | Returns |
|---|---|---|
| `GET /stats/daily` | `type` (optional), `days` (1-90, default 7) | daily counts per event type |
| `GET /stats/top-works` | `days` (1-365, default 30), `limit` (1-50, default 10) | most viewed works |
| `GET /events` | `type` (optional), `limit` (1-100, default 20) | latest events (no `session_id`) |

Event types: `work_viewed`, `random_pick`, `quiz_completed`.

## Authentication

Every request needs `Authorization: Bearer <token>`; the token is the `API_TOKEN`
secret. Auth is checked first, so any request without a valid token gets `401`
(for every path and method) and never reaches the database. If `API_TOKEN` is
not configured the Worker answers `500` to everything (fail closed). The token
is not accepted in the query string. Other responses: invalid input `400`,
unknown path `404`, non-GET `405`.

```bash
curl -H "Authorization: Bearer $EVENTS_API_TOKEN" '<worker-url>/stats/top-works?limit=3'
```

## Run locally

Needs the local Postgres from `docker-compose.yml`, migrated and seeded
(`db/migrations/001_create_events.sql`, `scripts/seed-events.mjs`).

1. Create `workers/events-api/.dev.vars` (gitignored) with a local-only token:

   ```bash
   printf 'API_TOKEN=%s\n' "$(openssl rand -hex 24)" > .dev.vars
   ```

2. Run from this directory. The connection string is built from the repo's
   `.env` (gitignored) and passed through the environment variable Hyperdrive
   reads in local dev, so no credentials are stored in `wrangler.jsonc`:

   ```bash
   set -a; . ../../.env; set +a
   export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@127.0.0.1:5432/$POSTGRES_DB"
   npx wrangler dev --port 8788
   ```

The variable name is `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_<BINDING>`;
the binding here is `HYPERDRIVE`. If the password contains URL-special
characters it must be percent-encoded. In this mode the Worker connects to
Postgres directly (Hyperdrive pooling and caching are not active).

## Production setup (Neon + Hyperdrive)

Done once, by hand:

1. Neon project (Free plan, Postgres 17). Apply `db/migrations/001_create_events.sql`
   and seed with `scripts/seed-events.mjs --allow-remote` (the owner connection
   string goes in the local `.env` as `DATABASE_URL`, never in the repo).
2. A read-only role, created in the Neon SQL Editor:

   ```sql
   CREATE ROLE events_reader LOGIN PASSWORD '<random password>';
   ALTER ROLE events_reader SET default_transaction_read_only = on;
   GRANT USAGE ON SCHEMA public TO events_reader;
   GRANT SELECT ON events TO events_reader;
   ```

3. A Hyperdrive configuration (Cloudflare dashboard, "public database") named
   `events-db`, using the **direct** (non-pooled) Neon host and the
   `events_reader` credentials. Its id is in `wrangler.jsonc`; the connection
   string itself is stored only in Cloudflare.
4. The API token, entered at the hidden prompt (from this directory):

   ```bash
   npx wrangler secret put API_TOKEN
   ```

5. `npx wrangler deploy` (from this directory). Deploys are manual; this Worker
   is not part of the CI `deploy` job.
