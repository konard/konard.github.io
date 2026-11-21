import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Select from './Select';

describe('owned select-only combobox', () => {
  const setup = (extra) => {
    const onChange = vi.fn();
    render(
      <label>
        Palette
        <Select value="blue" onChange={onChange} {...extra}>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
        </Select>
      </label>,
    );
    return { button: screen.getByRole('combobox'), onChange };
  };
  it('owns a skinnable listbox with pointer selection and returns a native-shaped event', () => {
    const { button, onChange } = setup();
    fireEvent.click(button);
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('option', { name: 'Green' }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: 'green' }) }),
    );
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
  it('keeps the enclosing label distinct from hidden options and the listbox name', () => {
    const { button } = setup();
    expect(screen.getByLabelText('Palette')).toBe(button);
    expect(button).toHaveAccessibleName('Palette');
    fireEvent.click(button);
    expect(screen.getByRole('listbox')).toHaveAccessibleName('Options: Palette');
    expect(screen.getByLabelText('Palette')).toBe(button);
  });
  it('keeps unchanged control DOM stable while using the latest parent callback', async () => {
    const first = vi.fn();
    const latest = vi.fn();
    const view = (onChange) => (
      <Select value="blue" onChange={onChange} aria-label="Palette">
        <option value="blue">Blue</option>
        <option value="green">Green</option>
      </Select>
    );
    const { container, rerender } = render(view(first));
    const mutations = [];
    const observer = new MutationObserver((records) => mutations.push(...records));
    observer.observe(container, { attributes: true, childList: true, subtree: true });
    await act(async () => rerender(view(latest)));
    observer.disconnect();
    expect(mutations).toHaveLength(0);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Green' }));
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith(expect.objectContaining({ target: { value: 'green', name: undefined } }));
  });
  it('supports navigation, typeahead and Escape without changing the selection', () => {
    const { button, onChange } = setup();
    button.focus();
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    fireEvent.keyDown(button, { key: 'End' });
    expect(button.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Red' }).id);
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: ' ' });
    fireEvent.keyDown(button, { key: 'g' });
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onChange.mock.calls[0][0].target.value).toBe('green');
    expect(document.activeElement).toBe(button);
  });
  it('dismisses on outside pointer presses and respects disabled state', () => {
    const { button } = setup();
    fireEvent.click(button);
    fireEvent.pointerDown(document.body);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
  it('does not open a disabled control', () => {
    const { button } = setup({ disabled: true });
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  it('preserves labels assembled from multiple text and numeric children', () => {
    render(
      <Select value="zero" onChange={() => {}} aria-label="References">
        <option value="zero">
          {0}
          {' — void'}
        </option>
        <option value="size">
          {1280} × {800} ({'current'})
        </option>
      </Select>,
    );
    const button = screen.getByRole('combobox');
    expect(button).toHaveTextContent('0 — void');
    fireEvent.click(button);
    expect(screen.getByRole('option', { name: '1280 × 800 (current)' })).toBeInTheDocument();
  });
  it('commits on Tab and Alt+Up and supports page navigation', () => {
    const { button, onChange } = setup();
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    fireEvent.keyDown(button, { key: 'PageDown' });
    fireEvent.keyDown(button, { key: 'Tab' });
    expect(onChange.mock.calls[0][0].target.value).toBe('red');
    fireEvent.keyDown(button, { key: 'End' });
    fireEvent.keyDown(button, { key: 'PageUp' });
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    fireEvent.keyDown(button, { key: 'ArrowUp', altKey: true });
    expect(onChange.mock.calls[1][0].target.value).toBe('green');
  });
  it('skips disabled options and retains focus while choosing', () => {
    const onChange = vi.fn();
    render(
      <Select value="a" onChange={onChange} aria-label="With disabled option">
        <option value="a">Alpha</option>
        <option value="b" disabled>
          Beta
        </option>
        <option value="c">Charlie</option>
      </Select>,
    );
    const button = screen.getByRole('combobox');
    button.focus();
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    fireEvent.click(screen.getByRole('option', { name: 'Beta' }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onChange.mock.calls[0][0].target.value).toBe('c');
    expect(document.activeElement).toBe(button);
  });
});
