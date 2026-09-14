import { defineCollection, z } from 'astro:content';
import { microcmsLoader } from './lib/microcms-loader';

// "works" collection: Aozora Bunko (public-domain Japanese literature) works,
// each with an original summary written for this project.
// - loader: where the entries come from. Originally `file()` reading
//   src/content/works.json directly (astro-warmup used `glob()` for many
//   Markdown files; file() is the single-file equivalent) — now swapped for
//   microcmsLoader(), which fetches the same data from microCMS. The schema
//   below is unchanged, so pages/components needed no changes for the swap.
//   The 100 works were pushed to microCMS once via
//   scripts/import-to-microcms.mjs; src/content/works.json stays in the repo
//   as the source of truth for that import, not as the live data source.
// - schema: the shape each entry must have (like a SQL table definition).
//   A mismatch fails the build instead of breaking at runtime.
const works = defineCollection({
  loader: microcmsLoader('works'),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    authorReading: z.string().optional(),
    translator: z.string().optional(), // set for translated works (e.g. Koizumi Yakumo)
    summary: z.string(),
    genreTags: z.array(z.enum(['小説', '童話', '詩', '随筆', '戯曲'])),
    aozoraCardUrl: z.string().url(),
  }),
});

export const collections = { works };
