import { localized } from '../i18n/localizer.js';
import { ArrowUp } from 'lucide-react';
import { iconProps } from '../components/icons';
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
      <strong>{t(localized('m342cec16ad8c'))}</strong>
    </article>
  ),
  block: (t) => (
    <article className="card level-preview__panel">
      <ul className="level-preview__blocks">
        <li className="repo">{t(localized('m58869d304e6e'))}</li>
        <li className="repo">{t(localized('m58869d304e6e'))}</li>
      </ul>
    </article>
  ),
  button: (t) => (
    <>
      <button type="button">{t(localized('m37e346e0beb7'))}</button>
      <button type="button" aria-pressed="true">
        {t(localized('m9b1d53a1ca95'))}
      </button>
      <button type="button" className="button button--primary">
        {t(localized('m2ec501ec1e20'))}
      </button>
      <button type="button" disabled>
        {t(localized('m4a579e377666'))}
      </button>
    </>
  ),
  field: (t) => (
    <>
      <input type="text" readOnly value={t(localized('m27ec8d25ad33'))} aria-label={t(localized('m6f8342f8a6c6'))} />
      <textarea rows={1} readOnly value={t(localized('m8e3d01b11205'))} aria-label={t(localized('mace4baab566f'))} />
    </>
  ),
  tab: (t) => (
    <>
      <ul className="role-tabs">
        <li>
          <a href={HREF} aria-current="page">
            {t(localized('m289b5e78bebe'))}
          </a>
        </li>
        <li>
          <a href={HREF}>{t(localized('m6f65753a6194'))}</a>
        </li>
      </ul>
      <div className="segmented" role="group" aria-label={t(localized('mfce3441e83ed'))}>
        <button type="button" className="is-active" aria-pressed="true">
          {t(localized('m2483239d9f98'))}
        </button>
        <button type="button" aria-pressed="false">
          {t(localized('m75cfe729f79b'))}
        </button>
      </div>
    </>
  ),
  chip: (t) => (
    <>
      <ul className="tags">
        <li>{t(localized('m8bbb71290374'))}</li>
        <li>{t(localized('m81785302de35'))}</li>
      </ul>
      <a className="chip" href={HREF}>
        {t(localized('m5bc785deb7d7'))}
      </a>
    </>
  ),
  menu: (t) => (
    <Select aria-label={t(localized('m060911ec95de'))} value="one" onChange={() => {}}>
      <option value="one">{t(localized('me6d5297e3a7e'))}</option>
      <option value="two">{t(localized('md3c85054e79b'))}</option>
    </Select>
  ),
  nav: (t) => (
    <nav className="pages level-preview__menu" aria-label={t(localized('mea972207644f'))}>
      <ul>
        <li>
          <a href={HREF} aria-current="page">
            {t(localized('m661395cf1055'))}
          </a>
        </li>
        <li>
          <a href={HREF}>{t(localized('m8fdb470d363f'))}</a>
        </li>
      </ul>
    </nav>
  ),
  subnav: (t) => (
    <nav className="nav level-preview__menu" aria-label={t(localized('m632491349592'))}>
      <a className="nav__top mono" href={HREF} aria-label={t(localized('m55f062eb056a'))}>
        <ArrowUp {...iconProps} />
      </a>
      <ul>
        <li>
          <a href={HREF}>{t(localized('mfad45e576e6b'))}</a>
        </li>
        <li>
          <a href={HREF}>{t(localized('m63e93b8d8e58'))}</a>
        </li>
      </ul>
    </nav>
  ),
  table: (t) => (
    <table className="level-preview__table">
      <tbody>
        <tr>
          <th>{t(localized('m0425c5ff9311'))}</th>
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
      aria-label={`${t(localized('mfd6d4fd26692'))}: ${t(LEVEL_NAMES[level])}`}
    >
      {/* The samples count as outer panels though the settings panel holds them (issue #45). */}
      <div className="level-preview__stage" data-frame-root>
        {sample(t)}
      </div>
    </figure>
  );
}

export { SAMPLES };
