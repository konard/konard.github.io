// Issue #49: "rename Menus level to drop down list, and add configuration for
// top level menu, second level menu and so on". The drop-down lists keep the
// settings of the old "Menus" level; the links of the top-level menu (the pages
// of the site) and of the second-level menu (the sections of a page) are levels
// of their own. These tests failed before the change.
import { render, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULTS, FIELDS } from './settings/schema';
import { LEVEL_IDS, LEVEL_NAMES, levelKey } from './settings/schema.skins';
import { CONTROL_TYPES, CONTROLS } from './skins.frames';
import { LEVEL_FILES, levelCss } from './skins.frames.levels';

const read = (name) => readFileSync(join(__dirname, name), 'utf8');

describe('the levels of the menus (issue #49)', () => {
  it('calls the old menu level drop-down lists and adds the top-level and the second-level menu', () => {
    expect(LEVEL_NAMES.menu).toEqual({ en: 'Drop-down lists', ru: 'Выпадающие списки' });
    expect(LEVEL_NAMES.nav).toEqual({ en: 'Top-level menu', ru: 'Меню верхнего уровня' });
    expect(LEVEL_NAMES.subnav).toEqual({ en: 'Second-level menu', ru: 'Меню второго уровня' });
    expect(LEVEL_IDS).toEqual(expect.arrayContaining(['menu', 'nav', 'subnav']));
    // Every level has a name in both languages.
    for (const level of LEVEL_IDS)
      expect([level, Object.keys(LEVEL_NAMES[level] ?? {})]).toEqual([level, ['en', 'ru']]);
  });

  it('gives the links of each menu to its own level, and to one level only', () => {
    expect(CONTROL_TYPES.nav).toEqual(['.pages a']);
    expect(CONTROL_TYPES.subnav).toEqual(['.nav ul a', '.nav__top']);
    expect(CONTROL_TYPES.tab).not.toContain('.pages a');
    expect(CONTROL_TYPES.menu).toEqual(['.ui-select', '.ui-select__list']);
    expect(new Set(CONTROLS).size).toBe(CONTROLS.length);

    const { container } = render(
      <div>
        <nav className="pages">
          <a href="/">Home</a>
        </nav>
        <nav className="nav">
          <a className="nav__top" href="#top">
            Top
          </a>
          <ul>
            <li>
              <a href="#a">A</a>
            </li>
          </ul>
        </nav>
      </div>,
    );
    const levelOf = (el) =>
      Object.entries(CONTROL_TYPES)
        .filter(([, selectors]) => selectors.some((s) => el.matches(s)))
        .map(([level]) => level);
    expect(levelOf(within(container).getByText('Home'))).toEqual(['nav']);
    expect(levelOf(within(container).getByText('Top'))).toEqual(['subnav']);
    expect(levelOf(within(container).getByText('A'))).toEqual(['subnav']);
  });

  it('keeps the look of the menus by default: the pages follow all controls, the sections stay plain links', () => {
    for (const level of ['nav', 'subnav']) {
      const corners = FIELDS.find((f) => f.key === levelKey(level, 'Corners'));
      expect(corners.options.map((o) => o.value)).toEqual(['same', 'own', 'border']);
    }
    expect(DEFAULTS['corner.navCorners']).toBe('same');
    expect(DEFAULTS['corner.subnavCorners']).toBe('border');
  });

  it('has a stylesheet for each new level, imported by the futuristic skin', () => {
    const future = read('skins.future.css');
    for (const level of ['nav', 'subnav']) {
      const file = `skins.frames.level-${level}.css`;
      expect(LEVEL_FILES).toContainEqual([file, level]);
      expect(read(file)).toBe(levelCss(level));
      expect(future).toContain(`@import './${file}';`);
    }
    expect(levelCss('nav')).toContain("[data-corner-nav-corners='own'] .pages a");
    expect(levelCss('tab')).not.toContain('.pages a');
  });
});
