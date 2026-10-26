### Version

Playwright 1.63.0, bundled Firefox 155.0 (firefox-1543), Ubuntu 24.04 x86_64, Node 26.12.1. This report is about Firefox snapshot fidelity; it is separate from Linux WebKit rendering/performance issues.

### Reproduction

A single fixed translucent header over 4px black/white stripes renders blurred on the display, but `page.screenshot()` omits the blur. Removing the blur changes 128,000 display pixels and **zero** screenshot API pixels (1280×100 header). There are no frameworks, app code, scrolling, animations or large DOM trees in the reproduction.

```js
import { firefox } from 'playwright';
const browser = await firefox.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 480 } });
await page.setContent(`<style>
  body { margin:0; }
  #pattern { position:fixed; inset:0;
    background:repeating-linear-gradient(90deg,#000 0 4px,#fff 4px 8px); }
  header { position:fixed; inset:0 0 auto; height:100px;
    background:#10203066; backdrop-filter:blur(14px); }
</style><div id="pattern"></div><header></header>`);
await page.waitForTimeout(500);
await page.screenshot({ path: 'blurred-api.png' });
// Observe/capture the actual display here: the stripes behind the header are blurred.
await page.evaluate(() => document.querySelector('header').style.backdropFilter = 'none');
await page.waitForTimeout(500);
await page.screenshot({ path: 'sharp-api.png' });
// Observe/capture the display again: the stripes behind the header are now sharp.
await browser.close();
```

A complete finite harness, including dependency-free Xvfb framebuffer-to-PNG capture and pixel comparison, is committed here:

- [standalone reproduction](https://github.com/konard/konard.github.io/blob/1098eca31b96cfbb2a0fe57c471da169a506746a/experiments/issue-23-blur-probe.mjs)
- [display capture helper](https://github.com/konard/konard.github.io/blob/1098eca31b96cfbb2a0fe57c471da169a506746a/experiments/issue-23-display-capture.mjs)

From that repository, after `npm ci` and `npx playwright install --with-deps firefox`:

```sh
mkdir -p /tmp/blur-display
ENGINE=firefox XWD_FILE=/tmp/blur-display/Xvfb_screen0 \
  xvfb-run -a -s '-screen 0 1600x700x24 -fbdir /tmp/blur-display' \
  node experiments/issue-23-blur-probe.mjs
```

Output: `{"engine":"firefox","version":"155.0","pixels":{"Api":0,"Display":128000}}`.
The harness writes both pairs of PNGs to `docs/case-studies/issue-23/screenshots/` and closes the browser.

### Expected / actual

Screenshots should include the same backdrop effect visible on the display. Currently an automated blur regression check fails even though the browser visibly renders the correct effect; accepting computed CSS alone would miss real rendering regressions.

### Related upstream cause and suggested code change

Mozilla already tracks the snapshot limitation in [bug 1657997](https://bugzilla.mozilla.org/show_bug.cgi?id=1657997), including discussion of the non-WebRender screenshot path. Playwright's [`Page.screenshot` handler](https://github.com/microsoft/playwright/blob/v1.63.0/browser_patches/firefox/juggler/protocol/PageHandler.js#L339) currently calls `currentWindowGlobal.drawSnapshot`. That is a concrete investigation point; I have not patched or instrumented Firefox internals.

Could the Firefox screenshot implementation capture the composited WebRender output (with the same clip and device scale semantics), or expose/document a compositor capture option? A regression fixture comparing this striped backdrop before/after disabling blur would prevent omission from going unnoticed. The older filter screenshot report #13605 was closed with a request to file a fresh actionable reproduction.

### Workaround

For visible-compositor regression tests on Linux, run Firefox headed under Xvfb and capture its actual framebuffer, as the helper above does. This preserves the CSS effect and verifies pixels instead of removing blur or weakening the assertion. It is a test harness workaround, not a proposed application CSS change.
