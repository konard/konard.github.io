import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import ColorInput from './ColorInput';
import { COLOR_PALETTES } from './colorPalettes';

it('keeps incomplete color drafts out of settings and restores the saved value on blur or Escape', () => {
  const onChange = vi.fn();
  render(<ColorInput value="#123456" onChange={onChange} aria-label="Accent color" />);
  const field = screen.getByRole('textbox', { name: 'Accent color' });
  fireEvent.change(field, { target: { value: '#12' } });
  expect(field).toHaveValue('#12');
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.blur(field);
  expect(field).toHaveValue('#123456');
  fireEvent.change(field, { target: { value: 'invalid' } });
  fireEvent.keyDown(field, { key: 'Escape' });
  expect(field).toHaveValue('#123456');
  fireEvent.change(field, { target: { value: '#aBcDeF' } });
  expect(onChange).toHaveBeenCalledOnce();
});

it('keeps pointer color selection in an owned keyboard-accessible chooser', () => {
  const change = vi.fn();
  render(<ColorInput aria-label="Accent" value="#112233" onChange={change} />);
  const trigger = screen.getByRole('button', { name: 'Choose color: Accent' });
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog', { name: 'Color chooser' })).toBeInTheDocument();
  const red = screen.getByRole('slider', { name: 'Red' });
  expect(red).toHaveFocus();
  fireEvent.change(red, { target: { value: '255' } });
  expect(change).toHaveBeenCalledWith(expect.objectContaining({ target: { value: '#ff2233' } }));
  fireEvent.keyDown(red, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(trigger).toHaveFocus();
});

it('offers palettes of neon, pastel and matrix colours besides the sliders (issue #45)', () => {
  const change = vi.fn();
  render(<ColorInput aria-label="Accent" value="#39ff14" onChange={change} />);
  fireEvent.click(screen.getByRole('button', { name: 'Choose color: Accent' }));
  const dialog = screen.getByRole('dialog', { name: 'Color chooser' });
  for (const palette of COLOR_PALETTES) {
    const group = within(dialog).getByRole('group', { name: palette.name.en });
    expect(within(group).getAllByRole('button')).toHaveLength(palette.colors.length);
  }
  expect(within(dialog).getByRole('button', { name: 'Neon green #39ff14' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Pastel pink #ffd1dc' }));
  expect(change).toHaveBeenCalledWith(expect.objectContaining({ target: { value: '#ffd1dc' } }));
  // The sliders still come first and get the focus.
  expect(screen.getByRole('slider', { name: 'Red' })).toHaveFocus();
});

it('keeps every palette colour a valid, unique hex value', () => {
  const all = COLOR_PALETTES.flatMap((palette) => palette.colors.map(([hex]) => hex));
  all.forEach((hex) => expect(hex).toMatch(/^#[0-9a-f]{6}$/));
  expect(new Set(all).size).toBe(all.length);
  expect(COLOR_PALETTES.map((palette) => palette.id)).toEqual(['neon', 'pastel', 'matrix']);
});
