import { getWorks } from '../lib/works';

// A file ending in `.json.js` becomes a route that returns a Response
// instead of an HTML page. Building this produces dist/search.json — a
// "static API" with no server needed.
//
// Before M6, Search.astro fetched this directly and filtered client-side.
// Since M6, the primary search is workers/search-api/ (Meilisearch on
// Render). This file is kept as Search.astro's fallback for when that API
// is unavailable — e.g. the Render free instance is asleep — so it is not
// dead code even though the main path no longer calls it on every keystroke.
export async function GET() {
  const works = await getWorks();
  const entries = works.map((work) => ({
    title: work.data.title,
    author: work.data.author,
    summary: work.data.summary,
    genreTags: work.data.genreTags,
    url: `/works/${work.id}`,
  }));

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}
