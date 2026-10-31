// The presets of the settings page (issue #15).
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULTS } from '../settings/schema';
import { getSaved, setSaved, SAVED_KEY } from '../settings/presets';
import { getSettings, setSettings } from '../settings/store';
import SettingsPage from './SettingsPage';

const presets = () => document.getElementById('presets');
// The Matrix preset, not the Matrix universe of the defaults (issue #45).
const MATRIX = /^Matrix(?! universe)/;
const builtIn = (name) =>
  within(within(presets()).getByRole('list', { name: 'Presets of the site' })).getByRole('button', {
    name: name instanceof RegExp ? name : new RegExp(`^${RegExp.escape(name)}`),
  });

describe('presets (issue #15)', () => {
  it('come first on the settings page and in its section menu', () => {
    render(<SettingsPage />);
    const section = presets();
    expect(section.compareDocumentPosition(document.querySelector('.settings__groups'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    const menu = screen.getByRole('navigation', { name: 'Sections' });
    expect(within(menu).getAllByRole('link')[1]).toHaveAttribute('href', '#presets');
  });

  it('apply a look of the site, mark it and keep the comfort settings', () => {
    setSettings({ 'motion.mode': 'off', 'theory.notation': 'R', 'rain.step': 300 });
    render(<SettingsPage />);
    expect(builtIn('Matrix universe')).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(builtIn(MATRIX));
    const now = getSettings();
    expect(now['skin.name']).toBe('futuristic');
    expect(now['future.palette']).toBe('matrix');
    expect(now['rain.step']).toBe(DEFAULTS['rain.step']);
    expect(now['motion.mode']).toBe('off');
    expect(now['theory.notation']).toBe('R');
    expect(document.documentElement.dataset.futurePalette).toBe('matrix');
    expect(builtIn(MATRIX)).toHaveAttribute('aria-pressed', 'true');
    expect(within(presets()).getAllByRole('button', { pressed: true })).toHaveLength(1);
    // Every card shows a miniature of its look.
    expect(
      within(presets()).getByRole('list', { name: 'Presets of the site' }).querySelectorAll('.preset__mini'),
    ).toHaveLength(10);

    fireEvent.click(builtIn('Matrix universe'));
    expect(getSettings()).toEqual({ ...DEFAULTS, 'motion.mode': 'off', 'theory.notation': 'R' });
  });

  it('save, apply, update, rename and delete looks of this browser', () => {
    render(<SettingsPage />);
    const section = presets();
    expect(within(section).getByText(/Nothing yet/)).toBeInTheDocument();

    setSettings({ 'grid.size': 96 });
    fireEvent.change(within(section).getByRole('textbox', { name: 'Name of the look' }), {
      target: { value: 'Big grid' },
    });
    fireEvent.click(within(section).getByRole('button', { name: 'Save the current look' }));
    expect(getSaved()).toEqual([{ name: 'Big grid', look: { 'grid.size': 96 } }]);
    expect(JSON.parse(window.localStorage.getItem(SAVED_KEY))).toEqual(getSaved());
    expect(within(section).getByRole('status')).toHaveTextContent('Saved as “Big grid”.');

    // Without a name the look gets a number.
    act(() => setSettings({ 'grid.size': 64 }));
    fireEvent.click(within(section).getByRole('button', { name: 'Save the current look' }));
    expect(getSaved().map((item) => item.name)).toEqual(['Big grid', 'Look 2']);

    const saved = within(section).getByRole('list', { name: 'Saved looks' });
    fireEvent.click(within(saved).getByRole('button', { name: /^Big grid/ }));
    expect(getSettings()['grid.size']).toBe(96);
    expect(within(saved).getByRole('button', { name: /^Big grid/ })).toHaveAttribute('aria-pressed', 'true');

    act(() => setSettings({ 'grid.size': 128 }));
    fireEvent.click(within(saved).getByRole('button', { name: 'Save the current look here: Big grid' }));
    expect(getSaved()[0].look).toEqual({ 'grid.size': 128 });

    fireEvent.click(within(saved).getByRole('button', { name: 'Rename: Big grid' }));
    const rename = within(saved).getByRole('textbox', { name: 'New name' });
    fireEvent.change(rename, { target: { value: 'Huge grid' } });
    fireEvent.submit(rename);
    expect(getSaved().map((item) => item.name)).toEqual(['Huge grid', 'Look 2']);

    fireEvent.click(within(saved).getByRole('button', { name: 'Delete: Look 2' }));
    expect(getSaved().map((item) => item.name)).toEqual(['Huge grid']);
  });

  it('copy the saved looks as JSON that the box of the changes loads in another browser', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    setSaved([{ name: 'Mine', look: { 'grid.size': 96 } }]);
    render(<SettingsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy the saved looks as JSON' }));
    });
    const json = writeText.mock.calls[0][0];
    expect(JSON.parse(json)).toEqual({ presets: [{ name: 'Mine', look: { 'grid.size': 96 } }] });

    act(() => setSaved([]));
    fireEvent.change(screen.getByLabelText('Paste settings or saved looks to load them'), { target: { value: json } });
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));
    expect(getSaved()).toEqual([{ name: 'Mine', look: { 'grid.size': 96 } }]);
    expect(getSettings()).toEqual(DEFAULTS);
    expect(document.querySelector('#share .settings__status')).toHaveTextContent('The looks are added to the presets.');
  });

  it('make a random look and copy a link to the current look', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('denied')));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Random look' }));
    expect(getSettings()).not.toEqual(DEFAULTS);
    expect(getSettings()['sound.on']).toBe(DEFAULTS['sound.on']);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    });
    // When copying is not allowed the link is shown to select.
    const link = screen.getByRole('textbox', { name: 'Link to this look' });
    expect(link.value).toContain('#settings=');
    expect(link.value).toBe(writeText.mock.calls[0][0]);
  });
});
