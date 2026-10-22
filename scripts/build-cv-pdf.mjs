// Prints every CV (position × style × language) of the built site to PDF with
// headless Chromium, as the browser's "Save as PDF" would (issue #11):
//
//   npm run build && npm run build:cv [-- --verbose] [position…]
//
// The PDFs go to build/cv/pdf/ and are published at /cv/pdf/…, the links of
// the "Download PDF" buttons. The script fails when a CV for a position takes
// more than 2 pages, a compact CV more than 1 page, a PDF has no extractable
// text (ATS parsers read the text layer, never images) or a part of the CV is
// positioned (its text would be out of reading order in the PDF).
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'build');
const LANGS = ['en', 'ru'];
const VERBOSE = process.argv.includes('--verbose');
// Positions to print, e.g. `npm run build:cv -- developer rust`; all by default.
const ONLY = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

/** The page limit of a CV: 1 for compact, 2 for a position, none for the full record. */
export const pageLimit = (role, style) => (style === 'compact' ? 1 : role === 'all' ? Infinity : 2);

/** Number of pages of a PDF made by Chromium (its page objects are never compressed). */
export const countPages = (pdf) => (pdf.toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length;

/** True when the fonts carry a ToUnicode map, i.e. the text can be selected and extracted. */
export function hasTextLayer(pdf) {
  const raw = pdf.toString('latin1');
  if (/\/ToUnicode/.test(raw)) return true;
  // Object streams may hide the font dictionaries: look inside them too.
  for (const match of raw.matchAll(/stream\r?\n([\s\S]*?)endstream/g)) {
    try {
      if (inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1').includes('/ToUnicode')) return true;
    } catch {
      // Not a Flate stream.
    }
  }
  return false;
}

/**
 * The parts of the CV that are positioned or floated. Chrome paints them in a
 * later layer and writes their text after the rest of the page into the PDF, so
 * an ATS would read them out of order: the CV must have none. Runs in the page.
 */
export function positionedParts(cv) {
  const parts = [];
  for (const el of [cv, ...cv.querySelectorAll('*')]) {
    for (const pseudo of [null, '::before', '::after']) {
      const style = el.ownerDocument.defaultView.getComputedStyle(el, pseudo);
      if (pseudo && ['none', 'normal', ''].includes(style.content)) continue;
      if (style.position !== 'static' || style.float !== 'none')
        parts.push(`${el.className || el.tagName}${pseudo || ''}`);
    }
  }
  return parts;
}

/** Loads src/cv/buildCv.js through Vite, which resolves its JSON and extensionless imports. */
async function loadBuildCv() {
  const vite = await createServer({
    root: ROOT,
    logLevel: 'error',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  try {
    return await vite.ssrLoadModule('/src/cv/buildCv.js');
  } finally {
    await vite.close();
  }
}

async function main() {
  const { POSITION_IDS, STYLES, cvPagePath, pdfPath } = await loadBuildCv();
  const server = await preview({
    root: ROOT,
    logLevel: 'error',
    preview: { port: 4179, strictPort: false, open: false },
  });
  const base = server.resolvedUrls.local[0].replace(/\/$/, '');
  const browser = await chromium.launch();
  // The PDF is always light, whatever the system theme (issue #11).
  const context = await browser.newContext({ colorScheme: 'light', reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mkdir(path.join(OUT, 'cv', 'pdf'), { recursive: true });

  const failures = [];
  let count = 0;
  try {
    for (const lang of LANGS) {
      for (const role of POSITION_IDS.filter((id) => !ONLY.length || ONLY.includes(id))) {
        for (const style of STYLES) {
          const url = `${base}${cvPagePath({ role, style, lang })}`;
          await page.goto(url, { waitUntil: 'networkidle' });
          await page.waitForSelector(`.cv[data-cv-role="${role}"][data-cv-style="${style}"][lang="${lang}"]`);
          await page.emulateMedia({ media: 'print', colorScheme: 'light' });
          const layered = await page.locator('.cv').evaluate(positionedParts);
          if (layered.length) failures.push(`${role} ${style} ${lang}: positioned ${layered.join(', ')}`);
          const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true });
          await page.emulateMedia({ media: 'screen' });
          const file = path.join(OUT, pdfPath({ role, style, lang }));
          await writeFile(file, pdf);
          const pages = countPages(pdf);
          const limit = pageLimit(role, style);
          if (VERBOSE) console.log(`${path.relative(ROOT, file)}: ${pages} page(s)`);
          if (pages < 1 || pages > limit) failures.push(`${role} ${style} ${lang}: ${pages} pages, limit ${limit}`);
          if (!hasTextLayer(pdf)) failures.push(`${role} ${style} ${lang}: no extractable text`);
          count += 1;
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  if (errors.length) failures.push(...errors.map((e) => `page error: ${e}`));
  if (failures.length) {
    console.error(`CV PDF checks failed:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`Printed ${count} CV PDFs to build/cv/pdf/.`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
