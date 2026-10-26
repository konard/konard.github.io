import { afterEach, expect, it, vi } from 'vitest';
import { watchPanelVisibility } from './panelVisibility';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});
it('bounds live panels, observes appended lists and cleans up removed panels', async () => {
  let enter;
  const observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(function (callback, options) {
      enter = callback;
      expect(options.rootMargin).toBe('200px 0px');
      return observer;
    }),
  );
  const root = document.createElement('main');
  root.innerHTML = '<ul class="symbols__grid"><li>card</li></ul><article class="post">post</article>';
  document.body.append(root);
  const cleanup = watchPanelVisibility(root);
  const card = root.querySelector('li');
  const post = root.querySelector('.post');
  expect(observer.observe).toHaveBeenCalledTimes(2);
  expect(root.dataset.panelVisibility).toBe('on');
  enter([
    { target: card, isIntersecting: true },
    { target: post, isIntersecting: false },
  ]);
  expect(card.dataset.inViewport).toBe('true');
  expect(post.dataset.inViewport).toBeUndefined();
  const repo = document.createElement('article');
  repo.className = 'repo';
  root.append(repo);
  await Promise.resolve();
  expect(observer.observe).toHaveBeenCalledWith(repo);
  card.remove();
  await Promise.resolve();
  expect(observer.unobserve).toHaveBeenCalledWith(card);
  enter([{ target: post, isIntersecting: true }]);
  cleanup();
  expect(observer.disconnect).toHaveBeenCalledOnce();
  expect(root.dataset.panelVisibility).toBeUndefined();
  expect(post.dataset.inViewport).toBeUndefined();
});
it('preserves the original presentation if IntersectionObserver is unavailable', () => {
  vi.stubGlobal('IntersectionObserver', undefined);
  const root = document.createElement('main');
  watchPanelVisibility(root)();
  expect(root.dataset.panelVisibility).toBeUndefined();
});
