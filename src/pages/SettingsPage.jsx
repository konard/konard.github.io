import { useState } from 'react';
import './settings.css';
import Layout from '../components/Layout';
import { previewSound } from '../components/Sound';
import { CornerTiles, SameCorners } from './CornerTiles';
import Presets from './Presets';
import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { getSaved, setSaved, withImported } from '../settings/presets';
import { DEFAULTS, FIELDS, PALETTES, SECTIONS } from '../settings/schema';
import { changesOf, resetSettings, setSettings, useSettings } from '../settings/store';
import { cue } from '../sound/options';

const SETTINGS = { en: ['setting', 'settings'], ru: ['настройка', 'настройки', 'настроек'] };
const CHANGED = { en: ['differs', 'differ'], ru: ['отличается', 'отличаются', 'отличаются'] };

const decimals = (step) => (String(step).split('.')[1] || '').length;

/**
 * A value as people read it: shares as percents (0.6 → 60%), factors with ×,
 * the rest with its unit (75 ms, 64 px, 90°).
 */
export function formatValue(field, value) {
  const { unit = '', step = 1, max } = field;
  if (unit === '%' && max <= 2) return `${Math.round(value * 100)}%`;
  const number = value.toFixed(decimals(step));
  if (unit === '%' || unit === '×' || unit === '°') return `${number}${unit}`;
  return unit ? `${number} ${unit}` : number;
}

// Two explicit columns instead of CSS multi-column layout (issue #15): with
// multicol the browser rebalanced the sections whenever the skin section
// changed size, so Skin jumped between the columns, and Safari laid them out in
// one column or with uneven tops. Each section now names its column.
const COLUMNS = [1, 2];

const visibleSections = (settings) => SECTIONS.filter((section) => !section.when || section.when(settings));

function Control({ field, value, settings }) {
  const { t } = useLang();
  const id = `setting-${field.key.replace(/\./g, '-')}`;
  const set = (next) => setSettings({ [field.key]: next });
  const changed = value !== DEFAULTS[field.key];
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
        onChange={(event) => set(Number(event.target.value))}
      />
    );
    shown = formatValue(field, value);
  } else if (field.type === 'toggle') {
    input = <input id={id} type="checkbox" checked={value} onChange={(event) => set(event.target.checked)} />;
  } else if (field.type === 'color') {
    input = <input id={id} type="color" value={value} onChange={(event) => set(event.target.value)} />;
    shown = value;
  } else if (field.tiles) {
    input = <CornerTiles field={field} value={value} settings={settings} labelId={`${id}-label`} />;
  } else {
    input = (
      <select id={id} value={value} onChange={(event) => set(event.target.value)}>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.label)}
          </option>
        ))}
      </select>
    );
    if (field.preview === 'sound') {
      // ▶ plays the chosen sound, so a sound can be heard before it is kept.
      input = (
        <>
          {input}
          <button
            type="button"
            className="setting__play"
            disabled={value === 'none'}
            onClick={() => previewSound(value)}
            title={t({ en: 'Play', ru: 'Проиграть' })}
            aria-label={`${t({ en: 'Play', ru: 'Проиграть' })}: ${t(field.label)}`}
          >
            ▶
          </button>
        </>
      );
    }
  }
  // Every row is the same grid: label | control | value | reset, so controls,
  // values and reset buttons line up in a column on the whole page (issue #15).
  return (
    <li className={`setting setting--${field.tiles ? 'tiles' : field.type}${changed ? ' is-changed' : ''}`}>
      <label htmlFor={field.tiles ? undefined : id} id={`${id}-label`}>
        {t(field.label)}
      </label>
      <span className="setting__input">{input}</span>
      {shown !== null && (
        <output htmlFor={id} className="setting__value mono">
          {shown}
        </output>
      )}
      <button
        type="button"
        className="setting__reset"
        onClick={() => resetSettings([field.key])}
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

/** Colour chips of the futuristic palettes, a faster way to pick one. */
function Palettes({ value }) {
  const { t } = useLang();
  return (
    <div className="palettes" role="group" aria-label={t({ en: 'Palettes', ru: 'Палитры' })}>
      {PALETTES.map(([id, en, ru, neon]) => (
        <button
          key={id}
          type="button"
          className="palettes__chip"
          style={{ '--chip': neon }}
          aria-pressed={value === id}
          title={t({ en, ru })}
          aria-label={t({ en, ru })}
          onClick={() => setSettings({ 'future.palette': id })}
        />
      ))}
    </div>
  );
}

/** Tabs of a section with layers (the star layers, corners and sounds of issue #15); a dot marks a layer that is on. */
function Tabs({ section, settings, tab, onChange }) {
  const { t } = useLang();
  return (
    <div className="settings__tabs" role="tablist" aria-label={t(section.title)}>
      {section.tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          id={`tab-${item.id}`}
          aria-selected={tab === item.id}
          aria-controls={`${section.id}-fields`}
          className={`settings__tab${settings[item.on] ? ' is-on' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {t(item.label)}
        </button>
      ))}
    </div>
  );
}

function Group({ section, settings }) {
  const { t } = useLang();
  const [tab, setTab] = useState(section.tabs?.[0].id);
  const keys = section.fields.map((field) => field.key);
  const changed = keys.filter((key) => settings[key] !== DEFAULTS[key]).length;
  // A field may belong to a tab and may apply only to some values of other fields.
  const shown = (field) => !field.when || field.when(settings);
  // The fields of every tab come first, then the tabs and the fields of the chosen tab;
  // tabs with nothing in them are not shown (the sound tabs while the sound is off).
  const shared = section.fields.filter((field) => !field.tab && shown(field));
  const inTab = section.fields.filter((field) => field.tab === tab && shown(field));
  const tabbed = section.tabs && section.fields.some((field) => field.tab && shown(field));
  const list = (fields, extra) => (
    <ul className="settings__fields" {...extra}>
      {fields.map((field) => (
        <Control key={field.key} field={field} value={settings[field.key]} settings={settings} />
      ))}
    </ul>
  );
  return (
    <section id={section.id} className="settings__group" aria-labelledby={`${section.id}-title`}>
      <header className="settings__head">
        <h2 id={`${section.id}-title`}>{t(section.title)}</h2>
        <button type="button" className="button button--small" onClick={() => resetSettings(keys)} disabled={!changed}>
          {t({ en: 'Reset', ru: 'Сбросить' })}
        </button>
      </header>
      {section.lead && <p className="settings__lead">{t(section.lead)}</p>}
      {section.id === 'futuristic' && <Palettes value={settings['future.palette']} />}
      {tabbed ? (
        <>
          {shared.length > 0 && list(shared)}
          <Tabs section={section} settings={settings} tab={tab} onChange={setTab} />
          {list(inTab, { id: `${section.id}-fields`, role: 'tabpanel', 'aria-labelledby': `tab-${tab}` })}
        </>
      ) : (
        list(shared, { id: `${section.id}-fields` })
      )}
      {section.id === 'corners' && <SameCorners corner={tab} settings={settings} />}
    </section>
  );
}

/**
 * /settings/ (issue #13): every option of the background animation, the skin,
 * the sound (issue #15) and the theory notation, generated from src/settings/schema.js. A change is
 * applied at once, so the page itself is the preview, and it is remembered in
 * this browser (localStorage) as a difference from the defaults.
 */
export default function SettingsPage() {
  const { lang, t } = useLang();
  const settings = useSettings();
  const [peek, setPeek] = useState(false);
  const [status, setState] = useState('');
  const setStatus = (message) => {
    setState(message);
    cue('notify');
  };
  const [draft, setDraft] = useState('');
  const sections = visibleSections(settings);
  const changes = changesOf(settings);
  const changed = Object.keys(changes).length;
  const json = JSON.stringify(changes, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setStatus(t({ en: 'Copied.', ru: 'Скопировано.' }));
    } catch {
      setStatus(
        t({
          en: 'Copying is not allowed here; select the text below.',
          ru: 'Копирование запрещено; выделите текст ниже.',
        }),
      );
    }
  };
  const load = () => {
    try {
      const parsed = JSON.parse(draft);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
      if (Array.isArray(parsed.presets)) {
        // Looks copied from "Presets" in another browser.
        setSaved(withImported(getSaved(), parsed.presets));
        setStatus(t({ en: 'The looks are added to the presets.', ru: 'Виды добавлены к пресетам.' }));
      } else {
        setSettings({ ...DEFAULTS, ...parsed });
        setStatus(t({ en: 'Settings loaded.', ru: 'Настройки загружены.' }));
      }
      setDraft('');
    } catch {
      setStatus(t({ en: 'This is not JSON of settings.', ru: 'Это не JSON с настройками.' }));
    }
  };

  return (
    <Layout
      page="settings"
      sections={[
        ['presets', { en: 'Presets', ru: 'Пресеты' }],
        ...sections.map((section) => [section.id, section.title]),
      ]}
    >
      <div className={`settings${peek ? ' settings--peek' : ''}`}>
        <header className="page-hero" id="top">
          <p className="section__kicker">{t({ en: 'Settings', ru: 'Настройки' })}</p>
          <h1 className="page-hero__title">
            {t({ en: 'Background, skin, sound and notation', ru: 'Фон, оформление, звук и нотация' })}
          </h1>
          <p className="page-hero__lead">
            {t({
              en: `${FIELDS.length} ${plural(FIELDS.length, lang, SETTINGS)}. Every change is applied at once to this page and its background, and is remembered in this browser only. ${changed} ${plural(changed, lang, SETTINGS)} ${plural(changed, lang, CHANGED)} from the defaults.`,
              ru: `${FIELDS.length} ${plural(FIELDS.length, lang, SETTINGS)}. Каждое изменение сразу применяется к этой странице и её фону и запоминается только в этом браузере. От значений по умолчанию ${plural(changed, lang, CHANGED)} ${changed} ${plural(changed, lang, SETTINGS)}.`,
            })}
          </p>
          <div className="page-hero__actions">
            <button
              type="button"
              className="button button--primary"
              aria-pressed={peek}
              data-sound={peek ? 'close' : 'open'}
              onClick={() => setPeek(!peek)}
            >
              {peek
                ? t({ en: 'Show the settings', ru: 'Показать настройки' })
                : t({ en: 'Look at the background', ru: 'Посмотреть на фон' })}
            </button>
            <button type="button" className="button" onClick={() => resetSettings()} disabled={!changed}>
              {t({ en: 'Reset everything', ru: 'Сбросить всё' })}
            </button>
          </div>
        </header>

        <Presets settings={settings} />

        <div className="settings__groups">
          {COLUMNS.map((column) => (
            <div key={column} className="settings__column">
              {sections
                .filter((section) => (section.column || 1) === column)
                .map((section) => (
                  <Group key={section.id} section={section} settings={settings} />
                ))}
            </div>
          ))}

          <section id="share" className="settings__group settings__share" aria-labelledby="share-title">
            <header className="settings__head">
              <h2 id="share-title">{t({ en: 'Your changes', ru: 'Ваши изменения' })}</h2>
            </header>
            <p className="settings__lead">
              {t({
                en: 'Only what differs from the defaults, as JSON: copy it to move the settings to another browser or to suggest better defaults.',
                ru: 'Только то, что отличается от значений по умолчанию, в виде JSON: скопируйте, чтобы перенести настройки в другой браузер или предложить лучшие значения по умолчанию.',
              })}
            </p>
            <pre className="settings__json mono" aria-label={t({ en: 'Changed settings', ru: 'Изменённые настройки' })}>
              {json}
            </pre>
            <div className="page-hero__actions">
              <button type="button" className="button" onClick={copy} disabled={!changed}>
                {t({ en: 'Copy', ru: 'Скопировать' })}
              </button>
            </div>
            <label className="settings__import">
              {t({
                en: 'Paste settings or saved looks to load them',
                ru: 'Вставьте настройки или сохранённые виды, чтобы загрузить их',
              })}
              <textarea className="mono" rows={4} value={draft} onChange={(event) => setDraft(event.target.value)} />
            </label>
            <div className="page-hero__actions">
              <button type="button" className="button" onClick={load} disabled={!draft.trim()}>
                {t({ en: 'Load', ru: 'Загрузить' })}
              </button>
              <span role="status" className="settings__status">
                {status}
              </span>
            </div>
          </section>
        </div>
      </div>
      {peek && (
        <button
          type="button"
          className="button button--primary settings__back"
          data-sound="close"
          onClick={() => setPeek(false)}
        >
          {t({ en: 'Show the settings', ru: 'Показать настройки' })}
        </button>
      )}
    </Layout>
  );
}
