import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SourceLines from './SourceLines';
import Layout from './Layout';
import { applySettings, normalize } from '../settings/apply';
import { DEFAULTS, RULES } from '../settings/schema';
import { MATERIAL_PRESETS } from '../settings/schema.materials';
import { applyLook } from '../settings/presets';

const data = {
  languages: { JavaScript: 2000, Rust: 1000, Python: 999, Shell: 1 },
  measuredRepositories: 2,
  collectedAt: '2026-10-30T00:00:00Z',
  authoredRepositories: [],
};

describe('issue 39 regressions', () => {
  it('groups only languages below 1,000 lines without changing totals or hiding detail', () => {
    render(<SourceLines data={data} />);
    const table = document.querySelector('.source-lines__table');
    expect(within(table).queryByRole('rowheader', { name: 'Python' })).toBeNull();
    expect(within(table).getByRole('rowheader', { name: 'Rust' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Other' }).closest('tr')).toHaveTextContent('1,000');
    expect(within(table).getByText('Total').closest('tr')).toHaveTextContent('4,000');
    expect(screen.getByText('Python: 999')).toBeInTheDocument();
  });

  it('keeps data sources in the footer without a repeated page-top notice', () => {
    const { container } = render(
      <Layout page="blog">
        <p>Content</p>
      </Layout>,
    );
    expect(container.querySelector('.snapshot-notice')).toBeNull();
    expect(container.querySelector('footer #data-sources')).not.toBeNull();
  });

  it('uses the exact defaults pictured in the issue', () => {
    expect(DEFAULTS).toMatchObject({
      'nebula.twinkle': 1.9,
      'nebula.zoom': 0.55,
      'nebula.starSize': 0.5,
      'nebula.starColor': '#00c7fc',
      'sound.on': true,
    });
  });

  it('migrates the old transparent surface to solid with zero opacity', () => {
    expect(RULES['future.surface'].o).not.toContain('transparent');
    expect(normalize(RULES, { 'future.surface': 'transparent', 'future.opacity': 0.9 })).toMatchObject({
      'future.surface': 'solid',
      'future.opacity': 0,
    });
  });

  it('migrates old saved looks and resolves all eight corners before paint', () => {
    const old = applyLook({ 'future.surface': 'transparent' }, DEFAULTS);
    expect(old['future.opacity']).toBe(0);
    const root = document.createElement('html');
    const settings = { ...DEFAULTS, 'skin.name': 'futuristic', 'future.opacity': 0 };
    for (const [index, corner] of ['Tl', 'Tr', 'Br', 'Bl'].entries()) {
      settings[`ui.panel${corner}`] = index * 4;
      settings[`ui.control${corner}`] = index * 3;
    }
    applySettings(root, RULES, settings);
    expect(root).toHaveAttribute('data-surface-invisible', 'true');
    for (const [index, corner] of ['tl', 'tr', 'br', 'bl'].entries()) {
      expect(root.style.getPropertyValue(`--ui-panel-${corner}-resolved`)).toBe(`${index * 4}px`);
      expect(root.style.getPropertyValue(`--ui-control-${corner}-resolved`)).toBe(`${index * 3}px`);
    }
    applySettings(root, RULES, DEFAULTS);
    expect(root.style.getPropertyValue('--ui-panel-tl-resolved')).toBe('var(--radius)');
    expect(root).toHaveAttribute('data-surface-invisible', 'false');
    expect(root.style.getPropertyValue('--liquid-grain-image')).toBe('none');
    applySettings(root, RULES, { ...DEFAULTS, 'liquid.noise': 0.1, 'liquid.opacity': 0.5 });
    expect(decodeURIComponent(root.style.getPropertyValue('--liquid-grain-image'))).toContain('slope="0.05"');
    applySettings(root, RULES, { ...DEFAULTS, 'liquid.noise': 0.1, 'liquid.opacity': 0 });
    expect(root.style.getPropertyValue('--liquid-grain-image')).toBe('none');
  });

  it('gives each glass preset valid deterministic optical values without altering comfort or corners', () => {
    for (const { values } of MATERIAL_PRESETS) {
      expect(normalize(RULES, values)).toMatchObject(values);
      expect(Object.keys(values).every((key) => key.startsWith('liquid.'))).toBe(true);
      expect(Object.keys(values).sort()).toEqual(Object.keys(MATERIAL_PRESETS[0].values).sort());
    }
  });
});
