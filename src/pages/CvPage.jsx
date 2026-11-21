import { localized } from '../i18n/localizer.js';
import Select from '../components/Select';
import { useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import CvDocument from '../cv/CvDocument';
import { STYLES, STYLE_NAMES, buildCv, pdfPath } from '../cv/buildCv';
import { positions } from '../data/positions';
import { useLang } from '../i18n/prefs';
import { useQueryParam } from './query';
import './cv.css';

const TEXT = {
  kicker: localized('m4d522dda41b0'),
  title: localized('m4fba0d94ec05'),
  lead: localized('mff6b58c555d8'),
  position: localized('m47f68dc3bac4'),
  style: localized('mc2e42c394377'),
  pdf: localized('m63158e068cce'),
  print: localized('m52c14ff6c040'),
  experience: localized('m88c4a1b91fbe'),
};

/** /cv/?role=<position>&style=<style>&lang=<en|ru>: a CV preview with its PDF. */
export default function CvPage() {
  const { lang, t } = useLang();
  const [roleParam, setRole] = useQueryParam('role', 'all');
  const [styleParam, setStyle] = useQueryParam('style', 'classic');
  const role = positions.some((p) => p.id === roleParam) ? roleParam : 'all';
  const style = STYLES.includes(styleParam) ? styleParam : 'classic';
  const cv = useMemo(() => buildCv({ role, style, lang }), [role, style, lang]);

  useEffect(() => {
    // The browser uses the title as the file name of “Save as PDF”.
    document.title = `${cv.name} — CV — ${cv.title}`;
  }, [cv]);

  return (
    <Layout page="cv">
      <header className="page-hero cv-hero" id="top">
        <p className="section__kicker">{t(TEXT.kicker)}</p>
        <h1 className="page-hero__title">{t(TEXT.title)}</h1>
        <p className="page-hero__lead">{t(TEXT.lead)}</p>
        <form className="cv-toolbar" onSubmit={(event) => event.preventDefault()}>
          <label>
            {t(TEXT.position)}
            <Select value={role} onChange={(event) => setRole(event.target.value)}>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(p.name)}
                </option>
              ))}
            </Select>
          </label>
          <label>
            {t(TEXT.style)}
            <Select value={style} onChange={(event) => setStyle(event.target.value)}>
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {t(STYLE_NAMES[s])}
                </option>
              ))}
            </Select>
          </label>
          <a className="button button--primary" href={pdfPath({ role, style, lang })} download>
            {t(TEXT.pdf)}
          </a>
          <button className="button" type="button" onClick={() => window.print()}>
            {t(TEXT.print)}
          </button>
          <a className="button" href={`/experience/${role === 'all' ? '' : `?role=${role}`}`}>
            {t(TEXT.experience)}
          </a>
        </form>
      </header>
      <div className="cv-paper">
        <CvDocument cv={cv} />
      </div>
    </Layout>
  );
}
