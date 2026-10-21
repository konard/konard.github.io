import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import habr from '../data/habr.json';
import { mergeHabr } from '../data/habrLive';
import { startNebula } from '../visuals/nebula';
import { columnsFor, driftAt, startRain } from '../visuals/rain';
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
    expect(startRain(canvas)).toBeTypeOf('function');
  });
});

describe('rain of link networks (issue #9)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('puts exactly two symbol columns into every 64px grid cell, starting at the grid lines', () => {
    const xs = columnsFor(1280, 64);
    expect(xs).toHaveLength(40);
    expect(xs.slice(0, 4)).toEqual([0, 32, 64, 96]);
    for (let cell = 0; cell < 1280; cell += 64) expect(xs.filter((x) => x >= cell && x < cell + 64)).toHaveLength(2);
  });

  it('drifts one grid cell per period and starts over', () => {
    expect(driftAt(0)).toBe(0);
    expect(driftAt(12000)).toBe(32);
    expect(driftAt(24000 + 6000)).toBe(16);
    expect(driftAt(5000, 64, 0)).toBe(0);
  });

  it('draws every symbol on a half-cell of the grid, each link in its own colour', () => {
    const moves = [];
    const strokes = [];
    const ctx = new Proxy(
      {
        translate: (x, y) => moves.push([x, y]),
        stroke: () => strokes.push(ctx.strokeStyle),
      },
      { get: (target, key) => (key in target ? target[key] : () => {}), set: (t, k, v) => ((t[k] = v), true) },
    );
    vi.stubGlobal('Path2D', class {});
    const canvas = { getContext: () => ctx, clientWidth: 640, clientHeight: 480 + 64, style: {} };
    let seed = 3;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const stop = startRain(canvas, { animate: false, random });
    stop();
    expect(moves.length).toBeGreaterThan(20);
    moves.forEach(([x, y]) => {
      expect(x % 32).toBe(0);
      expect(y % 32).toBe(0);
    });
    expect(new Set(strokes).size).toBeGreaterThan(1);
  });

  it('moves the canvas with the grid and keeps the trails on it when the grid starts over', () => {
    vi.useFakeTimers();
    vi.setSystemTime(24000 * 100 - 100);
    const copies = [];
    const ctx = new Proxy(
      { drawImage: (...args) => copies.push(args.slice(1)) },
      { get: (target, key) => (key in target ? target[key] : () => {}), set: (t, k, v) => ((t[k] = v), true) },
    );
    vi.stubGlobal('Path2D', class {});
    const canvas = { getContext: () => ctx, clientWidth: 320, clientHeight: 400, style: {} };
    const drifts = [];
    const stop = startRain(canvas, { onDrift: (d) => drifts.push(d) });
    vi.advanceTimersByTime(75);
    expect(drifts.at(-1)).toBeGreaterThan(63);
    expect(canvas.style.transform).toMatch(/^translateY\(63\.\d\dpx\)$/);
    vi.advanceTimersByTime(75);
    expect(drifts.at(-1)).toBeLessThan(1);
    // The grid jumped back by one cell, so the picture moves down by one cell.
    expect(copies).toEqual([[0, 64]]);
    stop();
    vi.useRealTimers();
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
