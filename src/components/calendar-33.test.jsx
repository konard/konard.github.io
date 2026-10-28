import { act, render, screen } from '@testing-library/react';
import ContributionCalendar from './ContributionCalendar';
import { LEVELS } from '../data/calendar';

it('shows the conditional slogan immediately after a successful live refresh', async () => {
  vi.useFakeTimers();
  const time = new Date('2026-10-28T12:00:00Z');
  vi.setSystemTime(time);
  const contributions = Array.from({ length: 365 }, (_, i) => ({
    date: new Date(Date.UTC(2025, 9, 29) + i * 86400000).toISOString().slice(0, 10),
    count: 1,
    level: 1,
  }));
  const snapshot = {
    collectedAt: '2026-10-20T12:00:00Z',
    calendar: {
      totalContributions: 365,
      weeks: [
        {
          firstDay: contributions[0].date,
          contributionDays: contributions.map((d) => ({
            date: d.date,
            weekday: new Date(d.date).getUTCDay(),
            contributionCount: 1,
            contributionLevel: LEVELS[1],
          })),
        },
      ],
    },
  };
  const fetchImpl = async () => {
    vi.setSystemTime(new Date(+time + 1000));
    return { ok: true, json: async () => ({ contributions }) };
  };
  try {
    await act(async () => {
      render(<ContributionCalendar snapshot={snapshot} fetchImpl={fetchImpl} />);
    });
    expect(screen.getByRole('heading', { name: 'Discipline comes first in any work or art' })).toBeInTheDocument();
    expect(screen.getByText(/Updated live/)).toBeInTheDocument();
    // Offline, an old tab must eventually hide a stale claim as well.
    await act(async () => {
      vi.advanceTimersByTime(49 * 3600000);
    });
    expect(screen.queryByRole('heading', { name: 'Discipline comes first in any work or art' })).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});
