import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import habr from '../data/habr.json';
import { mergeHabr } from '../data/habrLive';
import { startNebula } from '../visuals/nebula';
import { startRain } from '../visuals/rain';
import Cosmos from './Cosmos';
import HabrCards from './HabrCards';
import ProblemSolvingDiagram, { edges } from './ProblemSolvingDiagram';

const json = (body) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

describe('background layers', () => {
  it('render the universe, grid and rain layers hidden from assistive technology', () => {
    const { container } = render(<Cosmos />);
    const cosmos = container.querySelector('.cosmos');
    expect(cosmos).toHaveAttribute('aria-hidden', 'true');
    expect(cosmos.querySelectorAll('canvas')).toHaveLength(2);
    expect(cosmos.querySelector('.cosmos__grid')).not.toBeNull();
  });

  it('do nothing where WebGL or Canvas 2D are unavailable', () => {
    const canvas = { getContext: () => null };
    expect(startNebula(canvas)).toBeTypeOf('function');
    expect(startRain(canvas, { codes: ['00'] })).toBeTypeOf('function');
  });
});

describe('ProblemSolvingDiagram', () => {
  it('draws problem → 2 tasks → 4 subtasks → 4 tests → 8 drafts → 2 selections → solution', () => {
    const list = edges();
    const count = (kind) => list.filter(([, , k]) => k === kind).length;
    expect(count('task')).toBe(6);
    expect(count('test')).toBe(4);
    expect(count('draft')).toBe(8);
    expect(count('solution')).toBe(6);
    const { container } = render(<ProblemSolvingDiagram />);
    expect(container.querySelectorAll('.psd__edges line')).toHaveLength(24);
    expect(container.querySelectorAll('.psd__nodes circle')).toHaveLength(22);
    expect(container.querySelectorAll('circle.is-rejected')).toHaveLength(4);
    expect(screen.getByRole('img', { name: 'Universal Problem Solving Algorithm' })).toBeInTheDocument();
  });
});

describe('HabrCards', () => {
  const first = habr.articles[0];

  it('shows the snapshot when live data is off', () => {
    render(<HabrCards snapshot={habr} live={false} />);
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(habr.articles.length);
    expect(screen.getByText(/snapshot of/)).toBeInTheDocument();
  });

  it('refreshes views, karma and bookmarks from the Habr API', async () => {
    const fetchImpl = (url) => {
      if (url.includes('/card')) return json({ statistics: { rating: 99.5, subscribersCount: 1234 } });
      return json({
        pagesCount: 1,
        publicationIds: [first.id],
        publicationRefs: {
          [first.id]: {
            statistics: { readingCount: 987654, score: 77, votesCount: 80, favoritesCount: 4321, commentsCount: 12 },
          },
        },
      });
    };
    render(<HabrCards snapshot={habr} fetchImpl={fetchImpl} />);
    expect(screen.getByText(/refreshing from Habr/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/live numbers from the Habr API/)).toBeInTheDocument());
    expect(screen.getByText('987.7K')).toBeInTheDocument();
    expect(screen.getByText('4.3K')).toBeInTheDocument();
  });

  it('keeps the snapshot when the API is unreachable', async () => {
    render(<HabrCards snapshot={habr} fetchImpl={() => Promise.reject(new Error('offline'))} />);
    await waitFor(() => expect(screen.getByText(/snapshot of/)).toBeInTheDocument());
  });

  it('merges statistics only into known articles', () => {
    const merged = mergeHabr(habr, { [first.id]: { ...first.statistics, views: 1 }, 1: { views: 5 } }, null);
    expect(merged.articles[0].statistics.views).toBe(1);
    expect(merged.articles).toHaveLength(habr.articles.length);
  });
});
