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

it('keeps pointer color selection in an owned keyboard-accessible chooser', async () => {
  const change = vi.fn();
  render(<ColorInput aria-label="Accent" value="#112233" onChange={change} />);
  const trigger = screen.getByRole('button', { name: 'Choose color: Accent' });
  fireEvent.click(trigger);
  expect(await screen.findByRole('dialog', { name: 'Color chooser' })).toBeInTheDocument();
  const red = screen.getByRole('slider', { name: 'Red' });
  expect(red).toHaveFocus();
  fireEvent.change(red, { target: { value: '255' } });
  expect(change).toHaveBeenCalledWith(expect.objectContaining({ target: { value: '#ff2233' } }));
  fireEvent.keyDown(red, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(trigger).toHaveFocus();
});

it('offers palettes of neon, pastel and matrix colours besides the sliders (issue #45)', async () => {
  const change = vi.fn();
  render(<ColorInput aria-label="Accent" value="#39ff14" onChange={change} />);
  fireEvent.click(screen.getByRole('button', { name: 'Choose color: Accent' }));
  const dialog = await screen.findByRole('dialog', { name: 'Color chooser' });
  for (const palette of COLOR_PALETTES) {
    const group = within(dialog).getByRole('group', { name: palette.name.en });
    expect(within(group).getAllByRole('button')).toHaveLength(palette.colors.length);
  }
  expect(within(dialog).getByRole('button', { name: 'Neon green #39ff14' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Pastel pink #f8c8dc' }));
  expect(change).toHaveBeenCalledWith(expect.objectContaining({ target: { value: '#f8c8dc' } }));
  // The sliders still come first and get the focus.
  expect(screen.getByRole('slider', { name: 'Red' })).toHaveFocus();
});

it('reveals the chooser only after its asynchronous position is ready', async () => {
  render(<ColorInput aria-label="Accent" value="#112233" onChange={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Choose color: Accent' }));
  expect(screen.getByRole('dialog', { hidden: true })).toHaveStyle({ visibility: 'hidden' });
  const dialog = await screen.findByRole('dialog', { name: 'Color chooser' });
  expect(dialog.style.left).not.toBe('');
  expect(dialog.style.top).not.toBe('');
  expect(screen.getByRole('slider', { name: 'Red' })).toHaveFocus();
});

it('keeps every palette colour a valid, unique hex value', () => {
  const all = COLOR_PALETTES.flatMap((palette) => palette.colors.map(([hex]) => hex));
  all.forEach((hex) => expect(hex).toMatch(/^#[0-9a-f]{6}$/));
  expect(new Set(all).size).toBe(all.length);
  expect(COLOR_PALETTES.map((palette) => palette.id)).toEqual(['neon', 'pastel', 'matrix']);
});
