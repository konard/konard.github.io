import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import NetworkPage from './NetworkPage';
import SettingsPage from './SettingsPage';

afterEach(() => window.history.replaceState(null, '', '/'));
it.each([
  ['global', 'Line width'],
  ['per-link', 'Link 1: turn of the source, °'],
])('focuses the %s slider on pointer interaction before keyboard editing', (_, name) => {
  window.history.replaceState(null, '', '/network/?code=2222&lang=en');
  render(<NetworkPage />);
  const slider = screen.getByRole('slider', { name });
  fireEvent.pointerDown(slider);
  expect(slider).toHaveFocus();
  const before = Number(slider.value);
  fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
  expect(Number(slider.value)).toBeCloseTo(before + Number(slider.step), 8);
  fireEvent.pointerUp(slider);
});
it('focuses site settings sliders on pointer interaction as well', () => {
  window.history.replaceState(null, '', '/settings/?lang=en');
  render(<SettingsPage />);
  const slider = screen.getAllByRole('slider')[0];
  fireEvent.pointerDown(slider);
  expect(slider).toHaveFocus();
});
