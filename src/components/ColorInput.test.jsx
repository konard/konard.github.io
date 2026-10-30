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
