import { GAP_FIELDS } from '../links/gaps';
import { useLang } from '../i18n/prefs';
import NumberInput from '../components/NumberInput';

/** All four overrides stay visible inside their link's card. */
export default function NetworkGaps({ i, row, style, onGap }) {
  const { t } = useLang();
  return (
    <div className="link-gaps link-card__fields">
      {GAP_FIELDS.map((field, k) => (
        <label key={field.key}>
          {t(field.label)}
          <NumberInput
            min={0}
            max={field.max}
            step={field.step}
            aria-label={`${t({ en: 'Link', ru: 'Связь' })} ${i + 1}: ${t(field.label)}`}
            value={row[k]}
            fallback={style[field.key]}
            placeholder={String(style[field.key])}
            onValue={(value) => onGap(i, k, value)}
          />
        </label>
      ))}
    </div>
  );
}
