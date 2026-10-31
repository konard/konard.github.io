import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

it('opens a readable archive if the provider script fails, with an explicit retry', async () => {
  const { container } = render(<Story story={{ posts: [post] }} lang="en" />);
  const script = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
  fireEvent.error(script);
  await waitFor(() => expect(screen.getByText('Archived evidence')).toBeVisible());
  expect(container.querySelector('[data-social-embed]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show embed' }));
  expect(container.querySelector('[data-social-embed]')).not.toBeNull();
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
