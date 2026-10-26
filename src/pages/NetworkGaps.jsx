import { GAP_FIELDS } from '../links/gaps';
import { useLang } from '../i18n/prefs';

/** All four overrides stay visible inside their link's card. */
export default function NetworkGaps({ i, row, style, onGap }) {
  const { t } = useLang();
  return (
    <div className="link-gaps link-card__fields">
      {GAP_FIELDS.map((field, k) => (
        <label key={field.key}>
          {t(field.label)}
          <input
            type="number"
            min={0}
            max={field.max}
            step={field.step}
            aria-label={`${t({ en: 'Link', ru: 'Связь' })} ${i + 1}: ${t(field.label)}`}
            value={row[k] ?? ''}
            placeholder={String(style[field.key])}
            onChange={(event) => onGap(i, k, event.target.value === '' ? null : Number(event.target.value))}
          />
        </label>
      ))}
    </div>
  );
}
