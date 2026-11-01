import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { STYLE_DEFAULTS } from '../links/style';
import NetworkShare from './NetworkShare';
import { rasterize } from '../links/export';

vi.mock('../links/export', async (original) => ({ ...(await original()), rasterize: vi.fn() }));
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
const props = {
  code: '11',
  links: [[1, 1]],
  svg: '<svg/>',
  style: STYLE_DEFAULTS,
  url: 'https://example.test/network/?code=11',
  text: 'Network',
};

it('invokes the share sheet within the click with a prepared image (Safari activation)', async () => {
  const blob = new Blob(['png'], { type: 'image/png' });
  rasterize.mockResolvedValue(blob);
  let active = false;
  const share = vi.fn(() => (active ? Promise.resolve() : Promise.reject(new Error('activation lost'))));
  vi.stubGlobal('navigator', { share, canShare: () => true });
  render(<NetworkShare {...props} />);
  await act(async () => vi.advanceTimersByTimeAsync(250));
  active = true;
  fireEvent.click(screen.getByRole('button', { name: 'Share…' }));
  expect(share).toHaveBeenCalledTimes(1);
  expect(share.mock.calls[0][0].files[0].type).toBe('image/png');
  active = false;
  await act(async () => {});
});

it('keeps link sharing available synchronously while a new image is being prepared', async () => {
  let finish;
  rasterize.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const share = vi.fn(() => Promise.resolve());
  vi.stubGlobal('navigator', { share, canShare: () => true });
  const view = render(<NetworkShare {...props} />);
  await act(async () => vi.advanceTimersByTimeAsync(250));
  fireEvent.click(screen.getByRole('button', { name: 'Share…' }));
  expect(share).toHaveBeenCalledWith({ title: props.text, text: props.text, url: props.url });
  view.unmount();
  await act(async () => finish(new Blob(['png'], { type: 'image/png' })));
});

it('disables image copying with a useful download alternative when the API is absent', () => {
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('ClipboardItem', undefined);
  render(<NetworkShare {...props} />);
  expect(screen.getByRole('button', { name: 'Copy the image' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Copy the image' }).title).toContain('PNG');
  expect(screen.getByRole('button', { name: 'PNG' })).toBeEnabled();
});

it('prepares only the latest drawing after a burst of edits', async () => {
  rasterize.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  vi.stubGlobal('navigator', { share: vi.fn(), canShare: () => true });
  const view = render(<NetworkShare {...props} />);
  for (let i = 0; i < 10; i++) {
    view.rerender(<NetworkShare {...props} svg={`<svg id="${i}"/>`} />);
    await act(async () => vi.advanceTimersByTimeAsync(20));
  }
  expect(rasterize).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTimeAsync(250));
  expect(rasterize).toHaveBeenCalledTimes(1);
  expect(rasterize.mock.calls[0][0]).toBe('<svg id="9"/>');
});
