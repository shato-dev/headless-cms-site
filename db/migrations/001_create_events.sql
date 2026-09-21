-- M5: events table (viewing / interaction log for the works site).
--
-- Idempotent: safe to apply more than once (IF NOT EXISTS everywhere).
-- Apply to the local Postgres (credentials come from the container's own env,
-- so nothing secret appears on the host command line):
--   docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < db/migrations/001_create_events.sql
--
-- Columns vs JSONB: fields we filter/group by in almost every query are real
-- columns; the details that differ per event_type live in `payload` (JSONB).
--   work_viewed    {"referrer": "search" | "list" | "author"}
--   random_pick    {"genre_filter": ["小説", ...]}
--   quiz_completed {"answers": {"mood": ..., "length": ..., "genre": ...}, "result_work_id": "789"}

CREATE TABLE IF NOT EXISTS events (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type  text        NOT NULL
              CHECK (event_type IN ('work_viewed', 'random_pick', 'quiz_completed')),
  -- microCMS content id (= Aozora Bunko work number). No FK: works live in
  -- microCMS, not in this database. NULL for events not tied to one work.
  work_id     text,
  -- Anonymous random id. Never store IP address, user agent, or real names.
  session_id  text        NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  -- 'seed' marks synthetic rows so they can be deleted without touching real
  -- ones (and without `docker compose down -v`, which wipes the whole volume).
  source      text        NOT NULL DEFAULT 'app',
  payload     jsonb       NOT NULL DEFAULT '{}'::jsonb
              CHECK (jsonb_typeof(payload) = 'object')
);

-- Time-series aggregation per event type (e.g. daily counts).
CREATE INDEX IF NOT EXISTS events_type_time_idx
  ON events (event_type, occurred_at);

-- Containment queries: WHERE payload @> '{"referrer": "search"}'.
-- jsonb_path_ops is smaller/faster than the default GIN operator class but
-- only supports @> (not the key-existence operators ?, ?|, ?&).
CREATE INDEX IF NOT EXISTS events_payload_gin_idx
  ON events USING gin (payload jsonb_path_ops);
