import { focusSlider, numericKey } from '../components/numericKeys';
import NumberInput from '../components/NumberInput';
import { useLang } from '../i18n/prefs';

/** A per-link value: a range for quick edits, exact text and an independent reset.
 * Null gaps keep inheriting; moving their range creates an explicit override.
 */
export default function LinkSetting({
  id,
  label,
  name,
  value,
  fallback = 0,
  min = 0,
  max,
  step,
  reset = null,
  unit = '',
  range = true,
  onChange,
}) {
  const { t } = useLang();
  const current = value ?? fallback;
  return (
    <div className="link-setting">
      <label htmlFor={id}>
        <span className="visually-hidden">{name.slice(0, name.indexOf(':') + 2)}</span>
        {label}
      </label>
      {range && (
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onPointerDown={focusSlider}
          onClick={focusSlider}
          aria-label={name}
          aria-valuetext={`${current}${unit}${value == null ? t({ en: ' (inherited)', ru: ' (общее значение)' }) : ''}`}
          onChange={(event) => onChange(Number(event.target.value))}
          onKeyDown={(event) => numericKey(event, onChange)}
        />
      )}
      <div className="link-setting__value">
        <NumberInput
          id={range ? `${id}-value` : id}
          min={min}
          max={max}
          step={step}
          value={value}
          fallback={fallback}
          placeholder={String(fallback)}
          aria-label={range ? `${name} (${t({ en: 'value', ru: 'значение' })})` : name}
          onValue={(next) => {
            // A blank turn is an editing draft, not an instruction to reset it.
            if (next !== null || reset === null) onChange(next);
          }}
        />
        <button
          type="button"
          className="setting__reset"
          disabled={value === reset}
          aria-label={`${t({ en: 'Back to the default', ru: 'Вернуть по умолчанию' })}: ${name}`}
          title={
            reset === null
              ? t({ en: 'Use the global value', ru: 'Использовать общее значение' })
              : t({ en: 'Back to the default', ru: 'Вернуть по умолчанию' })
          }
          onClick={() => onChange(reset)}
        >
          ↺
        </button>
      </div>
    </div>
  );
}
