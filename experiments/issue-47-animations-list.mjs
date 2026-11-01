/* global document */
// Issue #47 (C5): lists the animations running on a page of the built site
// (name, element and animated properties), to find animated elements that are
// costly to restyle on every frame.
// Usage: npm run build && node experiments/issue-47-animations-list.mjs [path]
import { chromium } from 'playwright';
import { preview } from 'vite';
const server = await preview({ preview: { port: 4194, strictPort: true }, logLevel: 'error' });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4194' + (process.argv[2] || '/') + '?lang=en', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
console.log(
  JSON.stringify(
    await page.evaluate(() =>
      document.getAnimations().map((a) => {
        const t = a.effect?.target;
        const kf = a.effect?.getKeyframes?.() || [];
        return {
          name: a.animationName || a.transitionProperty || a.constructor.name,
          play: a.playState,
          target: t
            ? (t.tagName + '.' + (t.className?.baseVal ?? t.className)).slice(0, 80) + (a.effect.pseudoElement || '')
            : null,
          props: [
            ...new Set(
              kf.flatMap((k) =>
                Object.keys(k).filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p)),
              ),
            ),
          ],
        };
      }),
    ),
    null,
    1,
  ),
);
await browser.close();
await server.close();
