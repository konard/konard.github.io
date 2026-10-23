import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Layout from '../components/Layout';
import { DEFAULTS, FIELDS } from '../settings/schema';
import { getSettings, setSettings, STORAGE_KEY } from '../settings/store';
import SettingsPage, { formatValue } from './SettingsPage';

const root = document.documentElement;
const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
const field = (key) => FIELDS.find((f) => f.key === key);

describe('settings page (issue #13)', () => {
  it('is linked from the footer of every page', () => {
    render(
      <Layout page="art">
        <p>content</p>
      </Layout>,
    );
    const link = within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Settings' });
    expect(link).toHaveAttribute('href', '/settings/');
  });

  it('applies a change to the page at once and remembers it in this browser', () => {
    render(<SettingsPage />);
    const step = screen.getByLabelText('Step');
    fireEvent.change(step, { target: { value: '150' } });
    expect(root.style.getPropertyValue('--rain-step')).toBe('150ms');
    expect(stored()).toEqual({ 'rain.step': 150 });
    expect(screen.getByText('150 ms')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Only real references (no references to 0)'));
    expect(getSettings()['rain.real']).toBe(true);
    expect(root.dataset.rainReal).toBe('true');
  });

  it('shows the options of the chosen skin only', () => {
    render(<SettingsPage />);
    expect(document.getElementById('glass')).toBeInTheDocument();
    expect(document.getElementById('liquid')).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Skin' }), { target: { value: 'futuristic' } });
    expect(root.dataset.skinName).toBe('futuristic');
    expect(document.getElementById('glass')).toBeNull();
    expect(document.getElementById('futuristic')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ares' }));
    expect(root.dataset.futurePalette).toBe('ares');
    expect(screen.getByRole('button', { name: 'Ares' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(screen.getByRole('combobox', { name: 'Skin' }), { target: { value: 'liquid' } });
    expect(document.getElementById('liquid')).toBeInTheDocument();
  });

  it('resets one setting, a section or everything', () => {
    setSettings({ 'rain.step': 150, 'rain.glow': 20, 'grid.size': 96 });
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to the default: Step' }));
    expect(stored()).toEqual({ 'rain.glow': 20, 'grid.size': 96 });
    const rain = document.getElementById('rain');
    fireEvent.click(within(rain).getByRole('button', { name: 'Reset' }));
    expect(stored()).toEqual({ 'grid.size': 96 });
    fireEvent.click(screen.getByRole('button', { name: 'Reset everything' }));
    expect(getSettings()).toEqual(DEFAULTS);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByRole('button', { name: 'Reset everything' })).toBeDisabled();
  });

  it('shows the changes as JSON and loads pasted settings', () => {
    setSettings({ 'skin.name': 'liquid' });
    render(<SettingsPage />);
    expect(JSON.parse(screen.getByLabelText('Changed settings').textContent)).toEqual({ 'skin.name': 'liquid' });

    const paste = screen.getByLabelText('Paste settings or saved looks to load them');
    fireEvent.change(paste, { target: { value: '{"grid.size": 96, "nebula.fps": 1000}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));
    // Loading replaces the settings: what is not in the JSON goes back to the default.
    expect(stored()).toEqual({ 'grid.size': 96, 'nebula.fps': 60 });
    expect(document.querySelector('#share .settings__status')).toHaveTextContent('Settings loaded.');

    fireEvent.change(paste, { target: { value: '[1, 2]' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));
    expect(document.querySelector('#share .settings__status')).toHaveTextContent('This is not JSON of settings.');
    expect(stored()).toEqual({ 'grid.size': 96, 'nebula.fps': 60 });
  });

  it('hides everything but one button to look at the background', () => {
    const { container } = render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Look at the background' }));
    expect(container.querySelector('.settings--peek')).toBeInTheDocument();
    const back = screen.getAllByRole('button', { name: 'Show the settings' });
    fireEvent.click(back[back.length - 1]);
    expect(container.querySelector('.settings--peek')).toBeNull();
  });

  it('formats values as people read them', () => {
    expect(formatValue(field('rain.step'), 75)).toBe('75 ms');
    expect(formatValue(field('nebula.resolution'), 0.6)).toBe('60%');
    expect(formatValue(field('grid.size'), 64)).toBe('64 px');
  });
});

describe('settings page layout (issue #15)', () => {
  const columns = () =>
    [...document.querySelectorAll('.settings__column')].map((column) =>
      [...column.querySelectorAll(':scope > .settings__group')].map((group) => group.id),
    );

  it('keeps every section in its own column whatever the skin', () => {
    render(<SettingsPage />);
    // The background layers bottom up, then the skin: the beams and the rain start the second column; the sound ends the first.
    const left = ['motion', 'nebula', 'stars', 'grid', 'sound'];
    const right = (options) => ['beams', 'rain', 'skin', options, 'theory'];
    expect(columns()).toEqual([left, right('glass')]);
    for (const [skin, options] of [
      ['liquid', 'liquid'],
      ['futuristic', 'futuristic'],
      ['glass', 'glass'],
    ]) {
      fireEvent.change(screen.getByRole('combobox', { name: 'Skin' }), { target: { value: skin } });
      expect(columns()).toEqual([left, right(options)]);
    }
  });

  it('puts every row into the same four columns: label, control, value, reset', () => {
    render(<SettingsPage />);
    const row = screen.getByLabelText('Step').closest('.setting');
    expect([...row.children].map((child) => child.className)).toEqual([
      '',
      'setting__input',
      'setting__value mono',
      'setting__reset',
      'setting__hint',
    ]);
    const select = screen.getByRole('combobox', { name: 'Skin' }).closest('.setting');
    expect(select.querySelector('.setting__value')).toBeNull();
    expect(select).toHaveClass('setting--select');
  });

  it('shows one star layer at a time in tabs, marking the layers that are on (issue #15)', () => {
    setSettings(DEFAULTS, { save: false });
    render(<SettingsPage />);
    const stars = document.getElementById('stars');
    const tabs = within(stars).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Layer 1', 'Layer 2', 'Layer 3', 'Layer 4']);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(within(stars).getAllByLabelText('Show this layer')).toHaveLength(1);

    fireEvent.click(tabs[2]);
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(within(stars).getByLabelText('Show this layer'));
    expect(getSettings()['stars3.on']).toBe(true);
    expect(getSettings()['stars1.on']).toBe(false);
    expect(tabs[2]).toHaveClass('is-on');
    expect(tabs[0]).not.toHaveClass('is-on');
    // The scripts read the layers; they do not become attributes of <html>.
    expect(root.hasAttribute('data-stars3-on')).toBe(false);
  });

  it('shows a setting only where it applies (issue #15)', () => {
    setSettings(DEFAULTS, { save: false });
    render(<SettingsPage />);
    const stars = document.getElementById('stars');
    // Layer 1 drifts, so it has a direction; a still layer has neither a direction nor a speed.
    expect(within(stars).getByLabelText('Direction')).toBeInTheDocument();
    fireEvent.change(within(stars).getByRole('combobox', { name: 'Motion' }), { target: { value: 'still' } });
    expect(within(stars).queryByLabelText('Direction')).toBeNull();
    expect(within(stars).queryByLabelText('Speed')).toBeNull();

    const grid = document.getElementById('grid');
    expect(within(grid).queryByLabelText('My colour')).toBeNull();
    fireEvent.change(within(grid).getByRole('combobox', { name: 'Colour' }), { target: { value: 'custom' } });
    expect(within(grid).getByLabelText('My colour')).toBeInTheDocument();
    expect(root.style.getPropertyValue('--grid-color')).toBe('#7efcf6');
    setSettings(DEFAULTS, { save: false });
  });
});
