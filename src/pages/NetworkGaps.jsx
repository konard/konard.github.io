import { GAP_FIELDS } from '../links/gaps';
import { useLang } from '../i18n/prefs';
import LinkSetting from './LinkSetting';

/** Paired geometry controls stay below one separator in each link's card. */
export default function NetworkGaps({ i, row, style, onGap, turns, turnDefaults, onTurn }) {
  const { t } = useLang();
  const name = `${t({ en: 'Link', ru: 'Связь' })} ${i + 1}`;
  return (
    <div className="link-gaps link-card__geometry link-card__fields">
      {[0, 1].map((end) => {
        const label = t(
          end
            ? { en: 'Turn of the target, °', ru: 'Поворот конца, °' }
            : { en: 'Turn of the source, °', ru: 'Поворот начала, °' },
        );
        const fieldName = `${name}: ${t({ en: 'turn of the', ru: 'поворот' })} ${t(end ? { en: 'target', ru: 'конец' } : { en: 'source', ru: 'начало' })}, °`;
        return (
          <LinkSetting
            key={end}
            id={`link-${i + 1}-turn-${end}`}
            label={label}
            name={fieldName}
            min={-180}
            max={180}
            step={1}
            reset={turnDefaults[end]}
            value={turns[end]}
            unit="°"
            onChange={(value) => onTurn(i, end, value)}
          />
        );
      })}
      {GAP_FIELDS.map((field, k) => (
        <LinkSetting
          key={field.key}
          id={`link-${i + 1}-${field.key}`}
          label={t(field.label)}
          name={`${name}: ${t(field.label)}`}
          max={field.max}
          step={field.step}
          value={row[k]}
          fallback={style[field.key]}
          range={k < 2}
          onChange={(value) => onGap(i, k, value)}
        />
      ))}
    </div>
  );
}
