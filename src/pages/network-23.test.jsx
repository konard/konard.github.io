import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import NetworkPage from './NetworkPage';
import NetworkGallery from '../components/NetworkGallery';

afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});
it('offers one aligned navigation target per gallery card', () => {
  render(<NetworkGallery initial={1} />);
  const list = screen.getByRole('list', { name: 'Networks of 1 link' });
  expect(within(list).getAllByRole('link')).toHaveLength(4);
  expect(list.querySelector('.symbols__share')).toBeNull();
});
it('edits independent gaps, resets inheritance and preserves gaps when removing a link', () => {
  vi.useFakeTimers();
  window.history.replaceState(null, '', '/network/?code=1122');
  render(<NetworkPage />);
  const gap = (i, label) => screen.getByLabelText(`Link ${i}: ${label}`);
  const first = gap(1, 'Gap at the source reference (value)');
  expect(first).toHaveValue(null);
  expect(first).toHaveAttribute('placeholder', '0.08');
  fireEvent.change(first, { target: { value: '0.25' } });
  fireEvent.change(gap(2, 'Cut after the middle'), { target: { value: '4' } });
  act(() => vi.advanceTimersByTime(450));
  expect(new URLSearchParams(window.location.search).get('gaps')).toBe('0.25,~ ~ ~ 4');
  fireEvent.click(screen.getByRole('button', { name: 'Remove: Link 1' }));
  expect(gap(1, 'Cut after the middle')).toHaveValue(4);
  fireEvent.change(gap(1, 'Cut after the middle'), { target: { value: '' } });
  act(() => vi.advanceTimersByTime(450));
  expect(new URLSearchParams(window.location.search).has('gaps')).toBe(false);
});
