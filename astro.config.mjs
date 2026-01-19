// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://auroraict.com.au', // change this to your real domain later

  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()]
  }
});