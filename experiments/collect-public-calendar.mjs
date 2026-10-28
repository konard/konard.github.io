/* global document, location */
// Capture the exact public profile graph without authentication or private names.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = process.argv[2] || 'docs/case-studies/issue-33/data/public-profile-calendar.json';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--disable-blink-features=AutomationControlled'],
});
try {
  const page = await browser.newPage();
  await page.goto('https://github.com/konard');
  await page.locator('.ContributionCalendar-day[data-date]').first().waitFor();
  const data = await page.evaluate(() => ({
    collectedAt: new Date().toISOString(),
    source: location.href,
    heading: document.querySelector('.js-yearly-contributions h2')?.textContent.trim(),
    days: [...document.querySelectorAll('.ContributionCalendar-day[data-date][data-level]')]
      .map((cell) => {
        const tooltip = document.querySelector(`tool-tip[for="${cell.id}"]`)?.textContent.trim();
        const match = /^(No|[\d,]+) contributions?\b/.exec(tooltip || '');
        if (!match) throw new Error('Missing contribution tooltip');
        return {
          date: cell.dataset.date,
          level: +cell.dataset.level,
          count: match[1] === 'No' ? 0 : Number(match[1].replaceAll(',', '')),
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date)),
  }));
  assert.ok(data.days.length >= 365 && data.days.length <= 372, 'Incomplete public graph');
  assert.equal(new Set(data.days.map((d) => d.date)).size, data.days.length);
  assert.equal(data.days.at(-1).date, data.collectedAt.slice(0, 10));
  for (const [i, d] of data.days.entries()) {
    assert.ok(
      Number.isSafeInteger(d.count) && d.count >= 0 && Number.isInteger(d.level) && d.level >= 0 && d.level <= 4,
    );
    if (i) assert.equal(+new Date(d.date) - +new Date(data.days[i - 1].date), 86400000);
  }
  assert.equal(
    data.days.reduce((sum, d) => sum + d.count, 0),
    parseInt(data.heading.replaceAll(',', ''), 10),
  );
  await writeFile(output, JSON.stringify(data, null, 2) + '\n');
  console.log(`Saved ${data.days.length} days from the public GitHub profile.`);
} finally {
  await browser.close();
}
