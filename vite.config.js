import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { applySettings, normalize } from './src/settings/apply.js';
import { CSS_RULES } from './src/settings/schema.js';

// Every page is its own HTML entry (a real URL on GitHub Pages, no client-side
// routing). The home page must stay `index` so build/index.html keeps its name.
const PAGES = ['repositories', 'experience', 'research', 'associative', 'art', 'blog', 'cv', 'settings', 'network'];
const input = Object.fromEntries([
  ['index', resolve(import.meta.dirname, 'index.html')],
  ...PAGES.map((page) => [page, resolve(import.meta.dirname, page, 'index.html')]),
]);

// Applies the light or dark theme before the first paint, so a light-theme
// visitor never sees a dark flash. The rules match src/i18n/prefs.js: the
// remembered choice, otherwise prefers-color-scheme.
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`;

// Applies the remembered settings (skin, background, notation; issue #13)
// before the first paint with the same rules as src/settings/store.js, so a
// visitor with the futuristic skin never sees the glass one first.
const inline = (fn) => String(fn).replace(/\s*\n\s*/g, ' ');
export const SETTINGS_SCRIPT = `(function(){try{${inline(normalize)};${inline(applySettings)};var r=${JSON.stringify(CSS_RULES)};applySettings(document.documentElement,r,normalize(r,JSON.parse(localStorage.getItem('settings')||'{}')))}catch(e){}})();`;

const buildIdentity = () => ({
  name: 'build-identity',
  generateBundle() {
    let sha = process.env.GITHUB_SHA;
    if (!sha) {
      try {
        sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: 'pipe' }).trim();
      } catch {
        // Source archives remain buildable without Git. Hosted deploys always
        // supply GITHUB_SHA and the deployment probe requires that exact SHA.
        sha = 'unversioned';
      }
    }
    this.emitFile({ type: 'asset', fileName: 'build-info.json', source: JSON.stringify({ sha }) + '\n' });
  },
});

const themeBeforePaint = () => ({
  name: 'theme-before-paint',
  transformIndexHtml: () => [{ tag: 'script', children: THEME_SCRIPT + SETTINGS_SCRIPT, injectTo: 'head-prepend' }],
});

// The site is served from the root of https://konard.github.io, and the
// deploy job publishes build/ with actions/deploy-pages (see .github/workflows/github-pages.yml).
export default defineConfig({
  plugins: [react(), themeBeforePaint(), buildIdentity()],
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
    maxWorkers: 1,
  },
});
