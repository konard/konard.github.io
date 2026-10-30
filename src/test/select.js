import { fireEvent, screen } from '@testing-library/react';

/** Exercise the same owned popup and option clicks as a pointer user. */
export function chooseSelect(control, value) {
  fireEvent.click(control);
  const option = screen.getAllByRole('option').find((item) => item.dataset.value === String(value));
  if (!option) throw new Error(`No option ${value}`);
  fireEvent.click(option);
}
