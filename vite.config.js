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

// Applies the light or dark theme before the first paint, so a light-theme
// visitor never sees a dark flash. The rules match src/i18n/prefs.js: the
// remembered choice, otherwise prefers-color-scheme.
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`;

const themeBeforePaint = () => ({
  name: 'theme-before-paint',
  transformIndexHtml: () => [{ tag: 'script', children: THEME_SCRIPT, injectTo: 'head-prepend' }],
});

// The site is served from the root of https://konard.github.io, and the
// deploy job publishes build/ with actions/deploy-pages (see .github/workflows/github-pages.yml).
export default defineConfig({
  plugins: [react(), themeBeforePaint()],
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
