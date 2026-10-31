// Issue #45: the frame of the custom corners on every bordered element, with
// the widths of the sides and corners, the corner layer, the content cut by
// the frame, the selection and the accent strip. These tests failed before the
// change: the rules, the settings and the variables did not exist.
import { fireEvent, render, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import SettingsPage from './pages/SettingsPage';
import { applySettings } from './settings/apply';
import { CSS_RULES, DEFAULTS, FIELDS } from './settings/schema';
import { getSettings, setSettings } from './settings/store';
import UiSamples from './pages/UiSamples';
import { BLOCKS, CONTROLS, CORNERS, EDGE_STYLES, framesCss, INNER, PANELS } from './skins.frames';

const read = (name) => readFileSync(join(__dirname, name), 'utf8');
const FRAMES = framesCss();
const FUTURE = read('skins.future.css');
const MATERIALS = read('skins.materials.css');
const UI = read('ui.css');
const field = (key) => FIELDS.find((f) => f.key === key);
const SIDES = ['top', 'right', 'bottom', 'left'];

describe('the same frame on every bordered element (issue #45)', () => {
  it('frames outer panels, inner blocks and controls', () => {
    for (const selector of ['.card', '.repo', '.position', '.stat', '.settings__group', '.preset']) {
      expect(PANELS).toContain(selector);
    }
    expect(BLOCKS).toContain('.page-stats li');
    for (const selector of ['.button', 'textarea', '.chip', '.tags li', '.segmented', '.ui-select__list']) {
      expect(CONTROLS).toContain(selector);
    }
    expect(CONTROLS.some((selector) => selector.startsWith('button:not('))).toBe(true);
    expect(CONTROLS.some((selector) => selector.startsWith('input:not('))).toBe(true);
  });

  it('scales the corners down for inner blocks and controls', () => {
    for (const corner of CORNERS) {
      expect(FRAMES).toContain(`--fx-${corner}-s: calc(var(--corner-${corner}-size, 14px) * var(--fx-scale, 1));`);
    }
    expect(FRAMES).toContain('--fx-scale: var(--corner-block-scale, 0.6);');
    expect(FRAMES).toContain('--fx-scale: var(--corner-control-scale, 0.35);');
    // The variables are declared again on every framed element, so each one resolves its own scale.
    expect(FRAMES).toMatch(/:root\[data-corner-tl-shape='cut'\] :where\([^)]*\.repo/);
  });

  it('cuts the controls by the frame and draws the frame over their fill', () => {
    expect(FRAMES).toContain(":not([data-corner-controls='border']) :is(");
    expect(FRAMES).toContain('clip-path: var(--fx-clip);');
    expect(FRAMES).toContain('background-image: var(--fx-frame-img), var(--fx-control-img, none);');
    // A colour swatch is a child of its button, so neither the frame nor the fill paints over it.
    expect(read('pages/settings.css')).toContain('.palettes__chip .swatch {');
    expect(UI).toContain(':is(button, .button):has(> .swatch) {');
  });

  it('keeps the samples of the outer panels outer though they sit in a settings panel', () => {
    // The samples are inside the .settings__group panel; before, that made every sample an inner block.
    document.body.innerHTML = `
      <section class="settings__group"><div data-frame-root>
        <article class="card"><ul><li class="repo"></li></ul></article><ul><li class="stat"></li></ul>
      </div><article class="preset"></article></section>
      <article class="card"><ul><li class="repo"></li></ul></article>`;
    const inner = (selector) => [...document.querySelectorAll(selector)].map((element) => element.matches(INNER));
    expect(inner('.settings__group, .card, .stat, .preset')).toEqual([false, false, false, true, false]);
    expect(inner('.repo')).toEqual([true, true]);
    for (const part of [INNER.replace(':is(', ':where('), `[data-corner-blocks='line'] ${INNER}`])
      expect(FRAMES).toContain(part);
    document.body.innerHTML = '';
    render(<UiSamples />);
    expect(document.querySelector('.ui-samples [data-frame-root] .card')).not.toBeNull();
  });

  it('can draw inner blocks with a plain line instead', () => {
    expect(FRAMES).toContain("[data-corner-blocks='line'] :is(");
    expect(field('corner.blocks').options.map((o) => o.value)).toEqual(['frame', 'line']);
  });
});

describe('widths of the sides, the corners and the accent strip (issue #45)', () => {
  it('has a width for every side and every corner, automatic by default', () => {
    for (const key of [...SIDES.map((s) => `corner.${s}Width`), ...CORNERS.map((c) => `corner.${c}Width`)]) {
      expect(field(key), key).toBeDefined();
      expect(DEFAULTS[key], key).toBe(-1);
    }
    for (const side of SIDES) expect(FRAMES).toContain(`--fx-ew-${side}: var(--corner-${side}-width, var(--fx-ew));`);
    for (const corner of CORNERS) expect(FRAMES).toContain(`var(--corner-${corner}-width, `);
  });

  it('puts a chosen width on <html> and takes it away for the automatic one', () => {
    const root = document.createElement('html');
    applySettings(root, CSS_RULES, { ...DEFAULTS, 'corner.topWidth': 3, 'corner.tlWidth': 0, 'future.accentWidth': 4 });
    expect(root.style.getPropertyValue('--corner-top-width')).toBe('3px');
    expect(root.style.getPropertyValue('--corner-tl-width')).toBe('0px');
    expect(root.style.getPropertyValue('--future-accent-width')).toBe('4px');
    applySettings(root, CSS_RULES, { ...DEFAULTS });
    expect(root.style.getPropertyValue('--corner-top-width')).toBe('');
    expect(root.style.getPropertyValue('--future-accent-width')).toBe('');
  });

  it('sizes the accent strip of a panel by its width and its share of the panel', () => {
    expect(FUTURE).toContain('--fx-bar-w: var(--future-accent-width, var(--ui-accent-size, 2px));');
    expect(FUTURE).toContain('min(calc(var(--future-accent-max, 0.8) * 100%), var(--future-accent-length, 112px))');
    for (const style of ['solid', 'center', 'glow']) expect(FUTURE).toContain(`[data-future-accent-style='${style}']`);
  });

  it('draws the strip of a stat along its top, so its size is a height', () => {
    expect(UI).toMatch(/\.stat::before \{\s*height: var\(--ui-accent-size\);/);
  });

  it('has a dashed and a dotted edge for the frame and every border style for the controls', () => {
    for (const style of EDGE_STYLES.filter((s) => s !== 'double')) {
      expect(FRAMES).toContain(`[data-corner-edge-style='${style}']`);
    }
    for (const style of EDGE_STYLES) expect(FRAMES).toContain(`[data-ui-border-style='${style}'] :where(`);
  });
});

describe('the corner layer (issue #45)', () => {
  it('draws the frame above the content by default, over the colour bar of a position', () => {
    expect(DEFAULTS['corner.layer']).toBe('top');
    expect(FRAMES).toContain(":not([data-corner-layer='below']) :is(");
    const overlay = FRAMES.slice(FRAMES.indexOf('::after'));
    expect(overlay).toContain('pointer-events: none;');
    expect(overlay).toContain('background-image: var(--fx-frame-img);');
    // The panel then leaves the frame out of its own background.
    expect(FUTURE).toContain('var(--fx-frame-under, var(--fx-frame-img))');
    expect(MATERIALS).toContain('var(--fx-frame-under, var(--fx-frame-img))');
  });
});

describe('content, selection and transparency (issue #45)', () => {
  it('cuts the content that does not fit at the frame of every panel', () => {
    expect(DEFAULTS['ui.overflow']).toBe('clip');
    const clip = UI.slice(UI.indexOf("[data-ui-overflow='visible']"));
    const cut = FUTURE.slice(FUTURE.indexOf('/* Cut corners'));
    for (const selector of PANELS.filter((s) => s !== '.chart')) {
      expect(clip.slice(0, clip.indexOf('overflow: clip')), selector).toContain(selector);
      expect(cut.slice(0, cut.indexOf('clip-path')), selector).toContain(selector);
    }
  });

  it('selects text in the accent unless the system colour is chosen', () => {
    expect(field('ui.selection').options.map((o) => o.value)).toEqual(['accent', 'accent2', 'system']);
    expect(UI).toContain(":root:not([data-ui-selection='system']) ::selection");
    expect(UI).toContain("[data-ui-selection='accent2']");
    expect(UI).toContain('var(--ui-selection-opacity, 0.35)');
  });
});

describe('make all corners like this one (issue #45)', () => {
  it('copies the line width of the corner too', () => {
    setSettings({ 'skin.name': 'futuristic', 'future.frame': 'custom', 'corner.tlWidth': 3 });
    render(<SettingsPage />);
    const section = document.getElementById('corners');
    fireEvent.click(within(section).getByRole('button', { name: 'Make all corners like this one' }));
    const settings = getSettings();
    expect(CORNERS.map((c) => settings[`corner.${c}Width`])).toEqual([3, 3, 3, 3]);
  });
});
