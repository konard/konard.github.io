import { chooseSelect } from '../test/select';
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
  // macOS WebKit can clear the explicit pointer focus during its native
  // mouse action. A completed click must restore it before the next key.
  slider.blur();
  fireEvent.mouseDown(slider);
  fireEvent.pointerUp(slider);
  fireEvent.mouseUp(slider);
  fireEvent.click(slider);
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
  slider.blur();
  fireEvent.click(slider);
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
  chooseSelect(colours, 'pastel');
  expect(colours).toHaveAttribute('data-value', 'pastel');
  const [, shape] = worker.payload;
  await act(async () =>
    worker.onmessage({
      data: {
        result: {
          turns: shape.turns,
          linkGaps: shape.linkGaps,
          layout: { order: '2 1', spread: 0.55, palette: 'site' },
        },
      },
    }),
  );
  expect(colours).toHaveAttribute('data-value', 'pastel');
  expect(new URL(screen.getByLabelText('Link to this picture').value).searchParams.get('palette')).toBe('pastel');
  expect(screen.getByLabelText('Circular order of links')).toHaveValue('');
  expect(screen.getByRole('slider', { name: 'Distance between links' })).toHaveValue('1');
  expect(document.querySelector('.network__preview')).toHaveAttribute('aria-busy', 'false');
});

it('keeps applied positions during color edits and refits after deliberate geometry edits', () => {
  window.history.replaceState(null, '', '/network/?code=2222&lang=en&frame=40+50+50');
  render(<NetworkPage />);
  const params = () => new URL(screen.getByLabelText('Link to this picture').value).searchParams;
  chooseSelect(screen.getByLabelText('Colours of the links'), 'pastel');
  expect(params().get('frame')).toBe('40 50 50');
  fireEvent.change(screen.getByRole('slider', { name: 'Distance between links' }), { target: { value: '1.1' } });
  expect(params().has('frame')).toBe(false);
});
