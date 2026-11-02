import Select from '../components/Select';
import { useLang } from '../i18n/prefs';
import { LEVEL_NAMES } from '../settings/schema.skins';

// Issue #49: "in CORNERS OF THE FRAME we should always see the preview of what
// we configuring at the moment right in this panel, so user always sees it".
// The samples of the chosen level stick to the top of the corners section
// while its settings scroll under them. They use the real class names, so the
// frame draws them exactly as on the pages, and they can be hovered, pressed
// and focused to see the borders of every state.

const HREF = '#corners';

/** The samples of each level of the corners section. */
const SAMPLES = {
  panel: (t) => (
    <article className="card level-preview__panel">
      <strong>{t({ en: 'Outer panel', ru: 'Внешняя панель' })}</strong>
    </article>
  ),
  block: (t) => (
    <article className="card level-preview__panel">
      <ul className="level-preview__blocks">
        <li className="repo">{t({ en: 'Inner block', ru: 'Внутренний блок' })}</li>
        <li className="repo">{t({ en: 'Inner block', ru: 'Внутренний блок' })}</li>
      </ul>
    </article>
  ),
  button: (t) => (
    <>
      <button type="button">{t({ en: 'Button', ru: 'Кнопка' })}</button>
      <button type="button" aria-pressed="true">
        {t({ en: 'Pressed', ru: 'Нажата' })}
      </button>
      <button type="button" className="button button--primary">
        {t({ en: 'Primary', ru: 'Главная' })}
      </button>
      <button type="button" disabled>
        {t({ en: 'Disabled', ru: 'Отключена' })}
      </button>
    </>
  ),
  field: (t) => (
    <>
      <input
        type="text"
        readOnly
        value={t({ en: 'Text field', ru: 'Текстовое поле' })}
        aria-label={t({ en: 'Sample text field', ru: 'Пример текстового поля' })}
      />
      <textarea
        rows={1}
        readOnly
        value={t({ en: 'Text area', ru: 'Многострочное поле' })}
        aria-label={t({ en: 'Sample text area', ru: 'Пример многострочного поля' })}
      />
    </>
  ),
  tab: (t) => (
    <>
      <ul className="role-tabs">
        <li>
          <a href={HREF} aria-current="page">
            {t({ en: 'Current', ru: 'Текущая' })}
          </a>
        </li>
        <li>
          <a href={HREF}>{t({ en: 'Tab', ru: 'Вкладка' })}</a>
        </li>
      </ul>
      <div className="segmented" role="group" aria-label={t({ en: 'Sample switch', ru: 'Пример переключателя' })}>
        <button type="button" className="is-active" aria-pressed="true">
          {t({ en: 'On', ru: 'Вкл.' })}
        </button>
        <button type="button" aria-pressed="false">
          {t({ en: 'Off', ru: 'Выкл.' })}
        </button>
      </div>
    </>
  ),
  chip: (t) => (
    <>
      <ul className="tags">
        <li>{t({ en: 'tag', ru: 'метка' })}</li>
        <li>{t({ en: 'another tag', ru: 'ещё метка' })}</li>
      </ul>
      <a className="chip" href={HREF}>
        {t({ en: 'chip', ru: 'чип' })}
      </a>
    </>
  ),
  menu: (t) => (
    <Select
      aria-label={t({ en: 'Sample drop-down list', ru: 'Пример выпадающего списка' })}
      value="one"
      onChange={() => {}}
    >
      <option value="one">{t({ en: 'Drop-down list', ru: 'Выпадающий список' })}</option>
      <option value="two">{t({ en: 'Second', ru: 'Второй' })}</option>
    </Select>
  ),
  nav: (t) => (
    <nav
      className="pages level-preview__menu"
      aria-label={t({ en: 'Sample top-level menu', ru: 'Пример меню верхнего уровня' })}
    >
      <ul>
        <li>
          <a href={HREF} aria-current="page">
            {t({ en: 'Page', ru: 'Страница' })}
          </a>
        </li>
        <li>
          <a href={HREF}>{t({ en: 'Another page', ru: 'Другая страница' })}</a>
        </li>
      </ul>
    </nav>
  ),
  subnav: (t) => (
    <nav
      className="nav level-preview__menu"
      aria-label={t({ en: 'Sample second-level menu', ru: 'Пример меню второго уровня' })}
    >
      <a className="nav__top" href={HREF} aria-label={t({ en: 'To the top', ru: 'Наверх' })}>
        ↑
      </a>
      <ul>
        <li>
          <a href={HREF}>{t({ en: 'Section', ru: 'Раздел' })}</a>
        </li>
        <li>
          <a href={HREF}>{t({ en: 'Another section', ru: 'Другой раздел' })}</a>
        </li>
      </ul>
    </nav>
  ),
  table: (t) => (
    <table className="level-preview__table">
      <tbody>
        <tr>
          <th>{t({ en: 'Row', ru: 'Строка' })}</th>
          <td className="mono">1 · 2 · 3</td>
        </tr>
      </tbody>
    </table>
  ),
};

/** The samples of `level`, always in sight while its settings change. */
export default function LevelPreview({ level }) {
  const { t } = useLang();
  const sample = SAMPLES[level] ?? SAMPLES.panel;
  return (
    <figure
      className="level-preview"
      data-level={level}
      aria-label={`${t({ en: 'Preview', ru: 'Предпросмотр' })}: ${t(LEVEL_NAMES[level])}`}
    >
      {/* The samples count as outer panels though the settings panel holds them (issue #45). */}
      <div className="level-preview__stage" data-frame-root>
        {sample(t)}
      </div>
    </figure>
  );
}

export { SAMPLES };
