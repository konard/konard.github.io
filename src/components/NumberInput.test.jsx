import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import NumberInput from './NumberInput';

it('provides owned pointer steps using inherited values, decimal snapping and bounds', () => {
  const onValue = vi.fn();
  const { rerender } = render(
    <NumberInput aria-label="Gap" value={null} fallback={0.08} min={0} max={1} step={0.01} onValue={onValue} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Increase: Gap' }));
  expect(onValue).toHaveBeenLastCalledWith(0.09);
  expect(screen.getByRole('spinbutton')).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Decrease: Gap' }));
  expect(onValue).toHaveBeenLastCalledWith(0.07);
  rerender(<NumberInput aria-label="Gap" value={0.075} min={0} max={1} step={0.01} onValue={onValue} />);
  fireEvent.click(screen.getByRole('button', { name: 'Increase: Gap' }));
  expect(onValue).toHaveBeenLastCalledWith(0.08);
  rerender(<NumberInput aria-label="Gap" value={1} min={0} max={1} step={0.01} onValue={onValue} />);
  expect(screen.getByRole('button', { name: 'Increase: Gap' })).toBeDisabled();
});
