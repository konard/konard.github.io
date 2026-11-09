import { localized } from '../i18n/localizer.js';
import { useState, useSyncExternalStore } from 'react';
import './presets.css';
import { useLang } from '../i18n/prefs';
import { PALETTES } from '../settings/schema';
import {
  PRESETS,
  applyLook,
  cleanLook,
  getSaved,
  isLook,
  presetsText,
  randomLook,
  renamed,
  setSaved,
  shareLink,
  subscribeSaved,
  withSaved,
  withoutSaved,
} from '../settings/presets';
import { changesOf, setSettings } from '../settings/store';
import { cue } from '../sound/options';
import { Pencil, Save, X } from 'lucide-react';
import { iconProps } from '../components/icons';

const NEON = Object.fromEntries(PALETTES.map(([id, , , neon]) => [id, neon]));

// Fixed places for the stars and the drops of the miniatures, so they do not jump between renders.
const PLACES = Array.from({ length: 9 }, (_, i) => [(i * 37 + 9) % 94, (i * 53 + 17) % 88]);
const DROPS = [14, 38, 62, 86];

const clipOf = {
  chamfer: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
  octagon:
    'polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)',
  kranox: 'polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px))',
};

/**
 * A miniature of a look, drawn with CSS from its settings: the colours of the
 * universe, the grid, the star layers, the rain of links, the beams and a panel
 * of the skin with its corners and accent colour.
 */
export function Miniature({ settings: s }) {
  const future = s['skin.name'] === 'futuristic';
  const accent = future ? NEON[s['future.palette']] : 'var(--theme-accent)';
  const gridColour =
    { theme: 'var(--border-strong)', accent, accent2: 'var(--accent-2)' }[s['grid.tint']] || s['grid.color'];
  const nebula = s['nebula.on']
    ? [1, 2, 3]
        .map((n, i) => {
          const alpha = Math.round(Math.min(1, s['nebula.level'] * (0.6 + s['nebula.gas'] * 0.4)) * 200);
          const place = ['20% 30%', '78% 25%', '55% 85%'][i];
          return `radial-gradient(circle at ${place}, ${s[`nebula.color${n}`]}${alpha.toString(16).padStart(2, '0')}, transparent 55%)`;
        })
        .join(', ')
    : 'none';
  const cell = Math.max(6, s['grid.size'] / 5);
  const grid =
    s['grid.style'] === 'dots' || s['grid.style'] === 'crosses'
      ? `radial-gradient(circle, ${gridColour} 1px, transparent 1.5px)`
      : `linear-gradient(${gridColour} 1px, transparent 1px), linear-gradient(90deg, ${gridColour} 1px, transparent 1px)`;
  const stars = [1, 2, 3, 4].filter((n) => s[`stars${n}.on`]);
  const radius = future ? 0 : Math.round((s['skin.name'] === 'liquid' ? s['liquid.radius'] : s['glass.radius']) / 3);
  return (
    <span className="preset__mini" style={{ backgroundImage: nebula }} aria-hidden="true">
      {s['grid.on'] && (
        <span
          className="preset__grid"
          style={{
            backgroundImage: grid,
            backgroundSize: `${cell}px ${cell}px`,
            opacity: Math.min(1, 0.3 + s['grid.level'] * 0.5),
          }}
        />
      )}
      {s['nebula.on'] &&
        s['nebula.stars'] > 0 &&
        PLACES.slice(0, 5).map(([x, y]) => (
          <span key={`n${x}`} className="preset__star" style={{ left: `${100 - x}%`, top: `${y}%` }} />
        ))}
      {stars.flatMap((n, layer) =>
        PLACES.slice(layer % 2, 9 - layer).map(([x, y], i) => {
          const warp = s[`stars${n}.motion`] === 'warp' || s[`stars${n}.streak`] > 0;
          const size = Math.min(5, 1 + s[`stars${n}.size`] / 3);
          const angle = (Math.atan2(y - 50, x - 50) * 180) / Math.PI;
          return (
            <span
              key={`${n}-${i}`}
              className="preset__star"
              style={{
                left: `${(x + layer * 13) % 96}%`,
                top: `${(y + layer * 29) % 92}%`,
                width: warp ? `${size * 4}px` : `${size}px`,
                height: `${size}px`,
                background: s[`stars${n}.color`],
                boxShadow: s[`stars${n}.glow`]
                  ? `0 0 ${s[`stars${n}.glow`] / 3}px ${s[`stars${n}.glowColor`]}`
                  : 'none',
                transform: warp ? `rotate(${angle}deg)` : undefined,
              }}
            />
          );
        }),
      )}
      {s['rain.on'] &&
        DROPS.map((x, i) => (
          <span
            key={x}
            className="preset__drop"
            style={{
              left: `${x}%`,
              top: `${(i * 23) % 50}%`,
              height: `${30 + ((i * 17) % 30)}%`,
              opacity: Math.min(1, 0.35 + s['rain.level'] * 0.5),
              color: s['rain.glowColor'],
              boxShadow: s['rain.glow'] ? `0 0 ${Math.min(6, s['rain.glow'] / 2)}px currentColor` : 'none',
            }}
          />
        ))}
      {s['beams.on'] && <span className="preset__beam" style={{ color: s['beams.color'] }} />}
      <span
        className={`preset__panel preset__panel--${s['skin.name']}`}
        style={{
          borderRadius: `${radius}px`,
          borderColor: future ? accent : undefined,
          clipPath: future ? clipOf[s['future.frame']] : undefined,
          '--mini-accent': accent,
        }}
      />
    </span>
  );
}

const useSaved = () => useSyncExternalStore(subscribeSaved, getSaved, getSaved);

/**
 * Presets (issue #15: "ability also to have multiple presets, saved and so
 * on"): the looks of the site, the looks saved in this browser, a random look
 * and a link that carries the current look. A look changes the background, the
 * skin and the sounds, never the motion, the volume or the notation.
 */
export default function Presets({ settings }) {
  const { t } = useLang();
  const saved = useSaved();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [newName, setNewName] = useState('');
  const [status, setState] = useState('');
  const [link, setLink] = useState('');
  const say = (message) => {
    setState(message);
    cue('notify');
  };
  const use = (look) => setSettings(applyLook(look, settings));
  const current = cleanLook(changesOf(settings));

  const save = () => {
    const title = name.trim() || `${t(localized('m693e4d861656'))} ${saved.length + 1}`;
    const kept = setSaved(withSaved(saved, title, current));
    setName('');
    say(kept ? t({ en: `Saved as “${title}”.`, ru: `Сохранено как «${title}».` }) : t(localized('medd2296f64de')));
  };
  const copy = async (text, done) => {
    try {
      await navigator.clipboard.writeText(text);
      say(done);
      return true;
    } catch {
      say(t(localized('m68eb5e60f577')));
      return false;
    }
  };
  const copyLink = async () => {
    const url = shareLink(settings, window.location.href);
    if (!(await copy(url, t(localized('mf24b0e3f102a'))))) setLink(url);
  };
  const rename = (from) => {
    setSaved(renamed(saved, from, newName));
    setEditing(null);
  };

  return (
    <section id="presets" className="settings__group settings__presets" aria-labelledby="presets-title">
      <header className="settings__head">
        <h2 id="presets-title">{t(localized('mc14b9e9ec1af'))}</h2>
        <div className="settings__head-actions">
          <button
            type="button"
            className="button button--small"
            onClick={() => {
              use(randomLook());
              say(t(localized('m32fdf70bfe40')));
            }}
          >
            {t(localized('md691fa1a697c'))}
          </button>
          <button type="button" className="button button--small" onClick={copyLink}>
            {t(localized('m508a89b4b213'))}
          </button>
        </div>
      </header>
      <p className="settings__lead">{t(localized('m01a35d7c3b96'))}</p>
      {link && (
        <input
          className="settings__link mono"
          readOnly
          value={link}
          aria-label={t(localized('m915deaf92e6e'))}
          onFocus={(event) => event.target.select()}
        />
      )}
      <ul className="presets" aria-label={t(localized('mf3611f728588'))}>
        {PRESETS.map((preset) => (
          <li key={preset.id}>
            <button
              type="button"
              className="preset"
              title={t(preset.text)}
              aria-pressed={isLook(preset.look, settings)}
              onClick={() => use(preset.look)}
            >
              <Miniature settings={applyLook(preset.look, settings)} />
              <span className="preset__name">{t(preset.name)}</span>
              <span className="preset__text">{t(preset.text)}</span>
            </button>
          </li>
        ))}
      </ul>

      <h3 className="settings__subtitle">{t(localized('m9807b186f6c3'))}</h3>
      <form
        className="presets__save"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <input
          type="text"
          value={name}
          maxLength={60}
          placeholder={t(localized('mff78983648a6'))}
          aria-label={t(localized('mff78983648a6'))}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit" className="button button--primary button--small">
          {t(localized('me467ad9c5208'))}
        </button>
      </form>
      {saved.length > 0 ? (
        <ul className="presets presets--saved" aria-label={t(localized('m1d5b1f992910'))}>
          {saved.map((item) => (
            <li key={item.name} className="preset preset--saved">
              <button
                type="button"
                className="preset__use"
                aria-pressed={isLook(item.look, settings)}
                onClick={() => use(item.look)}
              >
                <Miniature settings={applyLook(item.look, settings)} />
                {editing !== item.name && <span className="preset__name">{item.name}</span>}
              </button>
              {editing === item.name ? (
                <form
                  className="presets__rename"
                  onSubmit={(event) => {
                    event.preventDefault();
                    rename(item.name);
                  }}
                >
                  <input
                    type="text"
                    value={newName}
                    maxLength={60}
                    autoFocus
                    aria-label={t(localized('m81b4f7932b5a'))}
                    onChange={(event) => setNewName(event.target.value)}
                    onKeyDown={(event) => event.key === 'Escape' && setEditing(null)}
                  />
                  <button type="submit" className="button button--small">
                    OK
                  </button>
                </form>
              ) : (
                <span className="preset__actions">
                  <button
                    type="button"
                    className="setting__reset"
                    title={t(localized('m4c677f41d877'))}
                    aria-label={`${t(localized('m4c677f41d877'))}: ${item.name}`}
                    onClick={() => {
                      setSaved(withSaved(saved, item.name, current));
                      say(t({ en: `“${item.name}” is updated.`, ru: `«${item.name}» обновлён.` }));
                    }}
                  >
                    <Save {...iconProps} />
                  </button>
                  <button
                    type="button"
                    className="setting__reset"
                    title={t(localized('mec3f0a2b2f00'))}
                    aria-label={`${t(localized('mec3f0a2b2f00'))}: ${item.name}`}
                    onClick={() => {
                      setEditing(item.name);
                      setNewName(item.name);
                    }}
                  >
                    <Pencil {...iconProps} />
                  </button>
                  <button
                    type="button"
                    className="setting__reset"
                    title={t(localized('mfd6f4e7e7232'))}
                    aria-label={`${t(localized('mfd6f4e7e7232'))}: ${item.name}`}
                    onClick={() => {
                      setSaved(withoutSaved(saved, item.name));
                      say(t({ en: `“${item.name}” is deleted.`, ru: `«${item.name}» удалён.` }));
                    }}
                  >
                    <X {...iconProps} />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="settings__lead">{t(localized('m7775314a6644'))}</p>
      )}
      <div className="page-hero__actions">
        {saved.length > 0 && (
          <button
            type="button"
            className="button button--small"
            onClick={() => copy(presetsText(saved), t(localized('me96cd2a0ac6e')))}
          >
            {t(localized('m4b99c37a9d4a'))}
          </button>
        )}
        <span role="status" className="settings__status">
          {status}
        </span>
      </div>
    </section>
  );
}
