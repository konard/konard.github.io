import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import NetworkPage from './NetworkPage';

afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});
const open = () => {
  window.history.replaceState(
    null,
    '',
    '/network/?code=1111&lang=en&turns=0+0%2C-15+15&gaps=~+~+~+~%2C0.18+0.18+~+~#links',
  );
  render(<NetworkPage />);
};
it('upgrades an old URL in browser history while preserving its drawing, language and anchor', () => {
  vi.useFakeTimers();
  open();
  const drawing = document.querySelector('.network__preview').innerHTML;
  const replace = vi.spyOn(window.history, 'replaceState');
  act(() => vi.advanceTimersByTime(450));
  const params = new URLSearchParams(window.location.search);
  expect(params.get('turns')).toBe(',-15 15');
  expect(params.get('gaps')).toBe(',0.18 0.18');
  expect(params.get('lang')).toBe('en');
  expect(window.location.hash).toBe('#links');
  expect(replace).toHaveBeenCalledTimes(1);
  expect(document.querySelector('.network__preview').innerHTML).toBe(drawing);
  replace.mockRestore();
});
it('steps inherited gaps from the displayed global value, with decimal precision', () => {
  open();
  const input = screen.getByLabelText('Link 1: Gap at the target reference');
  expect(input).toHaveValue(null);
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(input).toHaveValue(0.09);
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  expect(input).toHaveValue(0.08);
  fireEvent.keyDown(input, { key: 'PageDown' });
  expect(input).toHaveValue(0);
});
it('starts native spinner clicks from inheritance without making a plain focus an explicit override', () => {
  open();
  const input = screen.getByLabelText('Link 1: Gap at the target reference');
  const shared = screen.getByLabelText('Link to this picture');
  const inherited = shared.value;
  fireEvent.pointerDown(input);
  expect(shared.value).toBe(inherited);
  input.stepDown();
  fireEvent.input(input);
  expect(input).toHaveValue(0.07);
  fireEvent.change(input, { target: { value: '' } });
  fireEvent.pointerDown(input);
  fireEvent.blur(input);
  expect(input).toHaveValue(null);
  fireEvent.pointerDown(input);
  input.stepUp();
  fireEvent.input(input);
  expect(input).toHaveValue(0.09);
});
it('supports page steps on every range while preserving modified editing shortcuts', () => {
  open();
  const input = screen.getByLabelText('Gap at the target reference', { selector: 'input[type="range"]' });
  fireEvent.keyDown(input, { key: 'PageUp' });
  expect(input).toHaveValue('0.18');
  fireEvent.keyDown(input, { key: 'Home' });
  expect(input).toHaveValue('0');
  fireEvent.keyDown(input, { key: 'End' });
  expect(input).toHaveValue('1');
});
it('allows clearing a turn while typing a replacement and retains text-navigation keys', () => {
  open();
  const input = screen.getByLabelText('Link 2: turn of the source, °');
  fireEvent.change(input, { target: { value: '' } });
  expect(input).toHaveValue(null);
  fireEvent.change(input, { target: { value: '-25' } });
  expect(input).toHaveValue(-25);
  fireEvent.keyDown(input, { key: 'Home' });
  expect(input).toHaveValue(-25);
  fireEvent.keyDown(input, { key: 'a', ctrlKey: true });
  expect(input).toHaveValue(-25);
});
