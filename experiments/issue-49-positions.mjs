/* global document, getComputedStyle, scrollX, scrollY */
// Issue #49: the cards of /experience/. Measures, for the first cards, where the
// coloured stripe lies against the border of the card, and the empty space in
// the middle of the text (between the summary text and what follows it), and
// takes a screenshot of the first row of cards.
//   node experiments/issue-49-positions.mjs [out.png] [width]
// SETTINGS='<settings JSON>' stores settings before the page loads; BASE overrides the URL.
import { chromium } from 'playwright';

const [out, width = '1440'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 }, colorScheme: 'dark' });
await page.addInitScript(
  (value) => localStorage.setItem('settings', value),
  process.env.SETTINGS || JSON.stringify({ 'motion.mode': 'off' }),
);
await page.goto(`${process.env.BASE || 'http://localhost:3000'}/experience/`, { waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.addStyleTag({ content: 'header, nav, .topbar, .subnav { position: static !important; }' });
const rows = await page.evaluate(() =>
  [...document.querySelectorAll('.position')].slice(0, 6).map((card) => {
    const box = card.getBoundingClientRect();
    const cs = getComputedStyle(card);
    const stripe = getComputedStyle(card, '::before');
    const summary = card.querySelector('.position__summary');
    const range = document.createRange();
    range.selectNodeContents(summary);
    const text = range.getBoundingClientRect();
    const next = summary.nextElementSibling.getBoundingClientRect();
    return {
      title: card.querySelector('.position__title').textContent.trim().slice(0, 28),
      height: Math.round(box.height),
      border: cs.borderLeftWidth,
      stripe: `${stripe.left} ${stripe.top} ${stripe.width}×${stripe.bottom} ${stripe.opacity}`,
      // Empty pixels between the end of the summary text and the next part of the card.
      gap: Math.round(next.top - text.bottom),
      tagsAtBottom: Math.round(box.bottom - card.querySelector('.tags').getBoundingClientRect().bottom),
    };
  }),
);
console.table(rows);
if (out) {
  const box = await page.evaluate(() => {
    const r = document.querySelector('.positions').getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, width: r.width };
  });
  await page.screenshot({
    path: out,
    fullPage: true,
    clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: Number(process.env.HEIGHT || 1120) },
  });
}
await browser.close();
