-- Learning queries for the `events` table: JSONB operators and aggregation.
-- Read-only (SELECT / EXPLAIN only). Run the whole file with:
--   docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < db/queries/events-jsonb.sql

\echo '=== 1. -> returns JSONB, ->> returns text ==='
-- -> keeps the JSON type (note the quotes in as_jsonb); ->> gives plain text,
-- which is what you want for GROUP BY / comparisons / casting.
SELECT payload -> 'referrer'  AS as_jsonb,
       payload ->> 'referrer' AS as_text
FROM events
WHERE event_type = 'work_viewed'
LIMIT 3;

\echo '=== 2. Group by a JSONB field ==='
SELECT payload ->> 'referrer' AS referrer, count(*) AS views
FROM events
WHERE event_type = 'work_viewed'
GROUP BY 1
ORDER BY 2 DESC;

\echo '=== 3. @> containment (the operator the GIN index serves) ==='
-- "payload contains this JSON fragment". Same result as
-- payload ->> 'referrer' = 'search', but @> can use the GIN index.
SELECT count(*) AS search_views
FROM events
WHERE payload @> '{"referrer": "search"}';

\echo '=== 4. Nested fields: -> chains, or #>> with a path ==='
SELECT payload -> 'answers' ->> 'mood'  AS mood,
       payload #>> '{answers,genre}'    AS genre,
       count(*)
FROM events
WHERE event_type = 'quiz_completed'
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 5;

\echo '=== 5. Unpack a JSON array into rows ==='
-- genre_filter is an array (empty = "no filter"); jsonb_array_elements_text
-- turns each element into its own row so it can be counted.
SELECT g AS genre, count(*) AS picks
FROM events,
     jsonb_array_elements_text(payload -> 'genre_filter') AS g
WHERE event_type = 'random_pick'
GROUP BY 1
ORDER BY 2 DESC;

\echo '=== 6. Daily counts per event type (date_trunc) ==='
SELECT date_trunc('day', occurred_at)::date AS day, event_type, count(*)
FROM events
WHERE occurred_at >= now() - interval '7 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

\echo '=== 7. Most viewed works ==='
-- Only ids: titles live in microCMS, not in this database.
SELECT work_id, count(*) AS views
FROM events
WHERE event_type = 'work_viewed'
GROUP BY 1
ORDER BY 2 DESC, 1
LIMIT 5;

\echo '=== 8. @> uses the GIN index; ->> = does not ==='
-- Same rows, different plans. @> matches the GIN index's operator class
-- (jsonb_path_ops), so the planner uses it (Bitmap Index Scan). The ->>
-- equality is an expression on the column, which that index knows nothing
-- about, so it falls back to a Seq Scan. (Observed on ~2.3k rows: the planner
-- already picks the index for @> at this size.)
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT count(*) FROM events WHERE payload @> '{"referrer": "search"}';

EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT count(*) FROM events WHERE payload ->> 'referrer' = 'search';
