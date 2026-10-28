import { fireEvent, render, screen } from '@testing-library/react';
import { embedUrl, Story } from '../pages/BlogPage';

const post = {
  id: 'x-42',
  network: 'x',
  lang: 'en',
  url: 'https://x.com/konard/status/42',
  publishedAt: '2026-10-28T00:00:00Z',
  embed: { type: 'x', id: '42' },
  html: '<p>Archived evidence</p>',
  media: [],
};

it('opens a readable archive if the provider fails, with an explicit retry', () => {
  const { container } = render(<Story story={{ posts: [post] }} lang="en" />);
  fireEvent.error(container.querySelector('iframe'));
  expect(container.querySelector('iframe')).toBeNull();
  expect(screen.getByText('Archived evidence')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Show embed' }));
  expect(container.querySelector('iframe')).not.toBeNull();
});

it('supports Telegram and VK public widget identifiers, requiring VK export hashes', () => {
  expect(embedUrl({ type: 'telegram', id: 'channel/123' }, 'dark')).toBe(
    'https://t.me/channel/123?embed=1&mode=tme&dark=1',
  );
  expect(embedUrl({ type: 'vk', id: '-1_2' }, 'light')).toBeNull();
  expect(embedUrl({ type: 'vk', id: '-1_2', hash: 'public-export-hash' }, 'light')).toContain(
    'owner_id=-1&post_id=2&hash=public-export-hash',
  );
  expect(embedUrl({ type: 'x', id: '42' }, 'light')).toContain('theme=light');
  expect(embedUrl({ type: 'telegram', id: '//untrusted.test' }, 'light')).toBeNull();
  expect(embedUrl({ type: 'x', id: '42&other=1' }, 'dark')).toBeNull();
});
