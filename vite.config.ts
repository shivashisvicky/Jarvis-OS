import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // Keep the legacy stylesheet unminified until its escaped-newline tail is retired.
    cssMinify: false,
  },
});
