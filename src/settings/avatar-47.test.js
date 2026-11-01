// Issue #47: "The rotating square under the avatar picture must be configurable
// (speed, size and or even static rotation angle so on)."
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applySettings, normalize } from './apply';
import { CSS_RULES, RULES } from './schema';

const css = readFileSync(join(__dirname, '..', 'App.css'), 'utf8');
const ring = css.slice(css.indexOf('.hero__ring {'), css.indexOf('}', css.indexOf('.hero__ring {')));

describe('the ring under the photo (issue #47)', () => {
  it('has settings for speed, size, angle, turning, shape and glow', () => {
    for (const key of [
      'avatar.ring',
      'avatar.ringShape',
      'avatar.photoShape',
      'avatar.spin',
      'avatar.period',
      'avatar.angle',
      'avatar.ringWidth',
      'avatar.glow',
    ])
      expect(RULES, key).toHaveProperty([key]);
    expect(RULES['avatar.spin'].o).toEqual(['clockwise', 'counter', 'still']);
  });

  it('keeps the look of the site before the settings by default', () => {
    const root = document.createElement('html');
    applySettings(root, CSS_RULES, normalize(RULES, {}));
    expect(root.style.getPropertyValue('--avatar-period')).toBe('8s');
    expect(root.style.getPropertyValue('--avatar-angle')).toBe('0deg');
    expect(root.style.getPropertyValue('--avatar-ring-width')).toBe('10px');
    expect(root.style.getPropertyValue('--avatar-glow')).toBe('24px');
    expect(root.getAttribute('data-avatar-ring-shape')).toBe('skin');
    expect(root.getAttribute('data-avatar-spin')).toBe('clockwise');
  });

  it('puts the values on the page as the stylesheet reads them', () => {
    const root = document.createElement('html');
    const settings = normalize(RULES, {
      'avatar.period': 2.5,
      'avatar.angle': 45,
      'avatar.ringWidth': 999,
      'avatar.spin': 'still',
      'avatar.ringShape': 'circle',
    });
    applySettings(root, CSS_RULES, settings);
    expect(root.style.getPropertyValue('--avatar-period')).toBe('2.5s');
    expect(root.style.getPropertyValue('--avatar-angle')).toBe('45deg');
    expect(root.style.getPropertyValue('--avatar-ring-width')).toBe('40px');
    expect(root.getAttribute('data-avatar-spin')).toBe('still');
    expect(root.getAttribute('data-avatar-ring-shape')).toBe('circle');
  });

  it('turns, sizes and angles the ring by the settings', () => {
    expect(ring).toContain('animation: spin var(--avatar-period, 8s)');
    expect(ring).toContain('rotate: var(--avatar-angle, 0deg)');
    expect(ring).toContain('var(--avatar-ring-width, 10px)');
    expect(ring).toContain('var(--avatar-glow, 24px)');
    expect(css).toMatch(/\[data-avatar-spin='still'\] \.hero__ring \{\s*animation: none/);
    expect(css).toMatch(/\[data-avatar-spin='counter'\] \.hero__ring \{\s*animation-direction: reverse/);
    expect(css).toMatch(/\[data-avatar-ring='false'\] \.hero__ring \{\s*display: none/);
    // Shapes beat the squared corners of the futuristic skin: (0,4,0) against (0,3,0).
    expect(css).toContain(":root[data-avatar-ring-shape='circle'] .app .hero__ring");
  });
});
