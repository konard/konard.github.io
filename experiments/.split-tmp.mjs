/* global document, performance */
import { chromium, webkit, firefox } from 'playwright';
import { createServer } from 'vite';
const engine = process.env.ENGINE || 'chromium';
const PORT = 4255;
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await { chromium, webkit, firefox }[engine].launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(60000);
  await page.route('https://**', (r) => r.abort());
  await page.addInitScript(() => localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' })));
  await page.goto(`http://localhost:${PORT}/settings/?lang=en`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('main .settings__group'));
  await page.waitForTimeout(2000);
  const out = await page.evaluate(() => {
    const root = document.documentElement;
    const restyle = (n = 6) => { const s = performance.now(); for (let i = 0; i < n; i++) { root.style.setProperty('--probe', String(i + Math.random())); void document.body.offsetHeight; } return (performance.now() - s) / n; };
    const measure = () => { restyle(2); return Math.round(Math.min(restyle(), restyle())); };
    const split = (text) => { const parts = []; let depth = 0, start = 0; for (let i = 0; i < text.length; i++) { const c = text[i]; if (c === '(') depth++; else if (c === ')') depth--; else if (c === ',' && depth === 0) { parts.push(text.slice(start, i).trim()); start = i + 1; } } parts.push(text.slice(start).trim()); return parts; };
    const expand = (selector) => split(selector).flatMap((part) => {
      const m = part.match(/^(.*?):where\((.*)\)$/s);
      if (!m || split(m[2]).length < 2 || m[2].includes(':where(')) return [part];
      return split(m[2]).map((item) => `${m[1]}:where(${item})`);
    }).join(', ');
    const sheets = [...document.styleSheets].filter((s) => /skins\.future\.css|ui\.css|skins\./.test(s.ownerNode?.dataset?.viteDevId || ''));
    const originals = sheets.map((s) => [...s.cssRules].map((r) => r.cssText));
    const res = { elements: document.querySelectorAll('*').length, original: measure() };
    let changed = 0;
    sheets.forEach((sheet, k) => { while (sheet.cssRules.length) sheet.deleteRule(0); originals[k].forEach((t, i) => { const m = t.match(/^([^{]*)\{([\s\S]*)$/); let out = t; if (m && !t.startsWith('@')) { const sel = expand(m[1].trim()); if (sel !== m[1].trim()) { changed++; out = `${sel} {${m[2]}`; } } sheet.insertRule(out, i); }); });
    res.changedRules = changed;
    res.split = measure();
    sheets.forEach((sheet, k) => { while (sheet.cssRules.length) sheet.deleteRule(0); originals[k].forEach((t, i) => sheet.insertRule(t, i)); });
    res.restored = measure();
    return res;
  });
  console.log(engine, JSON.stringify(out));
} finally { await browser.close(); await server.close(); }
