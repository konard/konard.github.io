import { useState } from 'react';

/** An owned color field, with a live swatch and precise keyboard-editable hex.
 * No operating-system picker: the field follows the same skin as other inputs.
 * Incomplete drafts stay editable and never enter the settings store.
 */
export default function ColorInput({ value, onChange, ...props }) {
  const [draft, setDraft] = useState(null);
  return (
    <span className="ui-color">
      <span className="ui-color__swatch" style={{ '--color': value }} aria-hidden="true" />
      <input
        {...props}
        type="text"
        spellCheck={false}
        autoComplete="off"
        maxLength={7}
        value={draft ?? value}
        pattern="#[0-9a-fA-F]{6}"
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (/^#[0-9a-f]{6}$/i.test(next)) {
            onChange(event);
            setDraft(null);
          }
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setDraft(null);
        }}
      />
    </span>
  );
}
