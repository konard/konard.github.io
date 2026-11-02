// Issue #49: "In EXPERIENCE ... cards we have left lines, that are overlapping
// with borders, it should be configurable, and by default it should be either
// more transparent or have at least 1 pixel distance from borders" and "we
// have gaps in the middle of the text, text should be aligned to the top, and
// tags either should be at the bottom or we should make all cards have size by
// content ... may be option to keep the gap". These tests failed before the
// change: the stripe lay at the left edge of the card, fully opaque, the
// summary took the free height of the card, and there were no settings.
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chooseSelect } from './test/select';
import SettingsPage from './pages/SettingsPage';
import { applySettings } from './settings/apply';
import { CSS_RULES, DEFAULTS, SECTIONS } from './settings/schema';

const CSS = readFileSync(join(__dirname, 'App.sections.css'), 'utf8');

/** The declarations of every rule whose selector is exactly `selector`. */
const rules = (selector) =>
  [...CSS.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, sel]) => sel.replace(/\/\*[\s\S]*?\*\//g, '').trim() === selector)
    .map(([, , body]) => body);

describe('the stripe of the experience cards (issue #49)', () => {
  it('is configurable, and by default inset from the border and a bit transparent', () => {
    const cards = SECTIONS.find((section) => section.id === 'cards');
    expect(cards.fields.map((f) => f.key)).toEqual([
      'cards.layout',
      'cards.stripe',
      'cards.stripeWidth',
      'cards.stripeOpacity',
      'cards.stripeInset',
      'cards.stripeEnds',
    ]);
    expect(cards.fields.find((f) => f.key === 'cards.stripe').options.map((o) => o.value)).toEqual([
      'inset',
      'edge',
      'none',
    ]);
    expect(DEFAULTS['cards.stripe']).toBe('inset');
    expect(DEFAULTS['cards.stripeInset']).toBeGreaterThanOrEqual(1);
    expect(DEFAULTS['cards.stripeOpacity']).toBeLessThan(1);
    expect(DEFAULTS['cards.stripeOpacity']).toBeGreaterThan(0);
  });

  it('runs inside the border of the frame and past its corners', () => {
    const [stripe] = rules('.position::before');
    expect(stripe).toContain('left: calc(var(--fxp-ew-left, 0px) + var(--cards-stripe-inset, 2px));');
    expect(stripe).toContain('top: calc(var(--fxp-tl-ry, 0px) + var(--cards-stripe-ends, 6px));');
    expect(stripe).toContain('bottom: calc(var(--fxp-bl-ry, 0px) + var(--cards-stripe-ends, 6px));');
    expect(stripe).toContain('opacity: var(--cards-stripe-opacity, 0.7);');
    expect(stripe).not.toContain('inset: 0 auto 0 0');
    // The old stripe stays as a choice, and the stripe can be switched off.
    expect(rules(":root[data-cards-stripe='edge'] .position::before")[0]).toContain('inset: 0 auto 0 0');
    expect(rules(":root[data-cards-stripe='none'] .position::before")[0]).toContain('display: none');
  });

  it('puts its settings on the page', () => {
    const root = document.createElement('html');
    applySettings(root, CSS_RULES, { ...DEFAULTS, 'cards.stripeOpacity': 0.5, 'cards.stripe': 'edge' });
    expect(root.style.getPropertyValue('--cards-stripe-opacity')).toBe('0.5');
    expect(root.style.getPropertyValue('--cards-stripe-inset')).toBe('2px');
    expect(root.style.getPropertyValue('--cards-stripe-width')).toBe('3px');
    expect(root.getAttribute('data-cards-stripe')).toBe('edge');
    expect(root.getAttribute('data-cards-layout')).toBe('top');
  });
});

describe('the text of the experience cards (issue #49)', () => {
  it('starts at the top and ends with the tags, without a gap in the middle', () => {
    expect(DEFAULTS['cards.layout']).toBe('top');
    const [summary] = rules('.position__summary');
    expect(summary).not.toMatch(/flex:\s*1/);
    expect(rules('.position > .tags')[0]).toContain('margin-top: auto');
  });

  it('can size each card by its text, or keep the gap', () => {
    expect(rules(":root[data-cards-layout='content'] .positions")[0]).toContain('align-items: start');
    expect(rules(":root[data-cards-layout='gap'] .position__summary")[0]).toContain('flex: 1');
  });

  it('is chosen in the settings', () => {
    render(<SettingsPage />);
    expect(document.getElementById('cards')).toBeInTheDocument();
    chooseSelect(screen.getByRole('combobox', { name: 'Text in the cards' }), 'content');
    expect(document.documentElement.dataset.cardsLayout).toBe('content');
    chooseSelect(screen.getByRole('combobox', { name: 'Stripe on the left' }), 'none');
    expect(document.documentElement.dataset.cardsStripe).toBe('none');
    // Without a stripe there is nothing to set up for it.
    expect(screen.queryByLabelText('Stripe width')).toBeNull();
  });
});
