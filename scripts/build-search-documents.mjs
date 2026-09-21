#!/usr/bin/env node
// Build search/documents.json: the documents Meilisearch indexes (M6).
//
// Fetches every entry of the microCMS "works" API and keeps only the fields
// the search needs. The output is committed to the repo because the Meilisearch
// container on Render Free has no persistent disk: it rebuilds its index from
// this file every time it starts (see search/entrypoint.sh). The content is the
// same public text the site already publishes.
//
// Usage:
//   node --env-file=.env scripts/build-search-documents.mjs
//
// Re-run it (and commit the result) after the microCMS content changes.

import { writeFile } from 'node:fs/promises';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const ENDPOINT = 'works';
const OUTPUT = new URL('../search/documents.json', import.meta.url);

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error(
    'Missing MICROCMS_SERVICE_DOMAIN or MICROCMS_API_KEY.\n' +
      'Run with: node --env-file=.env scripts/build-search-documents.mjs',
  );
  process.exit(1);
}

// microCMS returns at most 100 entries per request, so page through them.
const limit = 100;
let offset = 0;
const items = [];

while (true) {
  const url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/${ENDPOINT}?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': API_KEY } });
  if (!res.ok) {
    console.error(`microCMS fetch failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const page = await res.json();
  items.push(...page.contents);
  offset += limit;
  if (offset >= page.totalCount) break;
}

// Pick fields explicitly so microCMS bookkeeping fields (createdAt, revisedAt,
// ...) and unused ones (aozoraCardUrl) never end up in the index.
// Meilisearch's primary key is `id`. Sorting by id keeps git diffs small and stable.
const documents = items
  .map((item) => ({
    id: String(item.id),
    title: item.title,
    author: item.author,
    authorReading: item.authorReading ?? '',
    summary: item.summary,
    genreTags: item.genreTags ?? [],
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

await writeFile(OUTPUT, JSON.stringify(documents, null, 2) + '\n');
console.log(`Wrote ${documents.length} documents to search/documents.json`);
