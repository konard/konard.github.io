// The slogan is a statement about current practice. Completed days in UTC
// must all have activity for the last 30 days; today may still be in progress.
// A missed day or a snapshot older than 48 hours hides it automatically.
export function isDisciplined(calendar, collectedAt, now = new Date()) {
  const age = +now - +new Date(collectedAt);
  if (!Number.isFinite(age) || age < 0 || age > 48 * 3600000) return false;
  const byDate = new Map(calendar.weeks.flatMap((w) => w.contributionDays).map((d) => [d.date, d.contributionCount]));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let offset = 1; offset <= 30; offset++) {
    const date = new Date(+end - offset * 86400000).toISOString().slice(0, 10);
    if (!(byDate.get(date) > 0)) return false;
  }
  return true;
}

export const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];

// A cached mirror must not silently replace first-party historical evidence
// with different counts or levels. Today's incomplete count may increase.
export function agreesWithSnapshot(calendar, reference) {
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const byDate = new Map(days.map((d) => [d.date, d]));
  const original = reference.weeks.flatMap((w) => w.contributionDays);
  const today = days.at(-1)?.date;
  const completed = original.filter((d) => d.date < today && byDate.has(d.date));
  const savedToday = original.find((d) => d.date === today);
  return (
    completed.length >= 300 &&
    (!savedToday || byDate.get(today).contributionCount >= savedToday.contributionCount) &&
    completed.every((d) => {
      const actual = byDate.get(d.date);
      return actual.contributionCount === d.contributionCount && actual.contributionLevel === d.contributionLevel;
    })
  );
}

// The public CORS service mirrors GitHub's public calendar. Validate the
// complete payload before replacing the first-party, committed snapshot.
export async function fetchCalendar(fetchImpl = fetch, now = new Date()) {
  const response = await fetchImpl('https://github-contributions-api.jogruber.de/v4/konard?y=last', {
    credentials: 'omit',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Calendar unavailable');
  const data = await response.json();
  const days = data.contributions;
  const today = now.toISOString().slice(0, 10);
  if (!Array.isArray(days) || days.length < 365 || days.length > 372) throw new Error('Incomplete calendar');
  const seen = new Set();
  for (const d of days) {
    const timestamp = +new Date(d.date);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(d.date) ||
      !Number.isFinite(timestamp) ||
      new Date(timestamp).toISOString().slice(0, 10) !== d.date ||
      !Number.isSafeInteger(d.count) ||
      d.count < 0 ||
      !Number.isInteger(d.level) ||
      d.level < 0 ||
      d.level > 4 ||
      seen.has(d.date) ||
      d.date > today
    )
      throw new Error('Invalid calendar');
    seen.add(d.date);
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  if (days.at(-1).date !== today) throw new Error('Stale calendar');
  for (let i = 1; i < days.length; i++) {
    if (+new Date(days[i].date) - +new Date(days[i - 1].date) !== 86400000) throw new Error('Calendar has gaps');
  }
  const weeks = [];
  for (const d of days) {
    const weekday = new Date(d.date).getUTCDay();
    if (!weeks.length || weekday === 0) weeks.push({ firstDay: d.date, contributionDays: [] });
    weeks
      .at(-1)
      .contributionDays.push({ date: d.date, weekday, contributionCount: d.count, contributionLevel: LEVELS[d.level] });
  }
  const totalContributions = days.reduce((s, d) => s + d.count, 0);
  if (!Number.isSafeInteger(totalContributions)) throw new Error('Invalid contribution total');
  return { totalContributions, weeks };
}
