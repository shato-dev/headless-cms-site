import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

// "works" collection: Aozora Bunko (public-domain Japanese literature) works,
// each with an original summary written for this project.
// - loader: where the entries come from. `file()` reads a local JSON array
//   keyed by `id` (astro-warmup used `glob()` for many Markdown files; this
//   is the single-file equivalent). This later gets swapped for a custom
//   loader that fetches from microCMS — the schema below stays the same,
//   so pages/components don't need to change when that happens.
// - schema: the shape each entry must have (like a SQL table definition).
//   A mismatch fails the build instead of breaking at runtime.
const works = defineCollection({
  loader: file('src/content/works.json'),
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
