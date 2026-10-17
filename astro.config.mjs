// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// User site (YashS96.github.io) is served from the domain root.
// For a project site (github.com/YashS96/<repo>), set base: '/<repo>'.
export default defineConfig({
  site: 'https://yashs96.github.io',
  base: '/',
  trailingSlash: 'ignore',
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
