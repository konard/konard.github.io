import { useState } from 'react';
import ColorInput from '../components/ColorInput';
import Select from '../components/Select';
import { useLang } from '../i18n/prefs';

// Small samples of every bordered element of the site (issue #45: "we should be
// able to render small samples of each UI/UX elements" to catch glitches). They
// use the real class names, so the skins style them exactly as on the pages:
// outer panels with inner blocks, a position with its colour bar, a stat with
// its strip, buttons in every state, fields, chips, tabs, a table and panels
// whose content does not fit. experiments/issue-45-samples.mjs screenshots
// them for every frame and checks them in a browser.

const LONG =
  'https://github.com/konard/konard.github.io/blob/main/src/a-very-long-unbreakable-path-that-does-not-fit.js';

/** One labelled sample in the grid. */
function Sample({ name, children, wide }) {
  return (
    <figure className={`ui-samples__item${wide ? ' ui-samples__item--wide' : ''}`} data-sample={name}>
      {children}
      <figcaption className="ui-samples__name mono">{name}</figcaption>
    </figure>
  );
}

export default function UiSamples() {
  const { t } = useLang();
  const [pressed, setPressed] = useState(true);
  const [checked, setChecked] = useState(true);
  const [level, setLevel] = useState(40);
  const [color, setColor] = useState('#17de1d');
  const [text, setText] = useState(t({ en: 'Text field', ru: 'Текстовое поле' }));
  const [scale, setScale] = useState('log');
  return (
    <details className="ui-samples" open>
      <summary>{t({ en: 'Samples of every element', ru: 'Образцы всех элементов' })}</summary>
      <p className="ui-samples__lead">
        {t({
          en: 'Every bordered element of the site in a small size: change the frame, the corners and the borders and look here for glitches.',
          ru: 'Все элементы с рамками в малом размере: меняйте рамку, углы и границы и ищите здесь огрехи.',
        })}
      </p>
      {/* The samples count as outer panels though the settings panel holds them (issue #45). */}
      <div className="ui-samples__grid" data-frame-root>
        <Sample name="panel">
          <article className="card ui-samples__panel">
            <h3>{t({ en: 'Outer panel', ru: 'Внешняя панель' })}</h3>
            <p>
              {t({ en: 'Text with a ', ru: 'Текст со ' })}
              <a href="#interface">{t({ en: 'link', ru: 'ссылкой' })}</a>.
            </p>
            <ul className="ui-samples__repos">
              <li className="repo">
                <strong>{t({ en: 'Inner block', ru: 'Внутренний блок' })}</strong>
                <span>{t({ en: 'with the same corners', ru: 'с теми же углами' })}</span>
              </li>
            </ul>
          </article>
        </Sample>
        <Sample name="position">
          <ol className="positions ui-samples__positions">
            <li className="position position--company">
              <span className="position__period mono">2026 — {t({ en: 'present', ru: 'сейчас' })}</span>
              <h3 className="position__title">
                <span>{t({ en: 'Position', ru: 'Должность' })}</span>
              </h3>
              <span className="position__role">{t({ en: 'Colour bar on the left', ru: 'Цветная полоса слева' })}</span>
              <ul className="tags">
                <li>React</li>
                <li>CSS</li>
              </ul>
            </li>
          </ol>
        </Sample>
        <Sample name="stat">
          <ul className="stats ui-samples__stats">
            <li className="stat">
              <span className="stat__value">1 234</span>
              <span className="stat__label">{t({ en: 'Stat with a strip', ru: 'Число с полосой' })}</span>
            </li>
          </ul>
        </Sample>
        <Sample name="overflow">
          <div className="card ui-samples__overflow">
            <p className="mono">{LONG}</p>
            <pre>{'{ "a very long line of code that is wider than the panel": true }'}</pre>
          </div>
        </Sample>
        <Sample name="buttons" wide>
          <div className="ui-samples__row">
            <button type="button" className="button">
              {t({ en: 'Button', ru: 'Кнопка' })}
            </button>
            <button type="button" className="button button--primary">
              {t({ en: 'Primary', ru: 'Главная' })}
            </button>
            <button type="button" className="button button--small">
              {t({ en: 'Small', ru: 'Малая' })}
            </button>
            <button type="button" aria-pressed={pressed} onClick={() => setPressed(!pressed)}>
              {t({ en: 'Toggle', ru: 'Переключатель' })}
            </button>
            <button type="button" disabled>
              {t({ en: 'Disabled', ru: 'Отключена' })}
            </button>
            <a className="button" href="#interface">
              {t({ en: 'Link button', ru: 'Ссылка-кнопка' })}
            </a>
          </div>
        </Sample>
        <Sample name="fields" wide>
          <div className="ui-samples__row">
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-label={t({ en: 'Sample text field', ru: 'Пример текстового поля' })}
            />
            <Select
              aria-label={t({ en: 'Sample menu', ru: 'Пример меню' })}
              value="one"
              className="ui-samples__select"
              onChange={() => {}}
            >
              <option value="one">{t({ en: 'Menu', ru: 'Меню' })}</option>
              <option value="two">{t({ en: 'Second', ru: 'Второй' })}</option>
            </Select>
            <ColorInput
              value={color}
              onChange={(event) => setColor(event.target.value)}
              aria-label={t({ en: 'Sample colour', ru: 'Пример цвета' })}
            />
            <label className="ui-samples__check">
              <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
              {t({ en: 'Checkbox', ru: 'Флажок' })}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={level}
              onChange={(event) => setLevel(Number(event.target.value))}
              aria-label={t({ en: 'Sample slider', ru: 'Пример бегунка' })}
            />
          </div>
        </Sample>
        <Sample name="textarea">
          <textarea
            className="ui-samples__textarea"
            rows={3}
            readOnly
            aria-label={t({ en: 'Sample text area', ru: 'Пример многострочного поля' })}
            value={`{\n  "${t({ en: 'selected text', ru: 'выделенный текст' })}": true,\n  "long": "${LONG}"\n}`}
          />
        </Sample>
        <Sample name="chips">
          <div className="ui-samples__row">
            <ul className="tags">
              <li>{t({ en: 'tag', ru: 'метка' })}</li>
              <li>{t({ en: 'another tag', ru: 'ещё метка' })}</li>
            </ul>
            <nav className="chips" aria-label={t({ en: 'Sample chips', ru: 'Пример чипов' })}>
              <a className="chip" href="#interface">
                {t({ en: 'chip', ru: 'чип' })}
              </a>
            </nav>
          </div>
        </Sample>
        <Sample name="tabs">
          <div className="ui-samples__row">
            <div className="segmented" role="group" aria-label={t({ en: 'Sample switch', ru: 'Пример переключателя' })}>
              {['log', 'linear'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={scale === s ? 'is-active' : ''}
                  aria-pressed={scale === s}
                  onClick={() => setScale(s)}
                >
                  {s === 'log' ? t({ en: 'Log', ru: 'Лог.' }) : t({ en: 'Linear', ru: 'Линейная' })}
                </button>
              ))}
            </div>
            <ul className="role-tabs">
              <li>
                <a href="#interface" aria-current="page">
                  {t({ en: 'Current', ru: 'Текущая' })}
                </a>
              </li>
              <li>
                <a href="#interface">{t({ en: 'Tab', ru: 'Вкладка' })}</a>
              </li>
            </ul>
          </div>
        </Sample>
        <Sample name="table">
          <table className="ui-samples__table">
            <thead>
              <tr>
                <th>{t({ en: 'Element', ru: 'Элемент' })}</th>
                <th>{t({ en: 'Value', ru: 'Значение' })}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t({ en: 'Row', ru: 'Строка' })}</td>
                <td className="mono">1 · 2 · 3</td>
              </tr>
            </tbody>
          </table>
        </Sample>
      </div>
    </details>
  );
}
