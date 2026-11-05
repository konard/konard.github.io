import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { applySettings, normalize } from './src/settings/apply.js';
import { readStored } from './src/settings/notation.js';
import { isObject, readNotation } from './src/lino.js';
import { CSS_RULES } from './src/settings/schema.js';
import { inlineJSON } from './scripts/inline-json.mjs';
import { frameworkAssets } from './scripts/framework-assets.mjs';

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
export const SETTINGS_SCRIPT = `(function(){try{${inline(readStored)};${inline(normalize)};${inline(applySettings)};var r=${inlineJSON(CSS_RULES)};applySettings(document.documentElement,r,normalize(r,readStored(localStorage.getItem('settings'))))}catch(e){}})();`;

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

// The data of the site is kept as Links Notation instead of JSON (issue #47,
// scripts/lino-data.cjs): `import github from './data/github.lino'` gets the
// object it holds, parsed here when the site is built, so a page neither loads
// the codec nor parses the notation. Keys that are names are also named
// exports, as with JSON (`import { sources } from './data/indicators.lino'`).
const NAME = /^[A-Za-z_$][\w$]*$/;
const isName = (key) => {
  try {
    return NAME.test(key) && Boolean(new Function(`let ${key}; return 1`)());
  } catch {
    return false;
  }
};
export const linoData = () => ({
  name: 'lino-data',
  transform(code, id) {
    // Framework schemas use their own dialect and Vite's ?url/?raw handling.
    if (!id.endsWith('.lino') || id.includes('/node_modules/')) return null;
    const { value } = readNotation(code);
    const names = isObject(value) ? Object.keys(value).filter(isName) : [];
    return {
      code: [
        // JSON.parse of a string is faster to start than an object literal of the same data.
        `const data = JSON.parse(${JSON.stringify(JSON.stringify(value))});`,
        'export default data;',
        ...names.map((key) => `export const ${key} = data.${key};`),
      ].join('\n'),
      map: { mappings: '' },
    };
  },
});

// Vite only warns about a chunk above build.chunkSizeWarningLimit (500 kB), and
// the warning never fails the build, so a 507 kB chunk went unnoticed on main
// (issue #51). The same limit, measured the same way, now fails the build.
export const CHUNK_LIMIT_KB = 500;
export const chunkBudget = (limitKb = CHUNK_LIMIT_KB) => ({
  name: 'chunk-budget',
  writeBundle(_options, bundle) {
    const large = Object.values(bundle)
      .filter((file) => file.type === 'chunk' && file.code.length / 1000 > limitKb)
      .map((file) => `${file.fileName} (${(file.code.length / 1000).toFixed(2)} kB)`);
    if (large.length)
      this.error(
        `Chunks larger than ${limitKb} kB: ${large.join(', ')}. Split them with build.rolldownOptions.output.codeSplitting or dynamic import().`,
      );
  },
});

const themeBeforePaint = () => ({
  name: 'theme-before-paint',
  transformIndexHtml: () => [{ tag: 'script', children: THEME_SCRIPT + SETTINGS_SCRIPT, injectTo: 'head-prepend' }],
});

// The site is served from the root of https://konard.github.io, and the
// deploy job publishes build/ with the Pages deployment API (see .github/workflows/github-pages.yml).
export default defineConfig({
  resolve: {
    alias: [
      {
        // The upstream root barrel also exports Node-only conversion targets.
        // Use its browser-safe DOM importer until a public browser export exists.
        find: /^@link-foundation\/ui-convert$/,
        replacement: resolve(import.meta.dirname, 'node_modules/@link-foundation/ui-convert/src/html/import.js'),
      },
    ],
  },
  plugins: [react(), frameworkAssets(), linoData(), themeBeforePaint(), buildIdentity(), chunkBudget()],
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: CHUNK_LIMIT_KB,
    sourcemap: true,
    rolldownOptions: {
      input,
      // React is shared by every page and changes far less often than the site,
      // so it gets its own cacheable chunk. Without it the shared chunk of the
      // layout passed Vite's 500 kB warning limit (507 kB; issue #51).
      output: {
        codeSplitting: {
          groups: [{ name: 'react', test: /[\\/]node_modules[\\/](?:react|react-dom|scheduler)[\\/]/ }],
        },
      },
    },
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
