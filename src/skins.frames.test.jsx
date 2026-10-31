import { chooseSelect } from './test/select';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import SettingsPage from './pages/SettingsPage';
import { CORNER_LINES, CORNER_SHAPES } from './settings/schema.skins';
import { DEFAULTS } from './settings/schema';
import { getSettings, setSettings } from './settings/store';
import { CORNERS, cornerPoints, cornersCss, cornerSteps, EDGES, framesCss, LINES, SHAPES } from './skins.frames';

const root = document.documentElement;
const CSS = readFileSync(join(__dirname, 'skins.frames.css'), 'utf8');
const NUMBERS = readFileSync(join(__dirname, 'skins.frames.corners.css'), 'utf8');

describe('custom frames: geometry (issue #15)', () => {
  it('has a shape and a line in the settings for every shape and line it draws', () => {
    expect(CORNER_SHAPES.map((option) => option.value)).toEqual(Object.keys(SHAPES));
    expect(CORNER_LINES.map((option) => option.value)).toEqual(LINES);
  });

  it('starts every shape on the left edge and ends it on the top edge', () => {
    for (const [name, { points, x, y }] of Object.entries(SHAPES)) {
      const [first, last] = [points[0], points[points.length - 1]];
      expect([name, first[0], first[1]]).toEqual([name, 0, y]);
      expect([name, last[0], last[1]]).toEqual([name, x, 0]);
    }
  });

  it('keeps a round corner on its circle and a scoop on the circle round the corner', () => {
    for (const [px, py] of SHAPES.round.points) expect(Math.hypot(1 - px, 1 - py)).toBeCloseTo(1, 3);
    for (const [px, py] of SHAPES.scoop.points) expect(Math.hypot(px, py)).toBeCloseTo(1, 3);
  });

  it('mirrors the points for the other corners in the clockwise order of the polygon', () => {
    expect(cornerSteps('tl', 'cut').slice(0, 2)).toEqual([
      [0, 1],
      [1, 0],
    ]);
    expect(cornerSteps('tr', 'cut').slice(0, 2)).toEqual([
      [1, 0],
      [0, 1],
    ]);
    expect(cornerSteps('br', 'tall')[0]).toEqual([0, 2]);
    expect(cornerSteps('tr', 'square')[0]).toEqual([0, 0]);
    // A right or bottom corner counts from the far side of the panel.
    expect(cornerPoints('tl')[0]).toBe(
      'calc(var(--fx-tl-s) * var(--fx-tl-k0x)) calc(var(--fx-tl-s) * var(--fx-tl-k0y))',
    );
    expect(cornerPoints('br')[0]).toBe(
      'calc(100% - var(--fx-br-s) * var(--fx-br-k0x)) calc(100% - var(--fx-br-s) * var(--fx-br-k0y))',
    );
  });
});

describe('custom frames: stylesheet (issue #15)', () => {
  it('is generated from src/skins.frames.js (run npm run build:frames)', () => {
    expect(CSS).toBe(framesCss());
    expect(NUMBERS).toBe(cornersCss());
  });

  it('has a rule for every shape and line of every corner and for every kind of edges', () => {
    for (const corner of CORNERS) {
      for (const shape of Object.keys(SHAPES)) expect(NUMBERS).toContain(`[data-corner-${corner}-shape='${shape}']`);
      for (const line of LINES) expect(NUMBERS).toContain(`[data-corner-${corner}-line='${line}']`);
      expect(CSS).toContain(`var(--corner-${corner}-size, 14px)`);
    }
    for (const edge of EDGES) expect(CSS).toContain(`[data-corner-edges='${edge}']`);
  });

  it('clips the panel with the points of the four corners and draws 20 frame layers', () => {
    expect(CSS).toContain('--fx-clip: polygon(var(--fx-tl-p), var(--fx-tr-p), var(--fx-br-p), var(--fx-bl-p));');
    const frame = CSS.slice(CSS.indexOf('--fx-frame-img:'), CSS.indexOf('--fx-frame-size:'));
    expect(frame.split(',\n').length).toBe(20);
    // An edge never gets a negative length (that would break every layer of the panel).
    expect(CSS.match(/max\(0px, calc\(100% - /g)).toHaveLength(4);
  });

  it('is part of the futuristic skin, whose panels then have no border of their own', () => {
    const future = readFileSync(join(__dirname, 'skins.future.css'), 'utf8');
    expect(future).toContain("@import './skins.frames.css';");
    expect(future).toContain('border: var(--fx-border-w, var(--future-border, 1px)) solid var(--fx-edge);');
    expect(CSS).toContain('--fx-border-w: 0px;');
  });
});

describe('custom frames: corner tiles (issue #15)', () => {
  const showCorners = () => {
    setSettings({ 'skin.name': 'futuristic', 'future.frame': 'custom' });
    render(<SettingsPage />);
    return document.getElementById('corners');
  };

  it('shows the corners only for the custom frame of the futuristic skin', () => {
    setSettings({ 'skin.name': 'glass', 'future.frame': 'corners' });
    render(<SettingsPage />);
    expect(document.getElementById('corners')).toBeNull();
    chooseSelect(screen.getByRole('combobox', { name: 'Skin' }), 'futuristic');
    expect(document.getElementById('corners')).toBeNull();
    chooseSelect(screen.getByRole('combobox', { name: 'Frame' }), 'custom');
    expect(document.getElementById('corners')).toBeInTheDocument();
    expect(root.dataset.futureFrame).toBe('custom');
  });

  it('has a tile with a preview for every shape and every line of the chosen corner', () => {
    const section = showCorners();
    const shapes = within(section).getByRole('radiogroup', { name: 'Shape' });
    const lines = within(section).getByRole('radiogroup', { name: 'Line' });
    expect(within(shapes).getAllByRole('radio')).toHaveLength(CORNER_SHAPES.length);
    expect(within(lines).getAllByRole('radio')).toHaveLength(CORNER_LINES.length);
    for (const tile of [...within(shapes).getAllByRole('radio'), ...within(lines).getAllByRole('radio')]) {
      expect(tile.querySelector('svg polygon')).not.toBeNull();
    }
    expect(within(shapes).getByRole('radio', { name: 'Cut' })).toHaveAttribute('aria-checked', 'true');
  });

  it('sets the attribute of the corner when a tile is chosen', () => {
    const section = showCorners();
    fireEvent.click(within(section).getByRole('tab', { name: 'Bottom left' }));
    fireEvent.click(within(section).getByRole('radio', { name: 'Round' }));
    expect(root.dataset.cornerBlShape).toBe('round');
    expect(root.dataset.cornerTlShape).toBe('cut');
    fireEvent.click(within(section).getByRole('radio', { name: 'Missing border near the corner' }));
    expect(root.dataset.cornerBlLine).toBe('gap');
    fireEvent.change(within(section).getByLabelText('Size'), { target: { value: '30' } });
    expect(root.style.getPropertyValue('--corner-bl-size')).toBe('30px');
    expect(within(section).getByRole('radio', { name: 'Round' })).toHaveAttribute('aria-checked', 'true');
  });

  it('mirrors the preview for the other corners and draws the line on the chosen shape', () => {
    const section = showCorners();
    fireEvent.click(within(section).getByRole('tab', { name: 'Bottom right' }));
    const svg = within(section).getByRole('radio', { name: 'Square' }).querySelector('svg');
    expect(svg.style.transform).toBe('scale(-1, -1)');
    // The bottom right corner is a cut by default, so the line tiles show a cut with a diagonal.
    const bright = within(section).getByRole('radio', { name: 'Bright line' });
    expect(bright.querySelector('.corner-tile__accent').getAttribute('points')).toBe('5,15 15,5');
    const none = within(section).getByRole('radio', { name: 'No line at the corner' });
    expect(none.querySelector('.corner-tile__accent')).toBeNull();
  });

  it('makes every corner like the chosen one', () => {
    const section = showCorners();
    fireEvent.click(within(section).getByRole('radio', { name: 'Scoop (round inwards)' }));
    fireEvent.click(within(section).getByRole('button', { name: 'Make all corners like this one' }));
    const s = getSettings();
    expect(CORNERS.map((c) => [s[`corner.${c}Shape`], s[`corner.${c}Line`], s[`corner.${c}Size`]])).toEqual(
      CORNERS.map(() => ['scoop', DEFAULTS['corner.tlLine'], DEFAULTS['corner.tlSize']]),
    );
    expect(root.dataset.cornerBrShape).toBe('scoop');
  });
});
