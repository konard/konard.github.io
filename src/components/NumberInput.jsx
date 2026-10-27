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
