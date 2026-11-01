import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import habr from '../data/habr.lino';
import HabrCards from './HabrCards';

// Issue #47: "use maximum possible performance for UI/UX rendering with the same
// visuals". An element with a running CSS animation is restyled on every frame,
// and the background canvases draw every frame; when the framed card itself
// floated, restyling it (outline, corners, surface and its content) took most of
// the main-thread frame on the home page. The card now floats in a plain wrapper.
const rules = (css, selector) => {
  const found = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m = re.exec(css); m; m = re.exec(css)) {
    if (m[1].split(',').some((s) => s.trim() === selector)) found.push(m[2]);
  }
  return found.join(';');
};

describe('floating Habr cards (issue #47)', () => {
  const css = readFileSync('src/Layout.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  it('floats every card in a plain wrapper list item', () => {
    const { container } = render(<HabrCards snapshot={habr} live={false} />);
    const items = container.querySelectorAll('.habr__cards > li');
    expect(items).toHaveLength(habr.articles.length);
    for (const item of items) {
      expect(item.className).toBe('habr__float');
      expect(item.children).toHaveLength(1);
      expect(item.firstElementChild.className).toBe('habr-card');
      expect(item.style.getPropertyValue('--float-delay')).toMatch(/^-?[\d.]+s$/);
      expect(item.style.getPropertyValue('--float-time')).toMatch(/^\d+s$/);
    }
  });

  it('animates the wrapper, not the framed card', () => {
    expect(rules(css, '.habr__float')).toMatch(/animation:\s*float\b[^;]*infinite/);
    expect(rules(css, '.habr__float:hover')).toMatch(/animation-play-state:\s*paused/);
    expect(rules(css, '.habr-card')).not.toMatch(/animation/);
    expect(rules(css, '.habr-card:hover')).not.toMatch(/animation|transform/);
    // The card never moves on its own, as when its float overrode the lift of a
    // hovered panel in the futuristic skin; otherwise it would move twice.
    expect(rules(css, '.habr__float > .habr-card')).toMatch(/transform:\s*none\s*!important/);
  });

  it('stops the float when the visitor asks for less motion', () => {
    expect(css).toMatch(
      /:root:not\(\[data-motion-mode='on'\]\) :is\(\.habr__float, \.psd__edges line\)\s*\{\s*animation: none;/,
    );
  });
});
