import { getWorks } from '../lib/works';

// A file ending in `.json.js` becomes a route that returns a Response
// instead of an HTML page. Building this produces dist/search.json — a
// "static API" with no server needed. Search.astro fetches it in the
// browser and filters client-side. This is a placeholder for M6, where a
// real search engine (Meilisearch) takes over.
export async function GET() {
  const works = await getWorks();
  const entries = works.map((work) => ({
    title: work.data.title,
    author: work.data.author,
    summary: work.data.summary,
    url: `/works/${work.id}`,
  }));

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}
