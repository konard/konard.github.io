import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import NetworkPage from './NetworkPage';

afterEach(() => window.history.replaceState(null, '', '/'));

it('keeps zero-cut links continuous on the reported URL, after Apply and after sharing', () => {
  window.history.replaceState(null, '', '/network/?code=003002&solve=true&lang=en');
  const view = render(<NetworkPage />);
  const picture = () => document.querySelector('.network__preview').innerHTML;
  const lines = () => [...document.querySelectorAll('.network__preview g[stroke] > path:first-child')];
  expect(lines()).toHaveLength(3);
  lines().forEach((line) => expect(line.getAttribute('d').match(/M/g)).toHaveLength(1));
  expect(screen.getByRole('slider', { name: 'Cut before the middle', exact: true })).toHaveValue('0');
  expect(screen.getByRole('slider', { name: 'Cut after the middle', exact: true })).toHaveValue('0');
  expect(screen.getByRole('slider', { name: 'Largest middle cut change', exact: true })).toHaveValue('0');
  const solved = picture();
  fireEvent.click(screen.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }));
  expect(picture()).toBe(solved);
  const shared = screen.getByLabelText('Link to this picture').value;
  view.unmount();
  window.history.replaceState(null, '', shared);
  render(<NetworkPage />);
  expect(picture()).toBe(solved);
});
