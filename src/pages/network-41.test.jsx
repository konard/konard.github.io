import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import NetworkPage, { readNetwork, networkQuery } from './NetworkPage';
import { networkSvg } from '../links/render';

afterEach(() => window.history.replaceState(null, '', '/'));
const open = (query = 'code=0222') => {
  window.history.replaceState(null, '', `/network/?${query}&lang=en`);
  render(<NetworkPage />);
};
const target = () => screen.getByRole('slider', { name: 'Link 1: turn of the target, °' });
const picture = () => document.querySelector('.network__preview').innerHTML;
it('shows, edits and resets neutral zero turns without changing gaps', () => {
  open('code=0222&gaps=0.1+0.2+3+4');
  const original = picture();
  expect(target()).toHaveValue('0');
  const reset = screen.getByRole('button', { name: 'Back to the default: Link 1: turn of the target, °' });
  expect(reset).toBeDisabled();
  fireEvent.keyDown(target(), { key: 'ArrowRight' });
  expect(target()).toHaveValue('1');
  const value = screen.getByRole('spinbutton', { name: 'Link 1: turn of the target, ° (value)' });
  fireEvent.change(value, { target: { value: '' } });
  fireEvent.blur(value);
  expect(target()).toHaveValue('1');
  fireEvent.click(reset);
  expect(target()).toHaveValue('0');
  expect(picture()).toBe(original);
  const shared = new URL(screen.getByLabelText('Link to this picture').value);
  expect(shared.searchParams.get('gaps')).toBe('0.1 0.2 3 4');
  expect(shared.searchParams.has('solve')).toBe(false);
});

it('preserves neutral explicit zero turns through the URL and clear', () => {
  open('code=0222&turns=0+0');
  expect(target()).toHaveValue('0');
  const { links, style } = readNetwork(window.location.search);
  expect(readNetwork(networkQuery(links, style)).style).toEqual(style);
  expect(networkSvg(links, style)).toBe(networkSvg(links));
  fireEvent.click(screen.getByRole('button', { name: 'Clear all turns' }));
  expect(target()).toHaveValue('0');
});

it('keeps turns neutral after reference edits and removal', () => {
  open('code=000022');
  fireEvent.change(screen.getByLabelText('Link 1: target'), { target: { value: '2' } });
  expect(target()).toHaveValue('0');
  fireEvent.click(screen.getByRole('button', { name: 'Remove: Link 2' }));
  expect(target()).toHaveValue('0');
  expect(new URLSearchParams(window.location.search).has('turns')).toBe(false);
});
