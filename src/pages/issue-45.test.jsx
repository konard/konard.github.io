import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SettingsPage from './SettingsPage';

describe('samples of every element (issue #45)', () => {
  it('renders a small sample of every bordered element in the interface section', () => {
    render(<SettingsPage />);
    const samples = document.getElementById('interface').querySelector('.ui-samples');
    expect(samples).not.toBeNull();
    const names = [...samples.querySelectorAll('[data-sample]')].map((sample) => sample.dataset.sample);
    expect(names).toEqual([
      'panel',
      'position',
      'stat',
      'overflow',
      'buttons',
      'fields',
      'textarea',
      'chips',
      'tabs',
      'table',
    ]);
    // The samples use the real class names, so the skins style them as on the pages.
    expect(samples.querySelector('.card .repo')).not.toBeNull();
    expect(samples.querySelector('.position.position--company')).not.toBeNull();
    expect(samples.querySelector('.stat')).not.toBeNull();
    expect(samples.querySelector('.segmented [aria-pressed="true"]')).not.toBeNull();
  });
});
