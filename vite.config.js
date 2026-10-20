import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Every page is its own HTML entry (a real URL on GitHub Pages, no client-side
// routing). The home page must stay `index` so build/index.html keeps its name.
const PAGES = ['repositories', 'experience', 'research', 'associative', 'art', 'blog'];
const input = Object.fromEntries([
  ['index', resolve(import.meta.dirname, 'index.html')],
  ...PAGES.map((page) => [page, resolve(import.meta.dirname, page, 'index.html')]),
]);

// The site is served from the root of https://konard.github.io, and the
// deploy job publishes build/ with actions/deploy-pages (see .github/workflows/github-pages.yml).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: { input },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.test.{js,jsx}'],
    testTimeout: 10000,
  },
});
