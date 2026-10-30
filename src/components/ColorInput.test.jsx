import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import ColorInput from './ColorInput';

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
