import { LANGS, THEMES, useLang, useTheme } from '../i18n/prefs';
import { setSettings, useSettings } from '../settings/store';

const THEME_LABELS = {
  auto: { en: 'Theme: system', ru: 'Тема: системная', icon: '◐' },
  light: { en: 'Theme: light', ru: 'Тема: светлая', icon: '☀' },
  dark: { en: 'Theme: dark', ru: 'Тема: тёмная', icon: '☾' },
};

/**
 * Language (EN / RU), sound (issue #15) and theme (system → light → dark)
 * switches of the top bar; all choices are remembered.
 */
export default function PrefSwitches() {
  const { lang, setLang, t } = useLang();
  const { theme, setTheme } = useTheme();
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  const sound = useSettings()['sound.on'];
  return (
    <div className="prefs">
      <div className="prefs__langs" role="group" aria-label={t({ en: 'Language', ru: 'Язык' })}>
        {LANGS.map((code) => (
          <button
            key={code}
            type="button"
            className="prefs__button mono"
            aria-pressed={code === lang}
            lang={code}
            onClick={() => setLang(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="prefs__button prefs__sound"
        aria-pressed={sound}
        aria-label={t({ en: 'Sounds of the interface', ru: 'Звуки интерфейса' })}
        title={t(sound ? { en: 'Sound: on', ru: 'Звук: включён' } : { en: 'Sound: off', ru: 'Звук: выключен' })}
        onClick={() => setSettings({ 'sound.on': !sound })}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 6h3l4-3v10l-4-3H2z" />
          {sound ? (
            <path className="prefs__waves" d="M11 5.5q1.5 2.5 0 5M12.8 3.8q3 4.2 0 8.4" />
          ) : (
            <path className="prefs__waves" d="M11 6l4 4M15 6l-4 4" />
          )}
        </svg>
      </button>
      <button
        type="button"
        className="prefs__button prefs__theme"
        aria-label={`${t(THEME_LABELS[theme])}. ${t({ en: 'Switch to', ru: 'Переключить на' })}: ${t(THEME_LABELS[next]).split(': ')[1]}`}
        title={t(THEME_LABELS[theme])}
        data-theme-choice={theme}
        onClick={() => setTheme(next)}
      >
        <span aria-hidden="true">{THEME_LABELS[theme].icon}</span>
      </button>
    </div>
  );
}
