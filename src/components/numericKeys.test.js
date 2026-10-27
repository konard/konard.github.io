import { expect, it, vi } from 'vitest';
import { numericKey } from './numericKeys';
import { STYLE_FIELDS } from '../links/style';
import { FIELDS } from '../settings/schema';

const key = (input, name, modifiers = {}, fallback = 0) => {
  const change = vi.fn();
  const event = { currentTarget: input, key: name, preventDefault: vi.fn(), ...modifiers };
  numericKey(event, change, fallback);
  return { value: change.mock.calls[0]?.[0], prevented: event.preventDefault.mock.calls.length > 0 };
};
it('steps off-grid typed numbers to the next valid decimal instead of accumulating a step mismatch', () => {
  const input = Object.assign(document.createElement('input'), {
    type: 'number',
    min: '0',
    max: '1',
    step: '0.01',
    value: '0.075',
  });
  expect(key(input, 'ArrowUp').value).toBe(0.08);
  expect(key(input, 'ArrowDown').value).toBe(0.07);
  expect(key(input, 'PageUp').value).toBe(0.17);
  input.value = '';
  expect(key(input, 'ArrowUp', {}, 0.08).value).toBe(0.09);
  expect(key(input, 'ArrowUp', { shiftKey: true }, 0.08).value).toBe(0.18);
  for (const name of ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab', 'Backspace', 'Delete', 'Escape', 'Enter'])
    expect(key(input, name).prevented).toBe(false);
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey'])
    expect(key(input, 'ArrowUp', { [modifier]: true }).prevented).toBe(false);
});
it('supports all eight navigation keys at valid limits for every slider schema, including conditional controls', () => {
  for (const field of [...STYLE_FIELDS, ...FIELDS].filter((field) => field.type === 'range' && field.step)) {
    const input = Object.assign(document.createElement('input'), {
      type: 'range',
      min: String(field.min),
      max: String(field.max),
      step: String(field.step),
      value: String(field.d),
    });
    for (const name of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End']) {
      const { value, prevented } = key(input, name);
      expect(prevented, `${field.key}: ${name}`).toBe(true);
      expect(value, field.key).toBeGreaterThanOrEqual(field.min);
      expect(value, field.key).toBeLessThanOrEqual(field.max);
      expect(Number.isFinite(value), field.key).toBe(true);
    }
    input.value = String(field.min);
    expect(key(input, 'ArrowDown').value).toBe(field.min);
    input.value = String(field.max);
    expect(key(input, 'ArrowUp').value).toBe(field.max);
  }
});
