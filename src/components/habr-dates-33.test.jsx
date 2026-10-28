import { render, screen, waitFor } from '@testing-library/react';
import HabrCards from './HabrCards';
import habr from '../data/habr.json';

it.each(['profile', 'articles', 'all'])(
  'dates the remaining Habr snapshot when %s refresh is incomplete',
  async (missing) => {
    const snapshot = { ...habr, articles: habr.articles.slice(0, 1) };
    const fetchImpl = async (url) => {
      if (url.includes('/card')) {
        if (missing !== 'articles') throw new Error('Profile unavailable');
        return {
          ok: true,
          json: async () => ({
            statistics: { rating: 10, subscribersCount: 20 },
            scoreStats: { score: 30, votesCount: 40 },
            followStats: { followersCount: 50 },
          }),
        };
      }
      const id = snapshot.articles[0].id;
      return {
        ok: true,
        json: async () => ({
          pagesCount: 1,
          publicationIds: missing === 'profile' ? [id] : [],
          publicationRefs: {
            [id]: { statistics: { readingCount: 1, score: 2, votesCount: 3, favoritesCount: 4, commentsCount: 5 } },
          },
        }),
      };
    };
    render(<HabrCards snapshot={snapshot} fetchImpl={fetchImpl} />);
    await waitFor(() => expect(screen.queryByText(/refreshing from Habr/)).toBeNull());
    const prefix = missing === 'all' ? '^snapshot of' : 'remaining figures use the snapshot of';
    expect(screen.getByText(new RegExp(`${prefix} ${snapshot.collectedAt.slice(0, 10)}`))).toBeInTheDocument();
    expect(screen.queryByText(/live numbers from the Habr API/)).toBeNull();
  },
);
