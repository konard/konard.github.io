/* global document, getComputedStyle, innerWidth, window */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const before = process.argv.includes('--before');
const indicators = createRequire(import.meta.url)('../scripts/lino-data.cjs').readLino('src/data/indicators.lino');
const colors = JSON.parse(await readFile('docs/case-studies/issue-33/data/github-calendar-colors.json', 'utf8'));
const snapshot = indicators.contributions;
const days = snapshot.calendar.weeks.flatMap((w) => w.contributionDays);
const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
const response = {
  contributions: days.map((d) => ({
    date: d.date,
    count: d.contributionCount,
    level: levels.indexOf(d.contributionLevel),
  })),
};
const dir = process.env.CAPTURE_DIR || 'docs/case-studies/issue-33/screenshots';
await mkdir(dir, { recursive: true });
const server = await createServer({ server: { port: 4193, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
  // Recorded evidence stays reproducible after its real-world effective date.
  await page.clock.install({ time: new Date(snapshot.collectedAt) });
  let service = 'offline';
  await page.route('https://github-contributions-api.jogruber.de/**', (route) =>
    service === 'offline'
      ? route.abort()
      : route.fulfill({
          json:
            service === 'live'
              ? response
              : service === 'disagree'
                ? { contributions: response.contributions.map((d, i) => (i ? d : { ...d, count: d.count + 1 })) }
                : { contributions: [] },
        }),
  );
  // Do not depend on third-party frame availability in a regression test.
  await page.route('https://platform.twitter.com/**', (route) => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off', 'background.enabled': false }));
  });
  const verifyColors = async (theme) => {
    for (const [level, color] of colors[theme].entries()) {
      const channels = color
        .slice(1)
        .match(/../g)
        .map((value) => parseInt(value, 16));
      assert.equal(
        await page
          .locator(`.contribution-calendar__day[data-level="${level}"]`)
          .first()
          .evaluate((cell) => getComputedStyle(cell).fill),
        `rgb(${channels.join(', ')})`,
      );
    }
  };
  for (const [name, url, selector] of [
    ['activity', '/?lang=en#activity', before ? '#activity' : '.contribution-calendar'],
    ...(!before ? [['source-lines', '/?lang=en#activity', '.source-lines']] : []),
    ['repositories', '/repositories/?lang=en&q=links-notation#all', '#all'],
    ['social', '/blog/?lang=en&network=x', '.post'],
  ]) {
    await page.goto(`http://localhost:4193${url}`);
    await page
      .locator(selector)
      .first()
      .evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -100));
    if (!before && name === 'repositories') {
      await page
        .locator('.repo__lines')
        .first()
        .evaluate((element) => {
          element.open = true;
        });
      await page.locator('.repo__lines').first().scrollIntoViewIfNeeded();
    }
    if (!before && name === 'social') {
      const post = page.locator('.post').first();
      await page.screenshot({ path: `${dir}/after-social-embed.png` });
      const toggle = post.getByRole('button', { name: 'Show archived copy', exact: true });
      if (await toggle.isVisible()) await toggle.click();
      await post.getByText(/^Historical copy · original embed unavailable/).waitFor();
      assert.ok(await post.locator('.post__body').innerText());
      await post.getByRole('button', { name: 'Show embed', exact: true }).click();
      // A blocked provider can fail before an empty loading host gets a box.
      // Retry must return to a readable archive, without a visibility race.
      await post.getByText(/^Historical copy · original embed unavailable/).waitFor();
      assert.ok(await post.locator('.post__body').innerText());
    }
    await page.screenshot({ path: `${dir}/${before ? 'before' : 'after'}-${name}.png` });
    if (!before && name === 'activity') {
      assert.equal((await page.locator('.contribution-calendar__day').count()) >= 365, true);
      assert.equal(await page.getByText('Discipline comes first in any work or art', { exact: true }).count(), 1);
      assert.deepEqual(
        await page
          .locator('.contribution-calendar__day')
          .evaluateAll((cells) => cells.map((cell) => +cell.dataset.level)),
        days.map((d) => levels.indexOf(d.contributionLevel)),
      );
      assert.deepEqual(
        await page.locator('.contribution-calendar tbody tr').evaluateAll((rows) =>
          rows.map((row) => ({
            date: row.cells[0].textContent,
            count: Number(row.cells[1].textContent.replace(/\D/g, '')),
          })),
        ),
        days.map((d) => ({ date: d.date, count: d.contributionCount })),
      );
      await verifyColors('dark');
    }
    if (!before && name === 'source-lines')
      assert.equal(
        Number((await page.locator('.source-lines__total strong').innerText()).replace(/\D/g, '')),
        Object.values(indicators.sourceLines.languages).reduce((sum, count) => sum + count, 0),
      );
    if (!before && name === 'repositories') assert.ok(await page.getByText(/source lines/).count());
  }
  if (!before) {
    // Live replacement, malformed response, offline fallback, and expiry in an
    // already-open tab are tested separately from the recorded screenshots.
    service = 'live';
    await page.goto('http://localhost:4193/?lang=en&capture=live#activity');
    await page.getByText(/Updated live:/).waitFor();
    assert.equal(await page.locator('.contribution-calendar__day').count(), days.length);
    await page.clock.fastForward(49 * 3600000);
    assert.equal(await page.locator('.discipline').count(), 0);
    await page.clock.setFixedTime(new Date(snapshot.collectedAt));
    service = 'invalid';
    await page.goto('http://localhost:4193/?lang=en&capture=invalid#activity');
    await page
      .locator('.contribution-calendar')
      .getByText(/Snapshot/)
      .waitFor();
    assert.equal(await page.locator('.contribution-calendar__day').count(), days.length);
    service = 'disagree';
    await page.goto('http://localhost:4193/?lang=en&capture=disagree#activity');
    await page
      .locator('.contribution-calendar')
      .getByText(/Snapshot/)
      .waitFor();
    assert.equal(await page.locator('.contribution-calendar__day').count(), days.length);
    service = 'offline';
    await page.setViewportSize({ width: 390, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.goto(`http://localhost:4193/?lang=ru&capture=${theme}#activity`);
      await page.locator('.contribution-calendar').scrollIntoViewIfNeeded();
      await verifyColors(theme);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `${dir}/after-mobile-${theme}.png` });
      await page.locator('.source-lines details').evaluateAll((elements) => {
        for (const element of elements) element.open = true;
      });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        'Expanded public attribution evidence must fit the mobile viewport',
      );
    }
  }
  console.log(
    before ? 'Captured baseline screenshots.' : 'Activity, repository indicators and mobile layouts verified.',
  );
} finally {
  await browser?.close();
  await server.close();
}
