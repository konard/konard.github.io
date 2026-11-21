import { localized } from '../i18n/localizer.js';
import { GAP_FIELDS } from '../links/gaps';
import { useLang } from '../i18n/prefs';
import LinkSetting from './LinkSetting';

/** Paired geometry controls stay below one separator in each link's card. */
export default function NetworkGaps({ i, row, style, onGap, turns, turnDefaults, onTurn }) {
  const { t } = useLang();
  const name = `${t(localized('m574b2b03f271'))} ${i + 1}`;
  return (
    <div className="link-gaps link-card__geometry link-card__fields">
      {[0, 1].map((end) => {
        const label = t(end ? localized('mb932d631d906') : localized('m21da7772f0ce'));
        const fieldName = `${name}: ${t(localized('m1e24664c7001'))} ${t(end ? localized('m458b8ba592d0') : localized('m11a0be7570c6'))}, °`;
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
