import { act, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Layout from '../components/Layout';
import MetaTheory from '../components/MetaTheory';
import { metaTheory } from '../data/theory';
import AssociativePage from '../pages/AssociativePage';
import { setSettings } from '../settings/store';
import { notate, toReferences } from './notation';

afterEach(() => act(() => setSettings({ 'theory.notation': 'L' })));

describe('notation of the links theory (issue #13)', () => {
  it('rewrites only the formula L → L² and L ↦ L² in free text', () => {
    expect(toReferences('one formula, L → L², for all data')).toBe('one formula, R → R², for all data');
    expect(toReferences('связь — ссылка на связи: L ↦ L².')).toBe('связь — ссылка на связи: R ↦ R².');
    expect(toReferences('URL → URL²')).toBe('URL → URL²');
    expect(toReferences('Links theory')).toBe('Links theory');
  });

  it('picks the formula of the chosen draft and leaves L texts alone', () => {
    expect(notate({ L: 'Vₙ = Lⁿ', R: 'Tₙ = Rⁿ' }, 'R')).toBe('Tₙ = Rⁿ');
    expect(notate({ L: 'Vₙ = Lⁿ', R: 'Tₙ = Rⁿ' }, 'L')).toBe('Vₙ = Lⁿ');
    expect(notate({ en: 'text', ru: 'текст' }, 'R')).toEqual({ en: 'text', ru: 'текст' });
    expect(notate('L → L²', 'L')).toBe('L → L²');
    expect(notate(null, 'R')).toBeNull();
  });

  it('every formula has both notations; 0.0.3 has no λ (L is a link there, R a reference)', () => {
    for (const f of metaTheory.formulas) {
      expect(f.formula.L).toBeTruthy();
      expect(f.formula.R).toContain('R');
      expect(f.formula.R).not.toContain('λ');
    }
  });

  it('shows L → L² by default (draft 0.0.2)', () => {
    render(<MetaTheory theory={metaTheory} />);
    expect(screen.getAllByText('L → L²').length).toBeGreaterThan(0);
    expect(screen.getByText('λ: L → L × L')).toBeInTheDocument();
    expect(screen.queryByText('R → R²')).toBeNull();
  });

  it('switches the theory to R → R² (draft 0.0.3) from the settings', () => {
    render(<MetaTheory theory={metaTheory} />);
    act(() => setSettings({ 'theory.notation': 'R' }));
    expect(screen.getAllByText('R → R²').length).toBeGreaterThan(0);
    expect(screen.getByText('Tₙ = Rⁿ')).toBeInTheDocument();
    expect(screen.getByText('L = R × Tₙ')).toBeInTheDocument();
    expect(screen.getByText('N²: R → R × R')).toBeInTheDocument();
    expect(screen.getByText('N³: R → R × R × R')).toBeInTheDocument();
    expect(screen.queryByText(/λ/)).toBeNull();
    expect(screen.queryByText('L → L²')).toBeNull();
  });

  it('switches the motto in the footer', () => {
    render(
      <Layout page="art">
        <p>content</p>
      </Layout>,
    );
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText('L ↦ L²')).toBeInTheDocument();
    act(() => setSettings({ 'theory.notation': 'R' }));
    expect(within(footer).getByText('R ↦ R²')).toBeInTheDocument();
  });

  it('switches the formula in the lead of the associative stack', () => {
    act(() => setSettings({ 'theory.notation': 'R' }));
    render(<AssociativePage />);
    const lead = document.querySelector('.page-hero__lead').textContent;
    expect(lead).toContain('(R → R²)');
    expect(lead).not.toContain('[object Object]');
  });
});
