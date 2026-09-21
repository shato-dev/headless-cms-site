#!/usr/bin/env node
// Seed the `events` table (db/migrations/001_create_events.sql) with synthetic
// events, so there is data to aggregate before any real feature emits events.
//
// Usage (local Postgres from docker-compose.yml must be up and migrated):
//   node --env-file=.env scripts/seed-events.mjs
//
// What this does:
// - Deletes every row with source = 'seed', then inserts a fresh batch, all in
//   one transaction. Re-running is safe and never touches real (source='app')
//   rows. The random generator is seeded, so each run produces the same data.
// - Uses the work ids in src/content/works.json. Popularity is skewed (a few
//   works get most views), so "top works" queries have something to rank.
// - Refuses to run against a non-local host unless --allow-remote is passed.
//
// Connection: DATABASE_URL if set, else POSTGRES_USER / POSTGRES_PASSWORD /
// POSTGRES_DB from .env against 127.0.0.1:5432 (the port docker-compose.yml
// publishes on loopback).

import { readFile } from 'node:fs/promises';
import pg from 'pg';

const SESSION_COUNT = 800;
const DAYS_BACK = 30;

// mulberry32: tiny seeded PRNG. Math.random() can't be seeded, and we want
// identical data on every run.
function makeRng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20260921);

const pick = (items) => items[Math.floor(rng() * items.length)];

// Pick an index with probability proportional to weights[i].
function pickWeighted(weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function connectionConfig() {
  if (process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB } = process.env;
  if (!POSTGRES_USER || !POSTGRES_PASSWORD || !POSTGRES_DB) {
    console.error(
      'Missing POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB (or DATABASE_URL).\n' +
        'Create a .env file (see .env.example) and run with:\n' +
        '  node --env-file=.env scripts/seed-events.mjs',
    );
    process.exit(1);
  }
  return {
    host: '127.0.0.1',
    port: 5432,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
  };
}

function isLocalHost(config) {
  const host = config.connectionString ? new URL(config.connectionString).hostname : config.host;
  return ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(host);
}

function generateEvents(works) {
  // Zipf-like popularity over a shuffled copy: weight of the k-th work is 1/(k+1).
  const shuffled = [...works].sort(() => rng() - 0.5);
  const weights = shuffled.map((_, k) => 1 / (k + 1));
  const popularWork = () => shuffled[pickWeighted(weights)];

  // Evening-heavy hours (0-23), so daily/hourly aggregation isn't flat.
  const hourWeights = Array.from({ length: 24 }, (_, h) => (h >= 19 && h <= 23 ? 5 : h >= 7 ? 2 : 0.3));

  const now = Date.now();
  const events = [];
  for (let s = 0; s < SESSION_COUNT; s += 1) {
    // The PRNG yields 32 bits per call, so draw twice to fill 12 hex digits.
    const hex6 = () => Math.floor(rng() * 2 ** 24).toString(16).padStart(6, '0');
    const sessionId = `s_${hex6()}${hex6()}`;
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - Math.floor(rng() * DAYS_BACK));
    start.setUTCHours(pickWeighted(hourWeights), Math.floor(rng() * 60), Math.floor(rng() * 60), 0);
    // Picking "today" plus an evening hour can land in the future; move such
    // sessions back a day so no event is dated after now.
    if (start.getTime() > now) start.setUTCDate(start.getUTCDate() - 1);

    let clock = start.getTime();
    const push = (eventType, workId, payload) => {
      // Events within a session are seconds apart; never past `now`.
      clock = Math.min(clock + Math.floor(rng() * 90_000), now);
      events.push({
        event_type: eventType,
        work_id: workId,
        session_id: sessionId,
        occurred_at: new Date(clock).toISOString(),
        payload,
      });
    };

    const referrers = ['list', 'search', 'author'];
    const viewCount = 1 + Math.floor(rng() * 4);
    for (let v = 0; v < viewCount; v += 1) {
      push('work_viewed', popularWork().id, { referrer: referrers[pickWeighted([5, 3, 2])] });
    }

    if (rng() < 0.25) {
      const genre = pick(['小説', '童話', '詩', '随筆', '戯曲']);
      const candidates = works.filter((w) => w.genreTags.includes(genre));
      const chosen = pick(candidates.length > 0 ? candidates : works);
      push('random_pick', chosen.id, { genre_filter: rng() < 0.5 ? [genre] : [] });
    }

    if (rng() < 0.15) {
      const genre = pick(['小説', '童話', '詩', '随筆', '戯曲']);
      const candidates = works.filter((w) => w.genreTags.includes(genre));
      const result = pick(candidates.length > 0 ? candidates : works);
      push('quiz_completed', null, {
        answers: {
          mood: pick(['calm', 'energetic', 'melancholy']),
          length: pick(['short', 'medium', 'long']),
          genre,
        },
        result_work_id: result.id,
      });
    }
  }
  return events;
}

async function main() {
  const config = connectionConfig();
  const target = config.connectionString ? new URL(config.connectionString).hostname : config.host;
  if (!isLocalHost(config) && !process.argv.includes('--allow-remote')) {
    console.error(`Refusing to seed non-local host "${target}". Pass --allow-remote if you really mean it.`);
    process.exit(1);
  }

  const works = JSON.parse(
    await readFile(new URL('../src/content/works.json', import.meta.url), 'utf-8'),
  );
  const events = generateEvents(works);

  const client = new pg.Client(config);
  await client.connect();
  try {
    await client.query('BEGIN');
    const deleted = await client.query("DELETE FROM events WHERE source = 'seed'");
    // One statement inserts everything: the whole array is passed as a single
    // JSONB parameter and unpacked with jsonb_to_recordset (parameterized, so
    // no string-built SQL).
    const inserted = await client.query(
      `INSERT INTO events (event_type, work_id, session_id, occurred_at, source, payload)
       SELECT event_type, work_id, session_id, occurred_at, 'seed', payload
       FROM jsonb_to_recordset($1::jsonb) AS e(
         event_type text, work_id text, session_id text, occurred_at timestamptz, payload jsonb
       )`,
      [JSON.stringify(events)],
    );
    await client.query('COMMIT');
    console.log(`Seeded ${inserted.rowCount} events on ${target} (replaced ${deleted.rowCount} old seed rows).`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    // Node keeps the process alive while a connection is open (unlike a Python
    // script, which exits when the code ends), so close it explicitly.
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
