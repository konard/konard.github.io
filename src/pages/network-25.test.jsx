import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import NetworkPage from './NetworkPage';
afterEach(() => window.history.replaceState(null, '', '/'));
it('keeps every per-link input visible in one card, with no disclosure', () => {
  window.history.replaceState(null, '', '/network/?code=2222&lang=en');
  render(<NetworkPage />);
  const list = screen.getByRole('list', { name: 'Link configurations' });
  const cards = within(list).getAllByRole('listitem');
  expect(cards).toHaveLength(2);
  expect(list.querySelector('details')).toBeNull();
  for (const [i, card] of cards.entries()) {
    const fields = within(card);
    for (const label of [
      'source',
      'target',
      'colour',
      'turn of the source, °',
      'turn of the target, °',
      'Gap at the source reference',
      'Gap at the target reference',
      'Cut before the middle',
      'Cut after the middle',
    ])
      expect(fields.getByLabelText(`Link ${i + 1}: ${label}`)).toBeVisible();
  }
  fireEvent.change(within(cards[1]).getByLabelText('Link 2: Cut after the middle'), { target: { value: '3' } });
  fireEvent.click(within(cards[0]).getByRole('button', { name: 'Remove: Link 1' }));
  expect(screen.getByLabelText('Link 1: Cut after the middle')).toHaveValue(3);
});
