import { useState } from 'react';
import { numericKey } from './numericKeys';

/** Keep intermediate text (empty, minus, decimal point) while a number is
 * being edited. Valid values still update the preview immediately.
 */
export default function NumberInput({ value, onValue, fallback = 0, ...props }) {
  const [draft, setDraft] = useState(null);
  const active = draft && Object.is(draft.at, value);
  const set = (next) => {
    setDraft(null);
    onValue(next);
  };
  return (
    <input
      {...props}
      type="number"
      value={active ? draft.text : (value ?? '')}
      onPointerDown={(event) => {
        // Native spinner actions run after pointerdown and use the DOM value,
        // never its placeholder. A draft primes inheritance without saving an
        // override when the user merely focuses, then leaves, an empty field.
        if (value == null && event.currentTarget.value === '') setDraft({ text: String(fallback), at: value });
      }}
      onChange={(event) => {
        const text = event.target.value;
        const next = text === '' ? null : Number(text);
        if (event.target.validity.badInput) {
          setDraft({ text, at: value });
          return;
        }
        onValue(next);
        setDraft({ text, at: next ?? value });
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(event) => numericKey(event, set, value ?? fallback)}
    />
  );
}
