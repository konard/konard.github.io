import { localized } from '../i18n/localizer.js';
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
  const [text, setText] = useState(t(localized('m27ec8d25ad33')));
  const [scale, setScale] = useState('log');
  return (
    <details className="ui-samples" open>
      <summary>{t(localized('m472964dbe427'))}</summary>
      <p className="ui-samples__lead">{t(localized('m73050ba3a1da'))}</p>
      {/* The samples count as outer panels though the settings panel holds them (issue #45). */}
      <div className="ui-samples__grid" data-frame-root>
        <Sample name="panel">
          <article className="card ui-samples__panel">
            <h3>{t(localized('m342cec16ad8c'))}</h3>
            <p>
              {t(localized('m854f95e4d1e5'))}
              <a href="#interface">{t(localized('mdb73b28fdd26'))}</a>.
            </p>
            <ul className="ui-samples__repos">
              <li className="repo">
                <strong>{t(localized('m58869d304e6e'))}</strong>
                <span>{t(localized('m392720dc5d6a'))}</span>
              </li>
            </ul>
          </article>
        </Sample>
        <Sample name="position">
          <ol className="positions ui-samples__positions">
            <li className="position position--company">
              <span className="position__period mono">2026 — {t(localized('m447363b7545d'))}</span>
              <h3 className="position__title">
                <span>{t(localized('m47f68dc3bac4'))}</span>
              </h3>
              <span className="position__role">{t(localized('m5448753f87d4'))}</span>
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
              <span className="stat__label">{t(localized('maf0589d7bbb0'))}</span>
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
              {t(localized('m37e346e0beb7'))}
            </button>
            <button type="button" className="button button--primary">
              {t(localized('m2ec501ec1e20'))}
            </button>
            <button type="button" className="button button--small">
              {t(localized('m91ac68d60720'))}
            </button>
            <button type="button" aria-pressed={pressed} onClick={() => setPressed(!pressed)}>
              {t(localized('mf54a77873749'))}
            </button>
            <button type="button" disabled>
              {t(localized('m4a579e377666'))}
            </button>
            <a className="button" href="#interface">
              {t(localized('m76d188f2ac33'))}
            </a>
          </div>
        </Sample>
        <Sample name="fields" wide>
          <div className="ui-samples__row">
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-label={t(localized('m6f8342f8a6c6'))}
            />
            <Select
              aria-label={t(localized('m67c82fbb2931'))}
              value="one"
              className="ui-samples__select"
              onChange={() => {}}
            >
              <option value="one">{t(localized('m8ed4c60db531'))}</option>
              <option value="two">{t(localized('md3c85054e79b'))}</option>
            </Select>
            <ColorInput
              value={color}
              onChange={(event) => setColor(event.target.value)}
              aria-label={t(localized('m5843453153e1'))}
            />
            <label className="ui-samples__check">
              <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
              {t(localized('mce4c9a4d5d32'))}
            </label>
            <input
              id="ui-samples-slider"
              type="range"
              min="0"
              max="100"
              value={level}
              onChange={(event) => setLevel(Number(event.target.value))}
              aria-label={t(localized('m1b2c86d7cbda'))}
            />
          </div>
        </Sample>
        <Sample name="textarea">
          <textarea
            className="ui-samples__textarea"
            rows={3}
            readOnly
            aria-label={t(localized('mace4baab566f'))}
            value={`{\n  "${t(localized('m9077d7e86cd3'))}": true,\n  "long": "${LONG}"\n}`}
          />
        </Sample>
        <Sample name="chips">
          <div className="ui-samples__row">
            <ul className="tags">
              <li>{t(localized('m8bbb71290374'))}</li>
              <li>{t(localized('m81785302de35'))}</li>
            </ul>
            <nav className="chips" aria-label={t(localized('m817b1aa0b058'))}>
              <a className="chip" href="#interface">
                {t(localized('m5bc785deb7d7'))}
              </a>
            </nav>
          </div>
        </Sample>
        <Sample name="tabs">
          <div className="ui-samples__row">
            <div className="segmented" role="group" aria-label={t(localized('mfce3441e83ed'))}>
              {['log', 'linear'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={scale === s ? 'is-active' : ''}
                  aria-pressed={scale === s}
                  onClick={() => setScale(s)}
                >
                  {s === 'log' ? t(localized('mc0886426ad62')) : t(localized('m4ecff54a5b00'))}
                </button>
              ))}
            </div>
            <ul className="role-tabs">
              <li>
                <a href="#interface" aria-current="page">
                  {t(localized('m289b5e78bebe'))}
                </a>
              </li>
              <li>
                <a href="#interface">{t(localized('m6f65753a6194'))}</a>
              </li>
            </ul>
          </div>
        </Sample>
        <Sample name="table">
          <table className="ui-samples__table">
            <thead>
              <tr>
                <th>{t(localized('m408be26c7b32'))}</th>
                <th>{t(localized('mef29096ce272'))}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t(localized('m0425c5ff9311'))}</td>
                <td className="mono">1 · 2 · 3</td>
              </tr>
            </tbody>
          </table>
        </Sample>
      </div>
    </details>
  );
}
