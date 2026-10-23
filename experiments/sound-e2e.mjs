// The sound in a real browser (issue #15), against `npx vite preview --port 4173`:
//  1. with the defaults the sound code is not downloaded and no AudioContext is made;
//  2. the switch in the top bar downloads it and plays the intro;
//  3. pointing at and pressing links and buttons, and the ▶ of the settings, play sounds;
//  4. switching it off closes the AudioContext.
// Saves screenshots of the top bar and of the sound settings (desktop and 360 px).
//   node experiments/sound-e2e.mjs <screenshot dir>
/* global window, document */
import { chromium } from 'playwright';

const dir = process.argv[2] || '/tmp';
const base = process.env.BASE || 'http://localhost:4173';
const browser = await chromium.launch();
const failures = [];
const check = (ok, message) => {
  console.log(ok ? 'ok  ' : 'FAIL', message);
  if (!ok) failures.push(message);
};

async function open(path, { width = 1280, theme = 'dark', settings } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
  const scripts = [];
  page.on('request', (request) => request.resourceType() === 'script' && scripts.push(request.url()));
  page.on('pageerror', (error) => failures.push(error.message));
  await page.addInitScript(
    ([settings, theme]) => {
      if (settings) localStorage.setItem('settings', settings);
      localStorage.setItem('theme', theme);
      // Count the contexts and the voices the page makes.
      window.__audio = { contexts: 0, voices: 0, closed: 0 };
      const Original = window.AudioContext;
      window.AudioContext = class extends Original {
        constructor(...args) {
          super(...args);
          window.__audio.contexts++;
        }
        createOscillator() {
          window.__audio.voices++;
          return super.createOscillator();
        }
        createBufferSource() {
          window.__audio.voices++;
          return super.createBufferSource();
        }
        close() {
          window.__audio.closed++;
          return super.close();
        }
      };
    },
    [settings && JSON.stringify(settings), theme],
  );
  await page.goto(`${base}${path}`);
  await page.waitForTimeout(1200);
  return { page, scripts, audio: () => page.evaluate(() => ({ ...window.__audio })) };
}

{
  const { page, scripts, audio } = await open('/');
  check(!scripts.some((url) => url.includes('interactions')), 'the defaults do not download the sound code');
  check((await audio()).contexts === 0, 'the defaults make no AudioContext');
  await page.locator('.topbar').screenshot({ path: `${dir}/sound-topbar-off.png` });
  const toggle = page.getByRole('button', { name: 'Sounds of the interface' });
  await toggle.click();
  await page.waitForTimeout(600);
  check(
    scripts.some((url) => url.includes('interactions')),
    'switching the sound on downloads the sound code',
  );
  let now = await audio();
  check(now.contexts === 1 && now.voices > 0, `switching it on plays the intro (${now.voices} voices)`);
  await page.mouse.move(0, 0);
  const before = now.voices;
  await page.locator('a[href]').filter({ visible: true }).nth(2).hover();
  await page.waitForTimeout(200);
  now = await audio();
  check(now.voices > before, `pointing at a link sounds (${now.voices - before} voices)`);
  await page.locator('.topbar').screenshot({ path: `${dir}/sound-topbar-on.png` });
  await toggle.click();
  await page.waitForTimeout(300);
  check((await audio()).closed === 1, 'switching it off closes the AudioContext');
  await page.close();
}

for (const [width, name] of [
  [1280, 'sound-settings'],
  [360, 'sound-settings-360'],
]) {
  for (const theme of width === 1280 ? ['dark', 'light'] : ['dark']) {
    const { page, audio } = await open('/settings/', {
      width,
      theme,
      settings: { 'sound.on': true, 'sound.activate3': 'glass', 'sound.mode': 'cycle' },
    });
    await page.mouse.click(5, 300); // a gesture, as a visitor's first click
    const section = page.locator('#sound');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.getByRole('tab', { name: 'Pressing' }).click();
    await page.waitForTimeout(200);
    const before = (await audio()).voices;
    await page.getByRole('button', { name: 'Play: Pressing a button or a link, sound 3' }).click();
    await page.waitForTimeout(200);
    check((await audio()).voices > before, `▶ plays the sound (${width} px, ${theme})`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow <= 0, `no horizontal overflow at ${width} px (${overflow})`);
    await page.mouse.move(0, 0);
    // The sticky bars would cover the section in a screenshot of it.
    await page.addStyleTag({ content: '.topbar, .subnav { visibility: hidden !important; }' });
    await page.waitForTimeout(300);
    await section.screenshot({ path: `${dir}/${name}-${theme}.png` });
    await page.close();
  }
}

await browser.close();
if (failures.length) {
  console.error(failures);
  process.exit(1);
}
