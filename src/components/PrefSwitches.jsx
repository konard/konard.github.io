import { Moon, Orbit, Pause, Sun, SunMoon, Volume2, VolumeX } from 'lucide-react';
import { LANGS, THEMES, useLang, useTheme } from '../i18n/prefs';
import { setSettings, useSettings } from '../settings/store';
import { moves } from './Cosmos';
import { iconProps } from './icons';

const THEME_LABELS = {
  auto: { en: 'Theme: system', ru: 'Тема: системная', Icon: SunMoon },
  light: { en: 'Theme: light', ru: 'Тема: светлая', Icon: Sun },
  dark: { en: 'Theme: dark', ru: 'Тема: тёмная', Icon: Moon },
};

/**
 * Language (EN / RU), sound (issue #15), animations (issue #47) and theme
 * (system → light → dark) switches of the top bar; all choices are remembered.
 */
export default function PrefSwitches() {
  const { lang, setLang, t } = useLang();
  const { theme, setTheme } = useTheme();
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  const settings = useSettings();
  const sound = settings['sound.on'];
  // On while anything moves: the system preference decides only until the button is pressed.
  const motion = moves(settings['motion.mode']);
  const ThemeIcon = THEME_LABELS[theme].Icon;
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
        {sound ? <Volume2 {...iconProps} /> : <VolumeX {...iconProps} />}
      </button>
      <button
        type="button"
        className="prefs__button prefs__motion"
        aria-pressed={motion}
        aria-label={t({ en: 'Animations', ru: 'Анимации' })}
        title={t(
          motion
            ? { en: 'Animations: on', ru: 'Анимации: включены' }
            : { en: 'Animations: off', ru: 'Анимации: выключены' },
        )}
        onClick={() => setSettings({ 'motion.mode': motion ? 'off' : 'on' })}
      >
        {motion ? <Orbit {...iconProps} /> : <Pause {...iconProps} />}
      </button>
      <button
        type="button"
        className="prefs__button prefs__theme"
        aria-label={`${t(THEME_LABELS[theme])}. ${t({ en: 'Switch to', ru: 'Переключить на' })}: ${t(THEME_LABELS[next]).split(': ')[1]}`}
        title={t(THEME_LABELS[theme])}
        data-theme-choice={theme}
        onClick={() => setTheme(next)}
      >
        <ThemeIcon {...iconProps} />
      </button>
    </div>
  );
}
