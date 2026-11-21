import { localized } from '../i18n/localizer.js';
import InterfacePreview, { MaterialPresets } from './InterfacePreview';
import UiSamples from './UiSamples';
import ColorInput from '../components/ColorInput';
import Select from '../components/Select';
import { useState } from 'react';
import './settings.css';
import Layout from '../components/Layout';
import { previewSound } from '../components/Sound';
import { CornerTiles, SameCorners } from './CornerTiles';
import LevelPreview from './LevelPreview';
import Presets from './Presets';
import { placeSections } from './settingsColumns';
import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { getSaved, readPasted, setSaved, withImported } from '../settings/presets';
import { formatValue } from '../settings/fields';
import { DEFAULTS, FIELDS, PALETTES, SECTIONS } from '../settings/schema';
import { ownsCorners } from '../settings/schema.skins';
import { changesOf, resetSettings, setSettings, settingsText, useSettings } from '../settings/store';
import { cue } from '../sound/options';
import { focusSlider, numericKey } from '../components/numericKeys';
import { Play, RotateCcw } from 'lucide-react';
import { iconProps } from '../components/icons';

const SETTINGS = { en: ['setting', 'settings'], ru: ['настройка', 'настройки', 'настроек'] };
const CHANGED = { en: ['differs', 'differ'], ru: ['отличается', 'отличаются', 'отличаются'] };

export { formatValue };

// Two explicit columns instead of CSS multi-column layout (issue #15): with
// multicol the browser rebalanced the sections whenever the skin section
// changed size, so Skin jumped between the columns, and Safari laid them out in
// one column or with uneven tops. The sections fill the shorter column in order
// (issue #49: the right column was 5519px longer than the left one), see
// ./settingsColumns.js.

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
        onPointerDown={focusSlider}
        onClick={focusSlider}
        onKeyDown={(event) => numericKey(event, set)}
        onChange={(event) => set(Number(event.target.value))}
      />
    );
    shown = formatValue(field, value);
  } else if (field.type === 'toggle') {
    input = <input id={id} type="checkbox" checked={value} onChange={(event) => set(event.target.checked)} />;
  } else if (field.type === 'color') {
    input = <ColorInput label={t(field.label)} id={id} value={value} onChange={(event) => set(event.target.value)} />;
    shown = value;
  } else if (field.tiles) {
    input = <CornerTiles field={field} value={value} settings={settings} labelId={`${id}-label`} />;
  } else {
    input = (
      <Select id={id} value={value} onChange={(event) => set(event.target.value)}>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.label)}
          </option>
        ))}
      </Select>
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
            title={t(localized('mef9cdc7c629e'))}
            aria-label={`${t(localized('mef9cdc7c629e'))}: ${t(field.label)}`}
          >
            <Play {...iconProps} />
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
        title={t(localized('mb156711b9597'))}
        aria-label={`${t(localized('mb156711b9597'))}: ${t(field.label)}`}
      >
        <RotateCcw {...iconProps} />
      </button>
      {field.hint && <small className="setting__hint">{t(field.hint)}</small>}
    </li>
  );
}

/** Colour chips of the futuristic palettes, a faster way to pick one. */
function Palettes({ value }) {
  const { t } = useLang();
  return (
    <div className="palettes" role="group" aria-label={t(localized('me7b18625be67'))}>
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
        >
          <i className="swatch" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/**
 * Tabs of a section with layers (the star layers, corners and sounds of issue
 * #15) or with levels (the corners of issue #47); a dot marks a layer that is
 * on or a level with corners of its own.
 */
function Tabs({ section, settings, tab, onChange, items = section.tabs, prefix = 'tab', controls, label, isOn }) {
  const { t } = useLang();
  return (
    <div className="settings__tabs" role="tablist" aria-label={label ?? t(section.title)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          id={`${prefix}-${item.id}`}
          aria-selected={tab === item.id}
          aria-controls={controls ?? `${section.id}-fields`}
          className={`settings__tab${(isOn ? isOn(item.id) : settings[item.on]) ? ' is-on' : ''}`}
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
  const [level, setLevel] = useState(section.levels?.[0].id);
  const keys = section.fields.map((field) => field.key);
  const changed = keys.filter((key) => settings[key] !== DEFAULTS[key]).length;
  // A field may belong to a level (one or several) and a tab, and may apply
  // only to some values of other fields.
  const inLevel = (field) => !section.levels || [].concat(field.level ?? section.levels[0].id).includes(level);
  const shown = (field) => inLevel(field) && (!field.when || field.when(settings, level));
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
          {t(localized('m1273fbb7d339'))}
        </button>
      </header>
      {section.lead && <p className="settings__lead">{t(section.lead)}</p>}
      {section.id === 'interface' && <InterfacePreview />}
      {section.id === 'interface' && <UiSamples />}
      {['glass', 'liquid'].includes(section.id) && <MaterialPresets />}
      {section.id === 'futuristic' && <Palettes value={settings['future.palette']} />}
      {section.levels && (
        <Tabs
          section={section}
          settings={settings}
          tab={level}
          onChange={setLevel}
          items={section.levels}
          prefix="level"
          controls={`${section.id}-level`}
          label={t(localized('ma68fcc7f03e7'))}
          isOn={(id) => id !== section.levels[0].id && ownsCorners(id, settings)}
        />
      )}
      {/* Issue #49: the samples of the chosen level stay in sight while its settings scroll. */}
      {section.id === 'corners' && <LevelPreview level={level} />}
      <div
        {...(section.levels && { id: `${section.id}-level`, role: 'tabpanel', 'aria-labelledby': `level-${level}` })}
      >
        {tabbed ? (
          <>
            {shared.length > 0 && list(shared)}
            <Tabs section={section} settings={settings} tab={tab} onChange={setTab} />
            {list(inTab, { id: `${section.id}-fields`, role: 'tabpanel', 'aria-labelledby': `tab-${tab}` })}
          </>
        ) : (
          list(shared, { id: `${section.id}-fields` })
        )}
        {section.id === 'corners' && <SameCorners level={level} corner={tab} settings={settings} />}
      </div>
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
  // Links Notation instead of JSON (issue #47): `settings:` and one `key value` per line.
  const text = settingsText(changes);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(t(localized('m099775f5ff02')));
    } catch {
      setStatus(t(localized('mab1de18eeab5')));
    }
  };
  const load = () => {
    try {
      const pasted = readPasted(draft);
      if (pasted.presets) {
        // Looks copied from "Presets" in another browser.
        setSaved(withImported(getSaved(), pasted.presets));
        setStatus(t(localized('mcabea3631f5f')));
      } else {
        setSettings({ ...DEFAULTS, ...pasted.settings });
        setStatus(t(localized('mfd05baf40a9c')));
      }
      setDraft('');
    } catch {
      setStatus(t(localized('mb1554300632a')));
    }
  };

  return (
    <Layout
      page="settings"
      sections={[['presets', localized('mc14b9e9ec1af')], ...sections.map((section) => [section.id, section.title])]}
    >
      <div className={`settings${peek ? ' settings--peek' : ''}`}>
        <header className="page-hero" id="top">
          <p className="section__kicker">{t(localized('m36a930702b39'))}</p>
          <h1 className="page-hero__title">{t(localized('mbca00302147f'))}</h1>
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
              {peek ? t(localized('m3774e2d8c501')) : t(localized('mf594a7dc60ff'))}
            </button>
            <button type="button" className="button" onClick={() => resetSettings()} disabled={!changed}>
              {t(localized('m3aa4d524cb35'))}
            </button>
          </div>
        </header>

        <Presets settings={settings} />

        <div className="settings__groups">
          {placeSections(sections).map((column, index) => (
            <div key={index} className="settings__column">
              {column.map((section) => (
                <Group key={section.id} section={section} settings={settings} />
              ))}
            </div>
          ))}

          <section id="share" className="settings__group settings__share" aria-labelledby="share-title">
            <header className="settings__head">
              <h2 id="share-title">{t(localized('m27a7e6efd531'))}</h2>
            </header>
            <p className="settings__lead">{t(localized('m7598dd34ba26'))}</p>
            <pre className="settings__json mono" aria-label={t(localized('m8e8c6d374b01'))}>
              {text}
            </pre>
            <div className="page-hero__actions">
              <button type="button" className="button" onClick={copy} disabled={!changed}>
                {t(localized('m16c143d90f28'))}
              </button>
            </div>
            <label className="settings__import">
              {t(localized('m5cde81733bac'))}
              <textarea className="mono" rows={4} value={draft} onChange={(event) => setDraft(event.target.value)} />
            </label>
            <div className="page-hero__actions">
              <button type="button" className="button" onClick={load} disabled={!draft.trim()}>
                {t(localized('md0cc665eb437'))}
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
          {t(localized('m3774e2d8c501'))}
        </button>
      )}
    </Layout>
  );
}
