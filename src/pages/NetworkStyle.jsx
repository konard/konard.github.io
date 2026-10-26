import { useState } from 'react';
import { formatValue } from '../settings/fields';
import { LOOKS, SIZES, STYLE_DEFAULTS, STYLE_SECTIONS, applyLook, normalizeStyle } from '../links/style';
import { geometryAvailable } from '../links/style-geometry';
import { useLang } from '../i18n/prefs';

const SAVED_KEY = 'network.styles';
const MAX_SAVED = 12;

/** The styles saved in this browser: [{ name, style }]. */
export function readSaved() {
  try {
    const list = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(list)
      ? list
          .filter((item) => item && typeof item.name === 'string')
          .slice(0, MAX_SAVED)
          .map((item) => ({ name: item.name.slice(0, 40), style: normalizeStyle(item.style) }))
      : [];
  } catch {
    return [];
  }
}

function writeSaved(list) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  } catch {
    // Private mode or a full storage: the list lives until the page is closed.
  }
}

/** One option of the picture, in the same rows as the settings page (label | control | value | reset). */
function Control({ field, value, onChange }) {
  const { t } = useLang();
  const id = `style-${field.key}`;
  const changed = value !== STYLE_DEFAULTS[field.key];
  let input;
  let shown = null;
  if (field.type === 'range') {
    input = (
      <input
        id={id}
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    );
    shown = formatValue(field, value);
  } else if (field.type === 'toggle') {
    input = <input id={id} type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />;
  } else if (field.type === 'color') {
    input = <input id={id} type="color" value={value} onChange={(event) => onChange(event.target.value)} />;
    shown = value;
  } else if (field.type === 'text') {
    input = (
      <input
        id={id}
        type="text"
        maxLength={field.max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  } else {
    input = (
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.label)}
          </option>
        ))}
      </select>
    );
  }
  return (
    <li className={`setting setting--${field.type === 'text' ? 'select' : field.type}${changed ? ' is-changed' : ''}`}>
      <label htmlFor={id}>{t(field.label)}</label>
      <span className="setting__input">{input}</span>
      {shown !== null && (
        <output htmlFor={id} className="setting__value mono">
          {shown}
        </output>
      )}
      <button
        type="button"
        className="setting__reset"
        onClick={() => onChange(STYLE_DEFAULTS[field.key])}
        disabled={!changed}
        title={t({ en: 'Back to the default', ru: 'Вернуть по умолчанию' })}
        aria-label={`${t({ en: 'Back to the default', ru: 'Вернуть по умолчанию' })}: ${t(field.label)}`}
      >
        ↺
      </button>
      {field.hint && <small className="setting__hint">{t(field.hint)}</small>}
    </li>
  );
}

/** Ready looks, the usual image sizes and the styles saved in this browser. */
export function Looks({ style, onStyle }) {
  const { t } = useLang();
  const [saved, setSaved] = useState(readSaved);
  const [name, setName] = useState('');
  const size = SIZES.findIndex((s) => s.width === style.width && s.height === style.height);
  const save = () => {
    const label = name.trim() || `${t({ en: 'Style', ru: 'Стиль' })} ${saved.length + 1}`;
    const next = [{ name: label.slice(0, 40), style }, ...saved.filter((item) => item.name !== label)].slice(
      0,
      MAX_SAVED,
    );
    setSaved(next);
    writeSaved(next);
    setName('');
  };
  const remove = (label) => {
    const next = saved.filter((item) => item.name !== label);
    setSaved(next);
    writeSaved(next);
  };
  return (
    <div className="looks">
      <div className="looks__row" role="group" aria-label={t({ en: 'Looks', ru: 'Оформления' })}>
        {LOOKS.map((look) => (
          <button
            key={look.id}
            type="button"
            className="button button--small"
            onClick={() => onStyle(applyLook(style, look.id))}
          >
            {t(look.label)}
          </button>
        ))}
      </div>
      <label className="looks__size">
        {t({ en: 'Image size', ru: 'Размер изображения' })}{' '}
        <select
          value={size}
          onChange={(event) => {
            const chosen = SIZES[Number(event.target.value)];
            if (chosen) onStyle({ ...style, width: chosen.width, height: chosen.height });
          }}
        >
          <option value={-1}>
            {style.width} × {style.height} ({t({ en: 'own', ru: 'свой' })})
          </option>
          {SIZES.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <div className="looks__saved">
        <input
          type="text"
          value={name}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          placeholder={t({ en: 'Name of the style', ru: 'Название стиля' })}
          aria-label={t({ en: 'Name of the style', ru: 'Название стиля' })}
        />
        <button type="button" className="button button--small" onClick={save}>
          {t({ en: 'Save the style', ru: 'Сохранить стиль' })}
        </button>
      </div>
      {saved.length > 0 && (
        <ul className="looks__list" aria-label={t({ en: 'Saved styles', ru: 'Сохранённые стили' })}>
          {saved.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                className="button button--small"
                onClick={() => onStyle({ ...item.style, turns: style.turns, gaps: style.gaps, solve: style.solve })}
              >
                {item.name}
              </button>
              <button
                type="button"
                className="setting__reset"
                onClick={() => remove(item.name)}
                aria-label={`${t({ en: 'Delete', ru: 'Удалить' })}: ${item.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Every option of the picture, section by section (issue #17). */
export function StyleSections({ style, onStyle, children = null, only = null, links = null }) {
  const { t } = useLang();
  const set = (key, value) => onStyle(normalizeStyle({ ...style, [key]: value }));
  return STYLE_SECTIONS.filter((section) => !only || only.includes(section.id)).map((section) => {
    const keys = section.fields.map((field) => field.key);
    const changed = keys.some((key) => style[key] !== STYLE_DEFAULTS[key]);
    return (
      <section
        key={section.id}
        id={`style-section-${section.id}`}
        className="settings__group"
        aria-labelledby={`style-section-${section.id}-title`}
      >
        <header className="settings__head">
          <h3 id={`style-section-${section.id}-title`}>{t(section.title)}</h3>
          <button
            type="button"
            className="button button--small"
            disabled={!changed}
            onClick={() =>
              onStyle(
                normalizeStyle({ ...style, ...Object.fromEntries(keys.map((key) => [key, STYLE_DEFAULTS[key]])) }),
              )
            }
          >
            {t({ en: 'Reset', ru: 'Сбросить' })}
          </button>
        </header>
        {section.lead && <p className="settings__lead">{t(section.lead)}</p>}
        <ul className="settings__fields">
          {section.fields
            .filter((field) => (!field.when || field.when(style)) && geometryAvailable(field.key, style, links))
            .map((field) => (
              <Control
                key={field.key}
                field={field}
                value={style[field.key]}
                onChange={(value) => set(field.key, value)}
              />
            ))}
        </ul>
        {section.id === 'experimental' && children}
      </section>
    );
  });
}
