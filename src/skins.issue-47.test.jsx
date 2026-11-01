// Issue #47: the cut corners of a chart were not transparent. Charts were the
// only framed panels the futuristic skin did not cut to the outline of their
// frame (and did not clip their content), so that their tooltips, drawn inside
// them, were not cut at the edge: their glass surface, blur and shadow filled
// the corners. A tooltip is now drawn outside the chart, and a chart is cut
// like every other panel. These tests failed before the change.
import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import LanguagesChart from './components/LanguagesChart';
import github from './data/github.lino';
import { PANELS } from './skins.frames';

const read = (name) => readFileSync(join(__dirname, name), 'utf8');
const FUTURE = read('skins.future.css');
const UI = read('ui.css');

/** The items of the `:is()` / `:where()` list of the rule that declares `declaration`. */
const listOf = (css, declaration) => {
  const end = css.indexOf(declaration);
  expect(end).toBeGreaterThan(-1);
  const head = css.slice(css.lastIndexOf('}', end) + 1, end);
  const list = head.slice(head.lastIndexOf('(\n') + 1, head.lastIndexOf(')'));
  return { head, items: list.split(',').map((item) => item.trim()) };
};

describe('the corners of every framed panel are transparent (issue #47)', () => {
  it('cuts every outer panel of the frame to its outline, charts included', () => {
    const { head, items } = listOf(FUTURE, 'clip-path: var(--fx-el-clip, var(--fx-clip));');
    expect(items).toContain('.chart');
    for (const panel of PANELS) expect([panel, items.includes(panel)]).toEqual([panel, true]);
    expect(head).not.toContain('data-tooltip-root');
  });

  it('cuts the content of charts at their edges like the content of other panels', () => {
    const { head, items } = listOf(UI, 'overflow: clip;');
    expect(items).toContain('.chart');
    expect(head).not.toContain('data-tooltip-root');
  });

  it('leaves no panel uncut because of a tooltip', () => {
    for (const css of [FUTURE, UI, read('skins.materials.css'), read('App.css')])
      expect(css).not.toMatch(/:not\(:has\(\[data-tooltip-root\]\)\)/);
  });

  it('draws a tooltip outside the chart, where the outline of the chart cannot cut it', () => {
    const { container } = render(
      <div className="app">
        <LanguagesChart languages={github.languages} favorites={[]} />
      </div>,
    );
    const app = container.querySelector('.app');
    const chart = container.querySelector('[data-tooltip-root]');
    const item = chart.querySelector('[tabindex]');
    fireEvent.focus(item);
    const tip = screen.getByRole('status');
    expect(chart.contains(tip)).toBe(false);
    expect(tip.parentElement).toBe(app);
    expect(tip).toHaveClass('tooltip');
    fireEvent.blur(item);
    fireEvent.pointerLeave(item);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('places a tooltip at the pointer, in the coordinates of the app, and flips it near the right edge', () => {
    const { container } = render(
      <div className="app">
        <LanguagesChart languages={github.languages} favorites={[]} />
      </div>,
    );
    const app = container.querySelector('.app');
    const chart = container.querySelector('[data-tooltip-root]');
    const rect = (left, top, width, height) => () => ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    });
    // The app starts 300px above the viewport (the page is scrolled); the chart is 400px wide at x = 100.
    app.getBoundingClientRect = rect(0, -300, 1000, 3000);
    chart.getBoundingClientRect = rect(100, 200, 400, 300);
    const item = chart.querySelector('[tabindex]');
    fireEvent.pointerMove(item, { clientX: 150, clientY: 250 });
    let tip = screen.getByRole('status');
    expect([tip.style.left, tip.style.top]).toEqual(['150px', '550px']);
    expect(tip).not.toHaveClass('tooltip--flip');
    fireEvent.pointerMove(item, { clientX: 450, clientY: 260 });
    tip = screen.getByRole('status');
    expect([tip.style.left, tip.style.top]).toEqual(['450px', '560px']);
    expect(tip).toHaveClass('tooltip--flip');
  });
});
