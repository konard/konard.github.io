import { agreesWithSnapshot, fetchCalendar, isDisciplined, LEVELS } from './calendar';

const now = new Date('2026-10-28T12:00:00Z');
const payload = () =>
  Array.from({ length: 365 }, (_, i) => ({
    date: new Date(Date.UTC(2025, 9, 29) + i * 86400000).toISOString().slice(0, 10),
    count: (i % 4) + 1,
    level: i % 5,
  }));
const response = (days) => async () => ({ ok: true, json: async () => ({ contributions: days }) });

it('preserves GitHub daily counts and levels, with Sunday-first weeks', async () => {
  const days = payload();
  const calendar = await fetchCalendar(response(days), now);
  const actual = calendar.weeks.flatMap((w) => w.contributionDays);
  expect(calendar.totalContributions).toBe(days.reduce((sum, d) => sum + d.count, 0));
  expect(actual.map((d) => d.contributionLevel)).toEqual(days.map((d) => LEVELS[d.level]));
  expect(calendar.weeks.slice(1).every((w) => w.contributionDays[0].weekday === 0)).toBe(true);
});

it('only shows the discipline statement for a fresh, uninterrupted recent habit', async () => {
  const calendar = await fetchCalendar(response(payload()), now);
  expect(isDisciplined(calendar, now.toISOString(), now)).toBe(true);
  // Today is incomplete and does not invalidate a run of completed days.
  calendar.weeks.at(-1).contributionDays.at(-1).contributionCount = 0;
  expect(isDisciplined(calendar, now.toISOString(), now)).toBe(true);
  const yesterday = calendar.weeks.flatMap((w) => w.contributionDays).find((d) => d.date === '2026-10-27');
  yesterday.contributionCount = 0;
  expect(isDisciplined(calendar, now.toISOString(), now)).toBe(false);
  yesterday.contributionCount = 1;
  expect(isDisciplined(calendar, '2026-10-25T12:00:00Z', now)).toBe(false);
  expect(isDisciplined(calendar, '2026-10-29T12:00:00Z', now)).toBe(false);
  expect(isDisciplined(calendar, 'invalid', now)).toBe(false);
  calendar.weeks.at(-1).contributionDays = [];
  expect(isDisciplined(calendar, now.toISOString(), now)).toBe(false);
});

it.each(['duplicate', 'gap', 'negative', 'bad-level', 'future', 'stale', 'missing', 'invalid-date'])(
  'rejects %s data rather than replacing the first-party snapshot',
  async (kind) => {
    const days = payload();
    if (kind === 'duplicate') days[1].date = days[0].date;
    if (kind === 'gap') days.splice(150, 1);
    if (kind === 'negative') days[0].count = -1;
    if (kind === 'bad-level') days[0].level = 5;
    if (kind === 'future') days.at(-1).date = '2026-10-29';
    if (kind === 'stale') days.at(-1).date = '2025-10-28';
    if (kind === 'missing') days.pop();
    if (kind === 'invalid-date') days[0].date = '2025-19-99';
    await expect(fetchCalendar(response(days), now)).rejects.toThrow();
  },
);

it('handles an unavailable calendar service', async () => {
  await expect(fetchCalendar(async () => ({ ok: false }), now)).rejects.toThrow('unavailable');
});

it('keeps first-party evidence when a valid mirror disagrees on completed days', async () => {
  const reference = await fetchCalendar(response(payload()), now);
  const actual = structuredClone(reference);
  expect(agreesWithSnapshot(actual, reference)).toBe(true);
  actual.weeks.at(-1).contributionDays.at(-1).contributionCount += 3;
  expect(agreesWithSnapshot(actual, reference)).toBe(true);
  actual.weeks[0].contributionDays[0].contributionCount += 1;
  expect(agreesWithSnapshot(actual, reference)).toBe(false);
  actual.weeks = [];
  expect(agreesWithSnapshot(actual, reference)).toBe(false);
});

it('rejects decreases today and checks the last snapshot day after it becomes historical', async () => {
  const reference = await fetchCalendar(response(payload()), now);
  const actual = structuredClone(reference);
  actual.weeks.at(-1).contributionDays.at(-1).contributionCount -= 1;
  expect(agreesWithSnapshot(actual, reference)).toBe(false);
  actual.weeks.at(-1).contributionDays.at(-1).contributionCount += 2;
  actual.weeks.at(-1).contributionDays.push({
    date: '2026-10-29',
    weekday: 4,
    contributionCount: 1,
    contributionLevel: LEVELS[1],
  });
  expect(agreesWithSnapshot(actual, reference)).toBe(false);
});
