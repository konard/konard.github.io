import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import NetworkPage from './NetworkPage';

afterEach(() => window.history.replaceState(null, '', '/'));
const open = () => {
  window.history.replaceState(null, '', '/network/?code=1111&lang=en&turns=,-15+15&gaps=,0.18+0.18');
  render(<NetworkPage />);
};
it('pairs one-degree turn sliders below the separator and supports horizontal keyboard edits and resets', () => {
  open();
  const source = screen.getByRole('slider', { name: 'Link 2: turn of the source, °' });
  const target = screen.getByRole('slider', { name: 'Link 2: turn of the target, °' });
  expect(source).toHaveAttribute('min', '-180');
  expect(source).toHaveAttribute('max', '180');
  expect(source).toHaveAttribute('step', '1');
  expect(source.closest('.link-card__geometry')).toBe(target.closest('.link-card__geometry'));
  fireEvent.keyDown(source, { key: 'ArrowRight' });
  expect(source).toHaveValue('-14');
  expect(target).toHaveValue('15');
  fireEvent.click(screen.getByRole('button', { name: 'Back to the default: Link 2: turn of the source, °' }));
  expect(source).toHaveValue('0');
  expect(target).toHaveValue('15');
});
it('shows inherited reference gaps as sliders and resets an explicit override to inheritance', () => {
  open();
  const gap = screen.getByRole('slider', { name: 'Link 1: Gap at the target reference' });
  expect(gap).toHaveValue('0.08');
  expect(gap).toHaveAttribute('max', '1');
  fireEvent.keyDown(gap, { key: 'ArrowRight' });
  expect(gap).toHaveValue('0.09');
  fireEvent.click(screen.getByRole('button', { name: 'Back to the default: Link 1: Gap at the target reference' }));
  expect(gap).toHaveValue('0.08');
  const params = new URL(screen.getByLabelText('Link to this picture').value).searchParams;
  expect(params.get('gaps').split(',')[0]).toBe('');
  const global = screen.getByLabelText('Gap at the target reference', { selector: 'input[type="range"]' });
  fireEvent.change(global, { target: { value: '0.12' } });
  expect(gap).toHaveValue('0.12');
});
