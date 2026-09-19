// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Public URL of the deployed site (Cloudflare Workers). Used for absolute
  // URLs such as canonical links or a sitemap. `base` is not needed because
  // the site is served from the root of the domain.
  site: 'https://headless-cms-site.shato-dev.workers.dev',
});
