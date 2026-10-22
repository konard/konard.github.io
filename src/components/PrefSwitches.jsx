import { LANGS, THEMES, useLang, useTheme } from '../i18n/prefs';

const THEME_LABELS = {
  auto: { en: 'Theme: system', ru: 'Тема: системная', icon: '◐' },
  light: { en: 'Theme: light', ru: 'Тема: светлая', icon: '☀' },
  dark: { en: 'Theme: dark', ru: 'Тема: тёмная', icon: '☾' },
};

/** Language (EN / RU) and theme (system → light → dark) switches of the top bar; both choices are remembered. */
export default function PrefSwitches() {
  const { lang, setLang, t } = useLang();
  const { theme, setTheme } = useTheme();
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
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
