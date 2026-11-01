// Issue #47: "each type of INTERFACE CONTROLS must have separate CORNERS OF
// THE FRAME, so on each level I should be able to configure it fully". Inner
// blocks and every type of control (buttons, fields, tabs, chips, menus,
// tables) now have their own shape, line, size and width at every corner, and
// their own edges, edge style and side widths, like the outer panels. These
// tests failed before the change: the levels, their settings and their
// stylesheets did not exist.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import SettingsPage from './pages/SettingsPage';
import { applySettings } from './settings/apply';
import { CSS_RULES, DEFAULTS, FIELDS, SECTIONS } from './settings/schema';
import { cornerKey, LEVEL_IDS, levelKey } from './settings/schema.skins';
import { getSettings, setSettings } from './settings/store';
import { CONTROL_TYPES, CORNERS, INNER, LINES, SHAPES } from './skins.frames';
import { LEVEL_FILES, levelCss } from './skins.frames.levels';

const read = (name) => readFileSync(join(__dirname, name), 'utf8');
const FUTURE = read('skins.future.css');
const field = (key) => FIELDS.find((f) => f.key === key);
const LEVELS = ['block', ...Object.keys(CONTROL_TYPES)];

describe('separate corners of the frame for every level (issue #47)', () => {
  it('has a level for inner blocks and for every type of control', () => {
    expect(LEVEL_IDS).toEqual(['panel', 'block', 'button', 'field', 'tab', 'chip', 'menu', 'table']);
    const corners = SECTIONS.find((section) => section.id === 'corners');
    expect(corners.levels.map((level) => level.id)).toEqual(LEVEL_IDS);
  });

  it('configures every corner of every level fully: shape, line, size and width', () => {
    for (const level of LEVELS)
      for (const corner of CORNERS) {
        const shape = field(cornerKey(level, corner, 'Shape'));
        expect([level, corner, shape?.options.map((o) => o.value)]).toEqual([level, corner, Object.keys(SHAPES)]);
        expect(field(cornerKey(level, corner, 'Line')).options.map((o) => o.value)).toEqual(LINES);
        // −1 follows the outer panels (the size in the scale of the level).
        expect(field(cornerKey(level, corner, 'Size')).d).toBe(-1);
        expect(field(cornerKey(level, corner, 'Width')).d).toBe(-1);
        expect(field(cornerKey(level, corner, 'Shape'))).toMatchObject({ level, corner, tab: corner });
      }
    expect(cornerKey('button', 'tl', 'Shape')).toBe('corner.buttonTlShape');
    expect(cornerKey('panel', 'tl', 'Shape')).toBe('corner.tlShape');
  });

  it('configures the edges of every level: colour, style and the width of every side', () => {
    for (const level of LEVELS) {
      expect(field(levelKey(level, 'Edges')).options.map((o) => o.value)).toEqual(['same', 'none', 'faint', 'line']);
      expect(field(levelKey(level, 'EdgeStyle')).options.map((o) => o.value)).toContain('double');
      for (const side of ['Top', 'Right', 'Bottom', 'Left'])
        expect([level, side, field(levelKey(level, `${side}Width`))?.d]).toEqual([level, side, -1]);
    }
  });

  it('lets every type of control follow all controls, have its own corners or its own border', () => {
    for (const level of Object.keys(CONTROL_TYPES))
      expect(field(levelKey(level, 'Corners')).options.map((o) => o.value)).toEqual(['same', 'own', 'border']);
    expect(field('corner.blocks').options.map((o) => o.value)).toEqual(['frame', 'own', 'line']);
    // Nothing changes by default: tables keep their border, as before.
    expect(DEFAULTS['corner.buttonCorners']).toBe('same');
    expect(DEFAULTS['corner.tableCorners']).toBe('border');
    expect(DEFAULTS['corner.blocks']).toBe('frame');
  });
});

describe('the stylesheets of the levels (issue #47)', () => {
  it('are generated from src/skins.frames.levels.js and imported by the futuristic skin', () => {
    expect(LEVEL_FILES.map(([, level]) => level)).toEqual(LEVELS);
    for (const [file, level] of LEVEL_FILES) {
      expect([file, read(file) === levelCss(level)]).toEqual([file, true]);
      expect(FUTURE).toContain(`@import './${file}';`);
    }
  });

  it('puts the numbers of every shape and line of every corner of a level on the root only, while it has its own', () => {
    for (const level of LEVELS) {
      const css = levelCss(level);
      const own = level === 'block' ? "[data-corner-blocks='own']" : `[data-corner-${level}-corners='own']`;
      // A level that follows the panels declares nothing on the root.
      expect(css).not.toMatch(new RegExp(`^:root\\[data-corner-${level}-(tl|tr|br|bl)-`, 'm'));
      for (const corner of CORNERS) {
        for (const shape of Object.keys(SHAPES))
          expect(css).toContain(
            `:root${own}[data-corner-${level}-${corner}-shape='${shape}'] { --fx-${level}-${corner}-`,
          );
        for (const line of LINES) expect(css).toContain(`:root${own}[data-corner-${level}-${corner}-line='${line}'] {`);
      }
    }
  });

  it('draws the frame of a type of control with its own corners only while it has them', () => {
    const css = levelCss('button');
    const own =
      ":root:root:root[data-skin-name='futuristic'][data-future-frame='custom'][data-corner-button-corners='own'] ";
    expect(css).toContain(`${own}button:not(`);
    expect(css).toContain(`${own}.button {`);
    expect(css).toContain('clip-path: polygon(var(--fxbutton-tl-0x) var(--fxbutton-tl-0y)');
    // The lengths of the level are declared only while it has its own corners.
    expect(css).toContain(
      ":root[data-skin-name='futuristic'][data-future-frame='custom'][data-corner-button-corners='own'] {\n  --fxbutton-",
    );
    // Its own edge colour, which a button reads instead of the one of the panel it is in.
    expect(css).toContain("[data-corner-button-corners='own'][data-corner-button-edges='line'] { --fx-button-ce-col");
    expect(css).toContain("[data-corner-button-edge-style='dashed'] :where(button:not(");
  });

  it('draws inner blocks with their own corners, edges and edge style', () => {
    const css = levelCss('block');
    expect(css).toContain("[data-corner-blocks='own'] {\n  --fxblock-");
    expect(css).toContain("[data-corner-blocks='own'][data-corner-block-edges='faint']");
    expect(css).toContain('--fx-ec: var(--fx-block-ec);');
    expect(css).toContain("[data-corner-blocks='own'][data-corner-block-edge-style='dotted'] { --fx-block-ce-h:");
    // Panels in panels are checked on every element of the page: one rule for them,
    // and the images of their edges are made once on the root.
    expect(css.split(INNER.replace(':is(', ':where(')).length - 1).toBe(1);
    expect(css).not.toContain(INNER);
  });
});

describe('the settings of the levels on the page (issue #47)', () => {
  it('puts the sizes and widths of a level on <html>, and removes them at −1 so it follows the panels', () => {
    const root = document.documentElement;
    applySettings(root, CSS_RULES, {
      ...DEFAULTS,
      'corner.buttonCorners': 'own',
      'corner.buttonTlSize': 6,
      'corner.buttonTopWidth': 2,
      'corner.buttonTlShape': 'round',
    });
    expect(root.style.getPropertyValue('--corner-button-tl-size')).toBe('6px');
    expect(root.style.getPropertyValue('--corner-button-top-width')).toBe('2px');
    expect(root.getAttribute('data-corner-button-corners')).toBe('own');
    expect(root.getAttribute('data-corner-button-tl-shape')).toBe('round');
    applySettings(root, CSS_RULES, { ...DEFAULTS });
    expect(root.style.getPropertyValue('--corner-button-tl-size')).toBe('');
    expect(root.style.getPropertyValue('--corner-button-top-width')).toBe('');
  });

  it('shows the corners of a level in its tab once it has its own, and starts them from the panels', () => {
    setSettings({ 'skin.name': 'futuristic', 'future.frame': 'custom', 'corner.tlShape': 'notch' });
    render(<SettingsPage />);
    const section = document.getElementById('corners');
    const levels = within(section).getByRole('tablist', { name: 'Levels' });
    expect(
      within(levels)
        .getAllByRole('tab')
        .map((tab) => tab.textContent),
    ).toEqual(['Outer panels', 'Inner blocks', 'Buttons', 'Fields', 'Tabs', 'Chips and tags', 'Menus', 'Tables']);
    fireEvent.click(within(levels).getByRole('tab', { name: 'Buttons' }));
    const panel = document.getElementById('corners-level');
    // The buttons follow all controls: no corners of their own yet.
    expect(within(panel).queryByRole('radiogroup')).toBeNull();
    act(() => setSettings({ 'corner.buttonCorners': 'own' }));
    expect(within(levels).getByRole('tab', { name: 'Buttons' }).className).toContain('is-on');
    // Every corner of the buttons, with tiles of their own.
    const shapes = within(panel).getAllByRole('radiogroup')[0];
    fireEvent.click(within(shapes).getByRole('radio', { name: 'Round' }));
    expect(getSettings()['corner.buttonTlShape']).toBe('round');
    expect(getSettings()['corner.tlShape']).toBe('notch');
    fireEvent.click(screen.getByRole('button', { name: 'Start from the corners of the outer panels' }));
    const settings = getSettings();
    expect(CORNERS.map((c) => settings[cornerKey('button', c, 'Shape')])).toEqual(
      CORNERS.map((c) => settings[cornerKey('panel', c, 'Shape')]),
    );
    expect(settings['corner.buttonTlSize']).toBe(-1);
  });
});
