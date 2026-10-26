import { GAP_FIELDS } from '../links/gaps';
import { useLang } from '../i18n/prefs';

export default function NetworkGaps({ gaps, style, onGap }) {
  const { t } = useLang();
  return (
    <details className="link-gaps">
      <summary>{t({ en: 'Gaps for each link', ru: 'Зазоры каждой связи' })}</summary>
      <p className="network__lead">
        {t({
          en: 'Leave a field empty to follow the global value shown as its placeholder. Reference gaps use layout units; middle cuts use 1/100 of the symbol.',
          ru: 'Пустое поле следует общему значению из подсказки. Зазоры ссылок — в единицах размещения; разрывы середины — в 1/100 символа.',
        })}
      </p>
      {gaps.map((row, i) => (
        <fieldset key={i}>
          <legend>
            {t({ en: 'Link', ru: 'Связь' })} {i + 1}
          </legend>
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
        </fieldset>
      ))}
    </details>
  );
}
