import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://magech.ai',
  integrations: [mdx(), sitemap()],
  build: {
    format: 'directory'
  }
});
