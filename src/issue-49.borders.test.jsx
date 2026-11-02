// Issue #49: "We need to make sure all UI elements with borders are
// configurable" and "We also need to add configuration of borders on hover,
// focus, outline and so on". These tests failed before the change: there was
// no src/ui.borders.css, no settings of the lines, of the states or of the
// photo, the focus ring was always solid in the accent, and the lists of the
// panels missed the career card and the calendar of contributions.
// experiments/issue-49-bordered.mjs checks every page in a browser.
import { render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chooseSelect } from './test/select';
import SettingsPage from './pages/SettingsPage';
import { applySettings } from './settings/apply';
import { CSS_RULES, DEFAULTS, SECTIONS } from './settings/schema';
import { CONTROL_TYPES, PANELS, framesCss } from './skins.frames.js';
import { EXCLUDED, LINES, OTHER_CONTROLS, OTHER_PANELS, STATEFUL, bordersCss } from './ui.borders.js';

const read = (file) => readFileSync(join(__dirname, file), 'utf8');
const BORDERS = read('ui.borders.css');
const UI = read('ui.css');
const section = (id) => SECTIONS.find((s) => s.id === id);
const keys = (id) => section(id).fields.map((f) => f.key);

describe('the borders that no setting changed (issue #49)', () => {
  it('are written by npm run build:frames and loaded by the layout', () => {
    expect(BORDERS).toBe(bordersCss());
    expect(read('components/Layout.jsx')).toMatch(/import '\.\.\/ui\.css';\s*import '\.\.\/ui\.borders\.css';/);
  });

  it('cover the lines between the parts of a page, set up in the borders section', () => {
    expect(keys('borders')).toEqual(
      expect.arrayContaining(['ui.lines', 'ui.lineWidth', 'ui.lineStyle', 'ui.lineColor', 'ui.lineOpacity']),
    );
    expect(DEFAULTS['ui.lines']).toBe('skin');
    for (const [side, elements] of Object.entries(LINES)) {
      const selector = `:root:root[data-ui-lines='own'] :is(${elements.join(', ')})`;
      expect(BORDERS).toContain(`${selector} {\n  border-${side}-width: var(--ui-line-width, 1px);`);
    }
    expect(LINES.top).toEqual(expect.arrayContaining(['.nav', '.footer', '.timeline__row', '.setting']));
    expect(LINES.bottom).toContain('.topbar');
    expect(BORDERS).toContain(":root[data-ui-line-color='accent2'] {\n  --ui-line-color: color-mix(");
  });

  it('cover the chips, tabs and badges outside the futuristic skin, and the boxes that are not panels', () => {
    expect(OTHER_CONTROLS).toEqual(expect.arrayContaining(['.chip', '.tags li', '.role-tabs a', '.pages a']));
    expect(BORDERS).toMatch(
      /:root:root:not\(\[data-skin-name='futuristic'\]\) :is\([^)]*\.chip[^{]*\{\n {2}border-width: var\(--ui-control-border, 1px\);\n {2}border-style: var\(--ui-border-style, solid\);/,
    );
    expect(OTHER_PANELS).toEqual(['.settings__json', '.level-preview']);
    expect(BORDERS).toContain(":root:root:not([data-theme='light']) .cv-paper {");
    expect(BORDERS).toContain(":root:root[data-skin-name='liquid'][data-liquid-float='true'] .topbar > * {");
    // Kept on purpose: the presets show the panel of another look.
    expect(EXCLUDED).toEqual(['.preset__panel']);
  });

  it('make the career card and the calendar panels, and the kicker and the status chips', () => {
    expect(PANELS).toEqual(expect.arrayContaining(['.profession', '.contribution-calendar']));
    expect(CONTROL_TYPES.chip).toEqual(expect.arrayContaining(['.hero__kicker', '.habr__status']));
    // Both panel lists of ui.css (border and radius, and overflow) list every panel.
    const lists = UI.split('{').filter((selector) => selector.includes('.profession'));
    expect(lists.length).toBeGreaterThanOrEqual(2);
    for (const inner of lists) for (const panel of PANELS) expect(inner).toContain(panel);
  });

  it('put the border of the photo on the page', () => {
    expect(DEFAULTS['avatar.photoBorder']).toBe(2);
    expect(read('App.css')).toContain('border: var(--avatar-photo-border, 2px) solid var(--surface);');
    const root = document.createElement('html');
    applySettings(root, CSS_RULES, { ...DEFAULTS, 'avatar.photoBorder': 5, 'ui.lines': 'own', 'ui.lineWidth': 3 });
    expect(root.style.getPropertyValue('--avatar-photo-border')).toBe('5px');
    expect(root.style.getPropertyValue('--ui-line-width')).toBe('3px');
    expect(root.getAttribute('data-ui-lines')).toBe('own');
  });
});

describe('the borders of hovered, chosen and focused elements (issue #49)', () => {
  it('have a section of their own, as in the skin by default', () => {
    expect(keys('states')).toEqual([
      'ui.hoverEdge',
      'ui.hoverStyle',
      'ui.activeEdge',
      'ui.activeStyle',
      'ui.chosenWidth',
      'ui.focusColor',
      'ui.focusStyle',
      'ui.focusWidth',
      'ui.focusOffset',
    ]);
    expect(DEFAULTS['ui.hoverEdge']).toBe('skin');
    expect(DEFAULTS['ui.hoverStyle']).toBe('same');
    expect(DEFAULTS['ui.activeEdge']).toBe('skin');
    expect(DEFAULTS['ui.activeStyle']).toBe('same');
    expect(DEFAULTS['ui.focusColor']).toBe('accent');
    expect(DEFAULTS['ui.focusStyle']).toBe('solid');
    expect(DEFAULTS['ui.chosenWidth']).toBe(2);
  });

  it('add no rule with the defaults, and the colour and style of each state otherwise', () => {
    expect(BORDERS).toContain(":root:root:root:not([data-ui-hover-edge='skin']) :is(button:not(");
    expect(BORDERS).toContain(', .button:hover:not(:disabled), ');
    expect(new Set(STATEFUL).size).toBe(STATEFUL.length);
    expect(STATEFUL).toEqual(expect.arrayContaining([...PANELS, ...OTHER_CONTROLS]));
    expect(BORDERS).toContain(":root:root:root:not([data-ui-hover-style='same']) :is(");
    expect(BORDERS).toContain(":root:root:root:not([data-ui-active-edge='skin']) :is(");
    expect(BORDERS).toContain(":root[data-ui-hover-edge='accent2'] {\n  --ui-hover-edge: var(--accent-2);");
    expect(BORDERS).toContain(":root[data-ui-active-style='double'] {\n  --ui-active-style: double;");
    // The chosen state comes after the hover and is as specific, so a chosen element under the pointer shows it.
    expect(BORDERS.indexOf("data-ui-active-edge='skin'")).toBeGreaterThan(BORDERS.indexOf("data-ui-hover-edge='skin'"));
    expect(BORDERS).toContain(
      ".chip:is([aria-pressed='true'], [aria-current='page'], [aria-selected='true'], .is-active, .button--primary):not(:disabled)",
    );
  });

  it('light up the edges of the custom frame in the colours of the states', () => {
    expect(BORDERS).toMatch(/\[data-ui-hover-edge='skin'\]\) :is\([^{]*\{\n {2}--fx-ec: var\(--ui-hover-edge\);/);
    expect(BORDERS).toMatch(/\[data-ui-active-edge='skin'\]\) :is\([^{]*\{\n {2}--fx-ec: var\(--ui-active-edge\);/);
    const frames = framesCss();
    expect(frames).toContain('--fx-ec: var(--ui-hover-edge, var(--accent));');
    expect(frames).toContain('--fx-ec: var(--ui-active-edge, var(--accent));');
    expect(frames).toContain('--fx-ec: var(--ui-focus-color, var(--accent));');
    // Every state of a framed control is as specific as its hover.
    expect(frames).toContain('.chip.is-active:not(:disabled)');
    expect(frames).toContain('.chip:focus-visible:not(:disabled)');
  });

  it('draw the focus ring and the ring of the chosen colour from the settings', () => {
    expect(UI).toContain(
      'outline: var(--ui-focus-width) var(--ui-focus-style, solid) var(--ui-focus-color, var(--accent));',
    );
    expect(UI).toContain('outline: var(--ui-chosen-width, 2px) solid var(--chip);');
    expect(read('pages/settings.css')).toContain('outline: var(--ui-chosen-width, 2px) solid var(--chip);');
    const root = document.createElement('html');
    applySettings(root, CSS_RULES, {
      ...DEFAULTS,
      'ui.hoverEdge': 'accent2',
      'ui.focusStyle': 'dashed',
      'ui.chosenWidth': 4,
    });
    expect(root.getAttribute('data-ui-hover-edge')).toBe('accent2');
    expect(root.getAttribute('data-ui-focus-style')).toBe('dashed');
    expect(root.style.getPropertyValue('--ui-chosen-width')).toBe('4px');
  });

  it('are chosen in the settings', () => {
    render(<SettingsPage />);
    expect(document.getElementById('states')).toBeInTheDocument();
    chooseSelect(screen.getByRole('combobox', { name: 'Border color on hover' }), 'text');
    expect(document.documentElement.dataset.uiHoverEdge).toBe('text');
    chooseSelect(screen.getByRole('combobox', { name: 'Focus ring style' }), 'dotted');
    expect(document.documentElement.dataset.uiFocusStyle).toBe('dotted');
    // The settings of the lines appear with own lines only.
    const borders = within(document.getElementById('borders'));
    expect(borders.queryByLabelText('Line width')).toBeNull();
    chooseSelect(borders.getByRole('combobox', { name: 'Lines between parts' }), 'own');
    expect(borders.getByLabelText('Line width')).toBeInTheDocument();
  });
});
