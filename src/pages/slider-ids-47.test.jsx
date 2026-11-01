import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ColorInput from '../components/ColorInput';
import { resetSettings, setSettings } from '../settings/store';
import SettingsPage from './SettingsPage';

// Issue #47: the browser checks find every slider of the settings page by its
// id (the fit limits of a frame level reveal more sliders as they change, so
// positions shift). The preview and sample sliders had none, and the check
// stopped at "every slider has an id".
const ids = (root) => [...root.querySelectorAll('input[type="range"]')].map((input) => input.id);

describe('every slider of the settings page has its own id (issue #47)', () => {
  afterEach(() => resetSettings());

  it('names the setting, preview and sample sliders', () => {
    setSettings({ 'skin.name': 'futuristic', 'future.frame': 'custom' });
    const { container } = render(<SettingsPage />);
    const all = ids(container);
    expect(all.length).toBeGreaterThan(10);
    expect(all.filter((id) => !id)).toEqual([]);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toEqual(expect.arrayContaining(['ui-preview-slider', 'ui-samples-slider']));
  });

  it('names the channel sliders of every colour chooser apart', () => {
    render(
      <>
        <ColorInput aria-label="First" value="#112233" onChange={() => {}} />
        <ColorInput aria-label="Second" value="#445566" onChange={() => {}} />
      </>,
    );
    const open = (name) => {
      fireEvent.click(screen.getByRole('button', { name: `Choose color: ${name}` }));
      return ids(document.body);
    };
    // One chooser is open at a time: opening the second closes the first.
    const all = [...open('First'), ...open('Second')];
    expect(all).toHaveLength(6);
    expect(all.every((id) => /-(red|green|blue)$/.test(id))).toBe(true);
    expect(new Set(all).size).toBe(6);
  });
});
