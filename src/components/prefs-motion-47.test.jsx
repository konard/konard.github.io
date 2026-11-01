import { act, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { getSettings, resetSettings } from '../settings/store';
import PrefSwitches from './PrefSwitches';

// Issue #47: "add an animations on/off button next to the sound button" and
// "use SVG instead of emojis everywhere".
describe('animations button of the top bar (issue #47)', () => {
  afterEach(() => act(() => resetSettings(['motion.mode'])));

  it('sits next to the sound button and turns every animation off and on again', () => {
    render(<PrefSwitches />);
    const sound = screen.getByRole('button', { name: 'Sounds of the interface' });
    const motion = screen.getByRole('button', { name: 'Animations' });
    expect(sound.nextElementSibling).toBe(motion);
    // jsdom does not ask for reduced motion, so the automatic mode moves.
    expect(motion.getAttribute('aria-pressed')).toBe('true');
    expect(motion.title).toBe('Animations: on');

    fireEvent.click(motion);
    expect(getSettings()['motion.mode']).toBe('off');
    expect(document.documentElement.dataset.motionMode).toBe('off');
    expect(motion.getAttribute('aria-pressed')).toBe('false');
    expect(motion.title).toBe('Animations: off');

    fireEvent.click(motion);
    expect(getSettings()['motion.mode']).toBe('on');
    expect(motion.getAttribute('aria-pressed')).toBe('true');
  });

  it('is on only when the system does not ask for less motion, until it is pressed', () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: query.includes('reduce'),
      addEventListener() {},
      removeEventListener() {},
    });
    try {
      render(<PrefSwitches />);
      const motion = screen.getByRole('button', { name: 'Animations' });
      expect(motion.getAttribute('aria-pressed')).toBe('false');
      fireEvent.click(motion);
      expect(getSettings()['motion.mode']).toBe('on');
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it('stops the interface animations as well as the background', () => {
    const css = readFileSync('src/index.css', 'utf8').replace(/\s+/g, ' ');
    expect(css).toContain(":root[data-motion-mode='off'] *, :root[data-motion-mode='off'] *::before");
    expect(css).toMatch(
      /:root\[data-motion-mode='off'\] \*::after \{ animation: none !important; transition: none !important; \}/,
    );
    // Turned on by hand, the interface moves even when the system asks for less motion.
    expect(css).toContain(":root:not([data-motion-mode='on']) *");
  });

  it('draws the sound, animations and theme icons as SVG, not as text symbols', () => {
    const { container } = render(<PrefSwitches />);
    for (const name of ['Sounds of the interface', 'Animations']) {
      const button = screen.getByRole('button', { name });
      expect(button.querySelector('svg.icon[aria-hidden="true"]')).not.toBeNull();
      expect(button.textContent).toBe('');
    }
    const theme = container.querySelector('.prefs__theme');
    expect(theme.querySelector('svg.icon')).not.toBeNull();
    expect(theme.textContent).toBe('');
  });
});
