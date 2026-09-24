import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://vmstavens.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  devToolbar: { enabled: false },
});
