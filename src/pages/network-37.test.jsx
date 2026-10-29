import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import NetworkPage from './NetworkPage';
import SettingsPage from './SettingsPage';

afterEach(() => {
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
});
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

it('preserves colour edits made while a manual Apply worker is running', async () => {
  let worker;
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        worker = this;
      }
      terminate = vi.fn();
      postMessage(payload) {
        this.payload = payload;
      }
    },
  );
  window.history.replaceState(null, '', '/network/?code=2222&lang=en');
  render(<NetworkPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Apply turns and gaps to links' }));
  expect(document.querySelector('.network__preview')).toHaveAttribute('aria-busy', 'true');
  const colours = screen.getByLabelText('Colours of the links');
  fireEvent.change(colours, { target: { value: 'pastel' } });
  expect(colours).toHaveValue('pastel');
  const [, shape] = worker.payload;
  await act(async () => worker.onmessage({ data: { result: { turns: shape.turns, linkGaps: shape.linkGaps } } }));
  expect(colours).toHaveValue('pastel');
  expect(new URL(screen.getByLabelText('Link to this picture').value).searchParams.get('palette')).toBe('pastel');
  expect(document.querySelector('.network__preview')).toHaveAttribute('aria-busy', 'false');
});
