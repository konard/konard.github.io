import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import NetworkPage from './NetworkPage';

beforeEach(() => {
  window.history.replaceState(null, '', '/network/?code=1221&angles=fixed');
  vi.useFakeTimers();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const tick = (ms = 450) => act(() => vi.advanceTimersByTime(ms));

it('keeps the preview/share link live but writes history once after a drag and repeated releases', () => {
  render(<NetworkPage />);
  tick();
  const replace = vi.spyOn(window.history, 'replaceState');
  const slider = screen.getByLabelText('Entering angle');
  const before = document.querySelector('.network__preview').innerHTML;
  fireEvent.pointerDown(slider);
  for (let value = 1; value <= 120; value++) {
    fireEvent.change(slider, { target: { value: value % 80 } });
    tick(5);
  }
  expect(document.querySelector('.network__preview').innerHTML).not.toBe(before);
  expect(screen.getByLabelText('Link to this picture').value).toContain('targetAngle=40');
  tick(1000);
  expect(replace).not.toHaveBeenCalled();
  fireEvent.pointerUp(document);
  tick(200);
  fireEvent.pointerDown(slider);
  fireEvent.change(slider, { target: { value: 41 } });
  fireEvent.pointerUp(document);
  tick();
  expect(replace).toHaveBeenCalledTimes(1);
  expect(window.location.search).toContain('targetAngle=41');
});

it('defers held keyboard input until keyup and recovers from a history SecurityError', () => {
  render(<NetworkPage />);
  tick();
  const replace = vi.spyOn(window.history, 'replaceState');
  replace.mockImplementationOnce(() => {
    throw new DOMException('rate limit', 'SecurityError');
  });
  const slider = screen.getByLabelText('Entering angle');
  fireEvent.keyDown(slider, { key: 'ArrowRight' });
  fireEvent.change(slider, { target: { value: 48 } });
  tick(1000);
  expect(replace).not.toHaveBeenCalled();
  fireEvent.keyUp(slider, { key: 'ArrowRight' });
  tick();
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  tick(1100);
  expect(window.location.search).toContain('targetAngle=48');
});
