import type { Loader } from 'astro/loaders';

// Custom Content Layer loader: fetches every entry from a microCMS list-type
// API and stores it in the collection, keyed by microCMS's contentId (the
// same id we chose when importing — see scripts/import-to-microcms.mjs).
// This replaces the file() loader that read src/content/works.json directly;
// the schema in content.config.ts is unchanged, so no page/component code
// needed to change when this swap happened.
export function microcmsLoader(endpoint: string): Loader {
  return {
    name: 'microcms-loader',

    load: async ({ store, parseData, logger }) => {
      const domain = import.meta.env.MICROCMS_SERVICE_DOMAIN ?? process.env.MICROCMS_SERVICE_DOMAIN;
      const apiKey = import.meta.env.MICROCMS_API_KEY ?? process.env.MICROCMS_API_KEY;

      if (!domain || !apiKey) {
        throw new Error(
          'Missing MICROCMS_SERVICE_DOMAIN or MICROCMS_API_KEY. ' +
            'Create a .env file (see .env.example) before building.',
        );
      }

      const limit = 100; // microCMS's per-request max
      let offset = 0;
      const items: Record<string, unknown>[] = [];

      while (true) {
        const url = `https://${domain}.microcms.io/api/v1/${endpoint}?limit=${limit}&offset=${offset}`;
        const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': apiKey } });

        if (!res.ok) {
          throw new Error(`microCMS fetch failed: ${res.status} ${await res.text()}`);
        }

        const page = (await res.json()) as { contents: Record<string, unknown>[]; totalCount: number };
        items.push(...page.contents);
        offset += limit;
        if (offset >= page.totalCount) break;
      }

      logger.info(`Fetched ${items.length} entries from microCMS "${endpoint}"`);

      store.clear();
      for (const item of items) {
        const { id, ...data } = item;
        const parsedData = await parseData({ id: String(id), data });
        store.set({ id: String(id), data: parsedData });
      }
    },
  };
}
