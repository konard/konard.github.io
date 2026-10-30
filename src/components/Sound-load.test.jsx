import { act, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Sound from './Sound';
import { setSettings } from '../settings/store';

vi.mock('../sound/interactions', () => ({
  startSound: () => ({ update() {}, stop() {} }),
}));

afterEach(() => vi.restoreAllMocks());

it('handles a rejected optional sound import without an uncaught page error', async () => {
  setSettings({ 'sound.on': true });
  const error = new TypeError('Importing a module script failed.');
  const load = vi.fn().mockRejectedValue(error);
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(<Sound load={load} />);
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(warning).toHaveBeenCalledWith('Interface sound is unavailable.', error));
});

it('ignores a late rejected import after navigation unmounts the sound component', async () => {
  setSettings({ 'sound.on': true });
  let reject;
  const load = vi.fn(() => new Promise((resolve, fail) => (reject = fail)));
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const view = render(<Sound load={load} />);
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  view.unmount();
  await act(async () => reject(new TypeError('Importing a module script failed.')));
  expect(warning).not.toHaveBeenCalled();
});
