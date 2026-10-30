// The sound code is loaded only when sound is on (issue #15: fast loading with
// the default options), and switching it on plays the intro.
import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Sound, { previewSound } from './Sound';
import { DEFAULTS } from '../settings/schema';
import { setSettings } from '../settings/store';

const { session, startSound } = vi.hoisted(() => {
  const session = { update: vi.fn(), play: vi.fn(), preview: vi.fn(() => true), stop: vi.fn() };
  return { session, startSound: vi.fn(() => session) };
});
vi.mock('../sound/interactions', () => ({ startSound }));

describe('<Sound />', () => {
  it('does not load the sound engine while sound is off, starts it when switched on and stops it when off', async () => {
    setSettings({ 'sound.on': false });
    render(<Sound />);
    await act(async () => {});
    expect(startSound).not.toHaveBeenCalled();
    expect(previewSound('ion')).toBe(false);

    act(() => setSettings({ 'sound.on': true }));
    await waitFor(() => expect(startSound).toHaveBeenCalledTimes(1));
    expect(startSound.mock.calls[0][0].on).toBe(true);
    expect(session.play).toHaveBeenCalledWith('intro');
    expect(previewSound('ion')).toBe(true);

    act(() => setSettings({ 'sound.volume': 0.4 }));
    expect(session.update).toHaveBeenLastCalledWith(expect.objectContaining({ volume: 0.4 }));

    act(() => setSettings({ 'sound.on': false }));
    expect(session.stop).toHaveBeenCalled();
    expect(previewSound('ion')).toBe(false);
  });

  it('does not play the intro when a page opens with sound already on', async () => {
    setSettings({ ...DEFAULTS, 'sound.on': true });
    session.play.mockClear();
    startSound.mockClear();
    render(<Sound />);
    await waitFor(() => expect(startSound).toHaveBeenCalledTimes(1));
    expect(session.play).not.toHaveBeenCalled();
  });
});
