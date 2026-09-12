#!/usr/bin/env node
// Import src/content/works.json into microCMS via the Content (Write) API.
//
// Not run yet — there is no microCMS account/service for this project as of
// writing this script. This is the code for Phase B of M2 (see PLAN.md),
// which starts once the account exists.
//
// Usage (once MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY are set):
//   node --env-file=.env scripts/import-to-microcms.mjs
//
// What this does:
// - Reads the 100 audited works from src/content/works.json.
// - PUTs each one to /api/v1/works/{id}, using our own `id` (the Aozora
//   Bunko work number) as microCMS's contentId. PUT-with-contentId is an
//   upsert: re-running this script updates existing entries instead of
//   duplicating them, so it's safe to run more than once.
// - The "works" API in microCMS must already exist with a matching content
//   model (see PLAN.md's M2 section / the Zod schema in content.config.ts):
//     title          text field
//     author         text field
//     authorReading  text field (optional)
//     translator     text field (optional)
//     summary        text area
//     genreTags      select field, multiple selection allowed
//                    (options: 小説 / 童話 / 詩 / 随筆 / 戯曲)
//     aozoraCardUrl  text field

import { readFile } from 'node:fs/promises';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const ENDPOINT = 'works';

// Be polite to the API rather than firing 100 requests at once.
const DELAY_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!SERVICE_DOMAIN || !API_KEY) {
    console.error(
      'Missing MICROCMS_SERVICE_DOMAIN or MICROCMS_API_KEY.\n' +
        'Create a .env file (see .env.example) and run with:\n' +
        '  node --env-file=.env scripts/import-to-microcms.mjs',
    );
    process.exit(1);
  }

  const raw = await readFile(new URL('../src/content/works.json', import.meta.url), 'utf-8');
  const works = JSON.parse(raw);

  console.log(`Importing ${works.length} works into microCMS service "${SERVICE_DOMAIN}"...`);

  let ok = 0;
  let failed = 0;

  for (const work of works) {
    const { id, ...fields } = work;
    const url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/${ENDPOINT}/${id}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'X-MICROCMS-API-KEY': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fields),
    });

    if (res.ok) {
      ok += 1;
    } else {
      failed += 1;
      const body = await res.text();
      console.error(`FAILED id=${id} (${work.title}): ${res.status} ${body}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`Done. ${ok} succeeded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();
