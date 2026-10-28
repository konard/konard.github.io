import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import habr from '../data/habr.json';
import { mergeHabr } from '../data/habrLive';
import { setLang } from '../i18n/prefs';
import { startNebula } from '../visuals/nebula';
import { isReal } from '../links/configurations';
import { resetSettings, setSettings } from '../settings/store';
import { columnsFor, driftAt, paddingFor, pickerFor, startRain } from '../visuals/rain';
import Cosmos, { moves, nebulaOptions, rainOptions } from './Cosmos';
import { DEFAULTS } from '../settings/schema';
import HabrCards from './HabrCards';
import ProblemSolvingDiagram, {
  BOTTOM,
  edges,
  ends,
  HEIGHT,
  nodes,
  ORIGINAL_IMAGE,
  ORIGINAL_REPOSITORY,
  R,
  rows,
  TOP,
  trim,
  WIDTH,
  WORDS,
} from './ProblemSolvingDiagram';

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

describe('background canvases follow their CSS size (issue #13)', () => {
  afterEach(() => vi.unstubAllGlobals());

  // Safari may run the scripts before the stylesheet applies, so a canvas is
  // first measured at its default size of 300×150 and only later gets the size
  // of the screen; no window resize event happens in between.
  const observed = [];
  class FakeResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.targets = [];
      observed.push(this);
    }
    observe(target) {
      this.targets.push(target);
    }
    disconnect() {
      this.targets = [];
    }
  }
  const resizeTo = (canvas, width, height) => {
    canvas.clientWidth = width;
    canvas.clientHeight = height;
    observed.filter((o) => o.targets.includes(canvas)).forEach((o) => o.callback([{ target: canvas }]));
  };
  const anything = (target, extra = () => {}) =>
    new Proxy(target, {
      get: (t, key) => (key in t ? t[key] : extra),
      set: (t, k, v) => ((t[k] = v), true),
    });

  it('the rain redraws at the new size of its canvas instead of being stretched', () => {
    observed.length = 0;
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.stubGlobal('Path2D', class {});
    vi.stubGlobal('devicePixelRatio', 2);
    const canvas = { getContext: () => anything({}), clientWidth: 300, clientHeight: 150, style: {} };
    const stop = startRain(canvas, { animate: false });
    expect([canvas.width, canvas.height]).toEqual([600, 300]);
    resizeTo(canvas, 1280, 864);
    expect([canvas.width, canvas.height]).toEqual([2560, 1728]);
    stop();
    expect(observed.every((o) => o.targets.length === 0)).toBe(true);
  });

  it('the universe renders at the new size of its canvas instead of being stretched', () => {
    observed.length = 0;
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.stubGlobal('devicePixelRatio', 2);
    const gl = anything({}, () => true);
    const canvas = { getContext: () => gl, clientWidth: 300, clientHeight: 150, style: {} };
    const stop = startNebula(canvas, { animate: false, scale: 0.5 });
    expect([canvas.width, canvas.height]).toEqual([300, 150]);
    resizeTo(canvas, 1280, 864);
    expect([canvas.width, canvas.height]).toEqual([1280, 864]);
    stop();
    expect(observed.every((o) => o.targets.length === 0)).toBe(true);
  });
});

describe('background follows the settings at once (issue #13)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetSettings(undefined, { save: false });
  });

  const recorder = () => {
    const calls = { glows: [], widths: [], fades: [], moves: [] };
    const ctx = new Proxy(
      { translate: (x, y) => calls.moves.push([x, y]) },
      {
        get: (t, key) => (key in t ? t[key] : () => {}),
        set: (t, key, value) => {
          if (key === 'shadowBlur' && value) calls.glows.push(value);
          if (key === 'lineWidth') calls.widths.push(value);
          if (key === 'fillStyle') calls.fades.push(value);
          t[key] = value;
          return true;
        },
      },
    );
    return { ctx, calls };
  };

  it('moves in the automatic mode unless the system asks for reduced motion', () => {
    expect(moves('auto', false)).toBe(true);
    expect(moves('auto', true)).toBe(false);
    expect(moves('on', true)).toBe(true);
    expect(moves('off', false)).toBe(false);
  });

  it('turns the default settings (issue #15) into the options of the layers', () => {
    expect(rainOptions(DEFAULTS, true)).toMatchObject({
      grid: 48,
      period: 109000,
      step: 105,
      fade: 0.075,
      glow: 4,
      glowColor: '#00a3d7',
      lineWidth: 1,
      padding: 0,
      speeds: 2,
      density: 0.5,
      restart: 0.05,
      visible: true,
    });
    expect(rainOptions(DEFAULTS, false).period).toBe(0);
    expect(nebulaOptions(DEFAULTS)).toEqual({
      scale: 0.6,
      fps: 24,
      speed: 0.5,
      gas: 0.35,
      hue: 25,
      stars: 1.2,
      starBrightness: 0.8,
      twinkle: 0.3,
      vignette: 0.3,
      // Issue #15: the colours of the gas are those the shader had before they became settings.
      zoom: 1,
      starSize: 1,
      starColor: '#ffffff',
      color1: '#210f52',
      color2: '#086b85',
      color3: '#a63380',
      color4: '#e6d9ff',
    });
  });

  it('picks networks with the chosen number of links, real references only if asked', () => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pick = pickerFor({ minLinks: 2, maxLinks: 3, real: true }, random);
    const codes = Array.from({ length: 300 }, pick);
    expect(new Set(codes.map((code) => code.split(' ').length))).toEqual(new Set([2, 3]));
    expect(codes.every(isReal)).toBe(true);
    expect(pickerFor({ minLinks: 4, maxLinks: 1 }, random)().split(' ').length).toBeLessThanOrEqual(4);
  });

  it('changes the step, glow, line width and fading of the running rain without starting it again', () => {
    vi.useFakeTimers();
    vi.stubGlobal('Path2D', class {});
    const { ctx, calls } = recorder();
    const canvas = { getContext: () => ctx, clientWidth: 320, clientHeight: 400, style: {} };
    let seed = 5;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const stop = startRain(canvas, { random });
    vi.advanceTimersByTime(75 * 40);
    const before = calls.fades.length;
    stop.update({ step: 300, glow: 20, lineWidth: 2, fade: 0.3 });
    vi.advanceTimersByTime(300 * 10);
    // 10 frames, not 40: the new step is used.
    expect(calls.fades.length - before).toBe(10);
    expect(calls.fades.at(-1)).toBe('rgba(0, 0, 0, 0.3)');
    expect(calls.glows.at(-1)).toBe(20);
    expect(calls.widths.at(-1)).toBe(2);
    // Invisible rain only clears the canvas and drifts the grid.
    const drawn = calls.moves.length;
    stop.update({ visible: false });
    vi.advanceTimersByTime(3000);
    expect(calls.moves.length).toBe(drawn);
    expect(calls.fades.at(-1)).toBe('rgba(0, 0, 0, 1)');
    stop();
  });

  it('keeps the glow the same size in CSS pixels on high-density screens (issue #15)', () => {
    vi.useFakeTimers();
    vi.stubGlobal('Path2D', class {});
    vi.stubGlobal('devicePixelRatio', 2);
    const { ctx, calls } = recorder();
    const canvas = { getContext: () => ctx, clientWidth: 320, clientHeight: 400, style: {} };
    const stop = startRain(canvas, { glow: 4, random: () => 0.5 });
    vi.advanceTimersByTime(75 * 60);
    // shadowBlur ignores the canvas transform, so 4 CSS pixels are 8 device pixels here.
    expect(calls.glows.at(-1)).toBe(8);
    stop();
  });

  it('keeps the chosen space around every symbol, never more than the cell allows (issue #15)', () => {
    expect(paddingFor(24, 0)).toBe(0);
    expect(paddingFor(24, 3)).toBe(3);
    expect(paddingFor(24, 16)).toBe(9);
    vi.stubGlobal('Path2D', class {});
    const { ctx, calls } = recorder();
    const scales = [];
    ctx.scale = (x) => scales.push(x);
    const canvas = { getContext: () => ctx, clientWidth: 640, clientHeight: 480, style: {} };
    const stop = startRain(canvas, { animate: false, grid: 48, padding: 4 });
    expect(calls.moves.length).toBeGreaterThan(10);
    calls.moves.forEach(([x, y]) => {
      expect((x - 4) % 24).toBe(0);
      expect((y - 4) % 24).toBe(0);
    });
    // A symbol is 24 − 2 × 4 = 16 pixels of the 100 units it is drawn in.
    expect(scales.at(-1)).toBeCloseTo(0.16);
    stop();
  });

  it('lays the rain out again on a new grid size', () => {
    vi.stubGlobal('Path2D', class {});
    const { ctx, calls } = recorder();
    const canvas = { getContext: () => ctx, clientWidth: 640, clientHeight: 480, style: {} };
    const stop = startRain(canvas, { animate: false });
    calls.moves.length = 0;
    stop.update({ grid: 96 });
    expect(calls.moves.length).toBeGreaterThan(10);
    calls.moves.forEach(([x, y]) => {
      expect(x % 48).toBe(0);
      expect(y % 48).toBe(0);
    });
    stop();
  });

  it('sends the look of the universe to the shader', () => {
    const values = {};
    const gl = new Proxy(
      {
        getUniformLocation: (program, name) => name,
        uniform1f: (name, value) => (values[name] = value),
      },
      { get: (t, key) => (key in t ? t[key] : () => true) },
    );
    const canvas = { getContext: () => gl, clientWidth: 300, clientHeight: 150, style: {} };
    const stop = startNebula(canvas, { animate: false });
    expect(values).toMatchObject({ gas: 1, hue: 0, density: 1, shine: 1, vignette: 0.5 });
    stop.update({ gas: 2, hue: 90, stars: 3, starBrightness: 0.5, vignette: 0, scale: 1 });
    expect(values).toMatchObject({ gas: 2, hue: Math.PI / 2, density: 3, shine: 0.5, vignette: 0 });
    expect(canvas.width).toBe(300);
    stop();
  });

  it('hides switched-off layers and keeps the universe off the page', () => {
    setSettings({ 'nebula.on': false, 'grid.size': 96 }, { save: false });
    const { container } = render(<Cosmos />);
    expect(container.querySelector('.cosmos__universe')).toBeNull();
    expect(document.documentElement.dataset.nebulaOn).toBe('false');
    expect(document.documentElement.style.getPropertyValue('--grid-size')).toBe('96px');
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

  // Issue #9: the S of "Solution" was hidden behind the last node and
  // "decomposition" ran into its arrow. Every label is a box of its fixed
  // width (textLength) and the full em height; nothing may touch it.
  // Issue #11: the same holds for the Russian words.
  const boxOf = ({ x, y, width }, size) => ({ x1: x, x2: x + width, y1: y - size / 2, y2: y + size / 2 });
  const overlaps = (a, b, margin = 0) =>
    a.x1 < b.x2 + margin && b.x1 < a.x2 + margin && a.y1 < b.y2 + margin && b.y1 < a.y2 + margin;
  // A segment hits a box if any of its sampled points falls inside.
  const hits = ([x1, y1, x2, y2], box, margin) =>
    Array.from({ length: 41 }, (_, k) => [x1 + ((x2 - x1) * k) / 40, y1 + ((y2 - y1) * k) / 40]).some(
      ([x, y]) => x > box.x1 - margin && x < box.x2 + margin && y > box.y1 - margin && y < box.y2 + margin,
    );

  it.each(Object.keys(WORDS))('keeps every label inside the drawing and clear of everything else (%s)', (lang) => {
    const { top, bottom } = rows(lang);
    const labels = [
      ...[...top, ...bottom].map((item) => ({ name: item.word, ...boxOf(item, 21) })),
      ...ends(lang).map((item) => ({ name: item.word, ...boxOf(item, 28) })),
    ];
    const problems = [];
    labels.forEach((a, i) => {
      if (a.x1 < 0 || a.x2 > WIDTH || a.y1 < 0 || a.y2 > HEIGHT) problems.push(`${a.name} leaves the drawing`);
      labels.slice(i + 1).forEach((b) => overlaps(a, b, 8) && problems.push(`${a.name} touches ${b.name}`));
      nodes().forEach(([n]) => {
        const node = { x1: n.x - R, x2: n.x + R, y1: n.y - R, y2: n.y + R };
        if (overlaps(a, node, 8)) problems.push(`${a.name} touches a node at ${n.x},${n.y}`);
      });
      edges().forEach(([p, q]) => hits(trim(p, q), a, 4) && problems.push(`${a.name} touches an edge`));
      [...top, ...bottom]
        .filter((item) => item.arrow)
        .forEach((item) => {
          if (hits([item.arrow[0], item.y, item.arrow[1] + 4, item.y], a, 6))
            problems.push(`${a.name} touches an arrow`);
        });
    });
    expect(problems).toEqual([]);
  });

  it.each(Object.keys(WORDS))('centres both rows and spaces every flow arrow evenly (%s)', (lang) => {
    const { top, bottom } = rows(lang);
    [top, bottom].forEach((row) => {
      const left = row[0].x;
      const right = WIDTH - (row.at(-1).x + row.at(-1).width);
      expect(Math.abs(left - right)).toBeLessThan(1e-9);
      row.slice(0, -1).forEach((item, i) => {
        expect(item.arrow[0] - (item.x + item.width)).toBeCloseTo(row[i + 1].x - item.arrow[1], 9);
      });
    });
  });

  it('keeps the English words of the original drawing', () => {
    expect(TOP.map((i) => i.word)).toEqual(['tasks', 'tests', 'drafts', 'solutions']);
    expect(BOTTOM.map((i) => i.word)).toEqual(['decomposition', 'experiment', 'selection', 'composition']);
    expect(ends().map((i) => i.word)).toEqual(['Problem', 'Solution']);
  });

  it('draws the Russian words when the site is in Russian', () => {
    setLang('ru', { save: false });
    const { container } = render(<ProblemSolvingDiagram />);
    expect(screen.getByRole('img', { name: 'Универсальный алгоритм решения задач' })).toBeInTheDocument();
    const words = [...container.querySelectorAll('text')].map((t) => t.textContent);
    expect(words).toEqual(expect.arrayContaining(['Задача', 'Решение', 'подзадачи', 'декомпозиция']));
    expect(words).not.toContain('tasks');
    expect(container.querySelector('figcaption').textContent).toBe('Оригинальный рисунок · konard/problem-solving');
  });

  it('only links the original drawing and the original repository in the caption', () => {
    const { container } = render(<ProblemSolvingDiagram />);
    const caption = container.querySelector('figcaption');
    expect([...caption.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
      ORIGINAL_IMAGE,
      ORIGINAL_REPOSITORY,
    ]);
    expect(caption.textContent).toBe('Original drawing · konard/problem-solving');
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
      if (url.includes('/card'))
        return json({
          statistics: { rating: 99.5, subscribersCount: 1234 },
          scoreStats: { score: 77, votesCount: 80 },
          followStats: { followersCount: 100 },
        });
      return json({
        pagesCount: 1,
        publicationIds: habr.articles.map((article) => article.id),
        publicationRefs: Object.fromEntries(
          habr.articles.map((article) => [
            article.id,
            {
              statistics: {
                readingCount: article.id === first.id ? 987654 : article.statistics.views,
                score: article.statistics.score,
                votesCount: article.statistics.votes,
                favoritesCount: article.id === first.id ? 4321 : article.statistics.bookmarks,
                commentsCount: article.statistics.comments,
              },
            },
          ]),
        ),
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
