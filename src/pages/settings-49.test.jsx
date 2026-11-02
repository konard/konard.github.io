// Issue #49: "in CORNERS OF THE FRAME we should always see the preview of what
// we configuring at the moment right in this panel, so user always sees it"
// and "in settings we have big gap to the left, so we may need to rearrange
// blocks of settings". These tests failed before the change: the corners
// section had no preview, and every look section was in the right column.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULTS, SECTIONS } from '../settings/schema';
import { LEVEL_IDS } from '../settings/schema.skins';
import { setSettings } from '../settings/store';
import { BLOCKS, CONTROL_TYPES, INNER, PANELS } from '../skins.frames';
import LevelPreview from './LevelPreview';
import SettingsPage from './SettingsPage';
import { estimateHeight, placeSections } from './settingsColumns';

// Inner blocks are panels inside a panel, or small items of lists.
const LEVELS = { panel: PANELS, block: [INNER, ...BLOCKS], ...CONTROL_TYPES };
const shownSections = (settings) => SECTIONS.filter((section) => !section.when || section.when(settings));
const heights = (columns) => columns.map((column) => column.reduce((sum, section) => sum + estimateHeight(section), 0));

describe('the preview of the corners section (issue #49)', () => {
  it('shows a sample of every level drawn by the selectors of that level', () => {
    for (const level of LEVEL_IDS) {
      const { container, unmount } = render(<LevelPreview level={level} />);
      const stage = container.querySelector('.level-preview__stage');
      const matched = [...stage.querySelectorAll('*')].filter((el) => LEVELS[level].some((s) => el.matches(s)));
      expect([level, matched.length > 0]).toEqual([level, true]);
      unmount();
    }
  });

  it('is in the corners section and follows the chosen level', () => {
    setSettings({ 'skin.name': 'futuristic', 'future.frame': 'custom' });
    render(<SettingsPage />);
    const section = document.getElementById('corners');
    const preview = () => section.querySelector('.level-preview');
    expect(preview()).toHaveAttribute('data-level', 'panel');
    expect(preview()).toHaveAccessibleName('Preview: Outer panels');
    const levels = within(section).getByRole('tablist', { name: 'Levels' });
    for (const [name, level] of [
      ['Buttons', 'button'],
      ['Top-level menu', 'nav'],
      ['Tables', 'table'],
    ]) {
      fireEvent.click(within(levels).getByRole('tab', { name }));
      expect(preview()).toHaveAttribute('data-level', level);
      expect(preview()).toHaveAccessibleName(`Preview: ${name}`);
    }
    // Before the settings of the level, so it stays above them while they scroll.
    expect(preview().nextElementSibling).toHaveAttribute('id', 'corners-level');
    expect(screen.getAllByRole('figure', { name: /^Preview:/ })).toHaveLength(1);
  });

  it('stays in sight above the settings of the level while they scroll', () => {
    const css = readFileSync(join(__dirname, 'settings.css'), 'utf8');
    const rule = css.slice(css.indexOf('.level-preview {'));
    expect(rule.slice(0, rule.indexOf('}'))).toContain('position: sticky');
  });
});

describe('the columns of the settings page (issue #49)', () => {
  it('places the sections in order into the shorter column', () => {
    const sections = [10, 50, 20, 30, 5].map((h, i) => ({ id: `s${i}`, h }));
    const columns = placeSections(sections, 2, (s) => s.h).map((column) => column.map((s) => s.id));
    // 10 | 50 → 30 | 50 → 30+30 | 50 → 60 | 50+5
    expect(columns).toEqual([
      ['s0', 's2', 's3'],
      ['s1', 's4'],
    ]);
  });

  it('balances the columns for every skin within one section', () => {
    for (const settings of [
      DEFAULTS,
      { ...DEFAULTS, 'skin.name': 'glass' },
      { ...DEFAULTS, 'skin.name': 'liquid' },
      { ...DEFAULTS, 'skin.name': 'futuristic', 'future.frame': 'custom' },
    ]) {
      const sections = shownSections(settings);
      const [left, right] = heights(placeSections(sections));
      const largest = Math.max(...sections.map(estimateHeight));
      expect([settings['skin.name'], Math.abs(left - right) <= largest]).toEqual([settings['skin.name'], true]);
      // Before issue #49 the look sections all went to the right column.
      const old = [
        sections.filter((s) => ['motion', 'nebula', 'stars', 'grid', 'sound'].includes(s.id)),
        sections.filter((s) => !['motion', 'nebula', 'stars', 'grid', 'sound'].includes(s.id)),
      ];
      const [oldLeft, oldRight] = heights(old);
      expect(Math.abs(left - right)).toBeLessThan(Math.abs(oldLeft - oldRight));
    }
  });

  it('does not move a section by its own settings, only by the sections before it', () => {
    const corners = SECTIONS.find((s) => s.id === 'corners');
    // The estimate reads the defaults, never the settings being changed.
    expect(estimateHeight(corners)).toBe(estimateHeight({ ...corners }));
    const settings = { ...DEFAULTS, 'skin.name': 'futuristic', 'future.frame': 'custom' };
    const columnOf = (columns, id) => columns.findIndex((column) => column.some((s) => s.id === id));
    const sections = shownSections(settings);
    const placed = placeSections(sections);
    for (let i = 1; i <= sections.length; i += 1) {
      const prefix = placeSections(sections.slice(0, i));
      const id = sections[i - 1].id;
      expect([id, columnOf(prefix, id)]).toEqual([id, columnOf(placed, id)]);
    }
  });
});
