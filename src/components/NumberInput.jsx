import { useRef, useState } from 'react';
import { useLang } from '../i18n/prefs';
import { numericKey } from './numericKeys';

/** Keep intermediate text (empty, minus, decimal point) while a number is
 * being edited. Valid values still update the preview immediately.
 */
export default function NumberInput({ value, onValue, fallback = 0, ...props }) {
  const input = useRef(null);
  const { t } = useLang();
  const [draft, setDraft] = useState(null);
  const active = draft && Object.is(draft.at, value);
  const set = (next) => {
    setDraft(null);
    onValue(next);
  };
  return (
    <span className="ui-number">
      <input
        ref={input}
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
      <span className="ui-number__steps">
        {[1, -1].map((direction) => (
          <button
            key={direction}
            type="button"
            tabIndex={-1}
            disabled={
              props.disabled ||
              (direction > 0
                ? (value ?? fallback) >= Number(props.max ?? Infinity)
                : (value ?? fallback) <= Number(props.min ?? -Infinity))
            }
            aria-label={`${direction > 0 ? t({ en: 'Increase', ru: 'Увеличить' }) : t({ en: 'Decrease', ru: 'Уменьшить' })}: ${props['aria-label'] || props.id || ''}`}
            onPointerDown={(event) => event.preventDefault()}
            onClick={(event) => {
              input.current.focus({ preventScroll: true });
              numericKey(
                {
                  key: direction > 0 ? 'ArrowUp' : 'ArrowDown',
                  shiftKey: event.shiftKey,
                  currentTarget: input.current,
                  preventDefault() {},
                },
                set,
                value ?? fallback,
              );
            }}
          >
            <span aria-hidden="true">{direction > 0 ? '+' : '−'}</span>
          </button>
        ))}
      </span>
    </span>
  );
}
