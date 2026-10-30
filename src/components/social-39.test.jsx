import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Story } from '../pages/BlogPage';
import SocialEmbed from './SocialEmbed';
import { loadWidget } from './socialWidgets';

const post = {
  id: 'x:123',
  network: 'x',
  lang: 'en',
  url: 'https://x.com/konard/status/123',
  publishedAt: '2026-10-30T00:00:00Z',
  embed: { type: 'x', id: '123' },
  html: '<p>Archived readable post</p>',
  media: [],
};

it('uses the official X widget factory to size the iframe and offers the archive', async () => {
  window.twttr = {
    widgets: {
      createTweet: vi.fn(async (_id, host) => {
        const frame = document.createElement('iframe');
        frame.title = 'X post';
        frame.height = '210';
        host.append(frame);
        return frame;
      }),
    },
  };
  const { container, unmount } = render(<Story story={{ posts: [post] }} lang="en" />);
  await waitFor(() => expect(window.twttr.widgets.createTweet).toHaveBeenCalled());
  expect(window.twttr.widgets.createTweet).toHaveBeenCalledWith(
    '123',
    expect.any(HTMLElement),
    expect.objectContaining({ width: 550, dnt: true }),
  );
  expect(container.querySelector('iframe')).toHaveAttribute('height', '210');
  fireEvent.click(screen.getByRole('button', { name: 'Show archived copy' }));
  expect(container.querySelector('iframe')).toBeNull();
  expect(screen.getByText('Archived readable post')).toBeVisible();
  unmount();
  delete window.twttr;
});

it('isolates late widget results from the current theme generation', async () => {
  let finish;
  const createTweet = vi
    .fn()
    .mockImplementationOnce(
      (_id, host) =>
        new Promise((resolve) => {
          finish = () => {
            host.append(document.createElement('iframe'));
            resolve(host.firstChild);
          };
        }),
    )
    .mockImplementation(async (_id, host) => {
      const frame = document.createElement('iframe');
      host.append(frame);
      return frame;
    });
  window.twttr = { widgets: { createTweet } };
  const onError = vi.fn();
  const { container, rerender, unmount } = render(<SocialEmbed embed={post.embed} theme="light" onError={onError} />);
  await waitFor(() => expect(createTweet).toHaveBeenCalledOnce());
  rerender(<SocialEmbed embed={post.embed} theme="dark" onError={onError} />);
  await waitFor(() => expect(container.querySelector('[data-loaded]')).not.toBeNull());
  await act(async () => finish());
  expect(container.querySelectorAll('iframe')).toHaveLength(1);
  expect(createTweet.mock.calls[1][2].theme).toBe('dark');
  expect(onError).not.toHaveBeenCalled();
  unmount();
  delete window.twttr;
});

it('configures the official Telegram and VK responsive widgets', async () => {
  const onError = vi.fn();
  const { container, rerender, unmount } = render(
    <SocialEmbed embed={{ type: 'telegram', id: 'public_channel/42' }} theme="dark" onError={onError} />,
  );
  const script = container.querySelector('script');
  expect(script.src).toBe('https://telegram.org/js/telegram-widget.js?22');
  expect(script).toHaveAttribute('data-telegram-post', 'public_channel/42');
  expect(script).toHaveAttribute('data-width', '100%');
  expect(script).toHaveAttribute('data-dark', '1');
  window.VK = {
    Widgets: {
      Post: vi.fn((id) => {
        const frame = document.createElement('iframe');
        frame.height = '220';
        document.getElementById(id).append(frame);
      }),
    },
  };
  rerender(<SocialEmbed embed={{ type: 'vk', id: '-123_45', hash: 'export_hash' }} theme="dark" onError={onError} />);
  await waitFor(() => expect(container.querySelector('[data-loaded]')).not.toBeNull());
  expect(window.VK.Widgets.Post).toHaveBeenCalledWith(expect.any(String), -123, 45, 'export_hash', { width: '100%' });
  expect(container.querySelector('iframe')).toHaveAttribute('title', 'vk post');
  unmount();
  delete window.VK;
});

it('shares script loads and permits retry after a stalled request', async () => {
  vi.useFakeTimers();
  const src = 'https://example.test/widget.js';
  try {
    const first = loadWidget(src);
    expect(loadWidget(src)).toBe(first);
    const failed = expect(first).rejects.toThrow('Widget script unavailable');
    await vi.advanceTimersByTimeAsync(10000);
    await failed;
    expect(document.querySelector(`script[src="${src}"]`)).toBeNull();
    const retry = loadWidget(src);
    fireEvent.load(document.querySelector(`script[src="${src}"]`));
    await retry;
    expect(loadWidget(src)).toBe(retry);
  } finally {
    vi.useRealTimers();
    document.querySelector(`script[src="${src}"]`)?.remove();
  }
});

it('shows the readable archive when a provider blocks or never finishes loading', async () => {
  vi.useFakeTimers();
  try {
    window.twttr = { widgets: { createTweet: vi.fn(() => new Promise(() => {})) } };
    render(<Story story={{ posts: [post] }} lang="en" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(13000);
    });
    expect(screen.getByText('Archived readable post')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Show embed' })).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
    delete window.twttr;
  }
});
