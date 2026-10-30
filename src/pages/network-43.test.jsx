import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { decode } from '../links/configurations';
import NetworkPage from './NetworkPage';
import { randomLinks, stepped } from './NetworkEditor';

afterEach(() => {
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

describe('enumeration across link counts (issue 43)', () => {
  it('advances to the next size and reverses that transition', () => {
    for (const n of [1, 2, 3, 9, 10, 25]) {
      const last = Array.from({ length: n }, () => [n, n]);
      const first = Array.from({ length: n + 1 }, () => [0, 0]);
      expect(stepped(last, 1)).toEqual(first);
      expect(stepped(first, -1)).toEqual(last);
    }
    expect(stepped([[0, 0]], -1)).toEqual([[0, 0]]);
  });

  it('traverses every 1–2-link network exactly once before three links', () => {
    let links = [[0, 0]];
    const seen = new Set();
    for (let i = 0; i < 85; i++) {
      seen.add(JSON.stringify(links));
      links = stepped(links, 1);
    }
    expect(seen.size).toBe(85);
    expect(links).toEqual(decode('00 00 00'));
    expect(stepped(decode('22 21'), 2)).toEqual(decode('00 00 00'));
    expect(stepped(decode('00 00 00'), -82)).toEqual(decode('11'));
  });

  it.each([1, 2, 3, 10, 25])('samples real references directly for %i links', (n) => {
    for (const random of [() => 0, () => 0.5, () => 1 - Number.EPSILON]) {
      const links = randomLinks(n, random, { real: true });
      expect(links).toHaveLength(n);
      expect(links.flat().every((ref) => ref >= 1 && ref <= n)).toBe(true);
    }
    expect(randomLinks(n, () => 0)).toEqual(Array.from({ length: n }, () => [0, 0]));
  });

  it('samples independent endpoint digits beyond the safe integer network count', () => {
    for (const real of [false, true]) {
      let calls = 0;
      const links = randomLinks(9, () => (calls++ % 2 ? 1 - Number.EPSILON : 0), { real });
      expect(links).toEqual(Array.from({ length: 9 }, () => [real ? 1 : 0, 9]));
      expect(calls).toBe(18);
    }
  });

  it('updates the editor and shared URL across the two-link boundary', () => {
    window.history.replaceState(null, '', '/network/?code=2222&lang=en');
    render(<NetworkPage />);
    fireEvent.click(screen.getByRole('button', { name: /Next network/ }));
    expect(screen.getByLabelText('Pairs with the base')).toHaveValue('00₄ 00₄ 00₄');
    expect(screen.getByLabelText('Link to this picture').value).toContain('code=000000');
    fireEvent.click(screen.getByRole('button', { name: /Previous network/ }));
    expect(screen.getByLabelText('Pairs with the base')).toHaveValue('22₃ 22₃');
  });

  it('offers a random real network button with only references in 1..N', () => {
    window.history.replaceState(null, '', '/network/?code=0000&lang=en');
    render(<NetworkPage />);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    fireEvent.click(screen.getByRole('button', { name: 'Random real network', exact: true }));
    expect(screen.getByLabelText('Pairs with the base')).toHaveValue('11₃ 11₃');
    expect(screen.getByLabelText('Link to this picture').value).toContain('code=1111');
    expect(screen.getByRole('button', { name: 'Random network', exact: true })).toBeInTheDocument();
  });
});
