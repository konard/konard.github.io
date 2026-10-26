import { act, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import NetworkGallery from '../components/NetworkGallery';
import { NetworkExample } from '../components/MetaTheory';
import { setTheme } from '../i18n/prefs';

afterEach(() => act(() => setTheme('dark', { save: false })));

it('updates gallery navigation and theory examples when their displayed theme changes', () => {
  act(() => setTheme('dark', { save: false }));
  render(
    <>
      <NetworkGallery initial={1} />
      <NetworkExample example={{ code: '11 22 12' }} />
    </>,
  );
  const card = () => within(screen.getByRole('list', { name: 'Networks of 1 link' })).getAllByRole('link')[0];
  expect(card()).toHaveAttribute('href', '/network/?code=00');
  act(() => setTheme('light', { save: false }));
  expect(card()).toHaveAttribute('href', '/network/?code=00&palette=print');
  expect(screen.getByRole('link', { name: 'Edit and share this network' })).toHaveAttribute(
    'href',
    '/network/?code=112212&palette=print',
  );
  act(() => setTheme('dark', { save: false }));
  expect(card()).toHaveAttribute('href', '/network/?code=00');
});
