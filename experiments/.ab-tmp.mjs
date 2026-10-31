/* global document, performance */
import { chromium } from 'playwright';
import { createServer } from 'vite';
const PORT = 4254;
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('https://**', (r) => r.abort());
  await page.addInitScript(() => localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' })));
  await page.goto(`http://localhost:${PORT}/settings/?lang=en`);
  await page.locator('main').waitFor();
  await page.waitForTimeout(1500);
  const out = await page.evaluate(() => {
    const root = document.documentElement;
    const restyle = (n = 6) => { const s = performance.now(); for (let i = 0; i < n; i++) { root.style.setProperty('--probe', String(i + Math.random())); void document.body.offsetHeight; } return (performance.now() - s) / n; };
    const sheet = [...document.styleSheets].find((s) => s.ownerNode?.dataset?.viteDevId?.endsWith('skins.future.css'));
    const original = [...sheet.cssRules].map((r) => r.cssText);
    const replaceAll = (fn) => { while (sheet.cssRules.length) sheet.deleteRule(0); original.forEach((t, i) => sheet.insertRule(fn(t), i)); };
    const measure = () => { restyle(2); return Math.round(Math.min(restyle(), restyle())); };
    const res = { original: measure() };
    const framed = (t) => /^:root[^{]*:where\(\.card/.test(t) && /--fx-/.test(t);
    res.framedRules = original.filter(framed).length;
    // A: the same declarations on :root only (no matching, no per-element substitution).
    replaceAll((t) => (framed(t) ? t.replace(/^[^{]*\{/, (sel) => sel.split(/,\s*(?=:root)/).filter((s) => !s.includes(':where(')).join(', ').replace(/,?\s*\{$/, '') + ' {') : t));
    res.rootOnly = measure();
    // B: the same selectors with one tiny declaration (matching cost only).
    replaceAll((t) => (framed(t) ? t.replace(/\{[\s\S]*\}$/, '{ --fx-dummy: 1; }') : t));
    res.selectorsOnly = measure();
    replaceAll((t) => t);
    res.restored = measure();
    return res;
  });
  console.log(JSON.stringify(out));
} finally { await browser.close(); await server.close(); }
