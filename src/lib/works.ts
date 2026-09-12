import { getCollection } from 'astro:content';

// Shared helper: all works, sorted by author then title (Japanese collation).
// There's no natural "newest first" order here (unlike a blog's date), so an
// alphabetical-by-author browse order is the most useful default.
export async function getWorks() {
  const works = await getCollection('works');
  return works.sort(
    (a, b) =>
      a.data.author.localeCompare(b.data.author, 'ja') ||
      a.data.title.localeCompare(b.data.title, 'ja'),
  );
}

// [authorName, workCount][], sorted alphabetically.
export async function getAuthors() {
  const works = await getWorks();
  const counts = new Map<string, number>();
  for (const work of works) {
    counts.set(work.data.author, (counts.get(work.data.author) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ja'));
}

// [genreTag, workCount][], sorted by count descending (most common genre first).
export async function getGenres() {
  const works = await getWorks();
  const counts = new Map<string, number>();
  for (const work of works) {
    for (const tag of work.data.genreTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
