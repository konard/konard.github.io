import { useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import CvDocument from '../cv/CvDocument';
import { STYLES, STYLE_NAMES, buildCv, pdfPath } from '../cv/buildCv';
import { positions } from '../data/positions';
import { useLang } from '../i18n/prefs';
import { useQueryParam } from './query';
import './cv.css';

const TEXT = {
  kicker: { en: 'CV', ru: 'Резюме' },
  title: { en: 'Download CV', ru: 'Скачать резюме' },
  lead: {
    en: 'A CV for one position, or the full record without a position. One column of plain text in one font, black on white, readable by ATS; a CV for a position fits 2 pages, the compact one fits 1 page.',
    ru: 'Резюме для одной должности или полный список опыта без должности. Одна колонка простого текста одним шрифтом, чёрным по белому, читаемая ATS; резюме для должности занимает до 2 страниц, компактное — 1 страницу.',
  },
  position: { en: 'Position', ru: 'Должность' },
  style: { en: 'Style', ru: 'Стиль' },
  pdf: { en: 'Download PDF', ru: 'Скачать PDF' },
  print: { en: 'Print / save as PDF', ru: 'Печать / сохранить в PDF' },
  experience: { en: 'Experience page', ru: 'Страница опыта' },
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
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(p.name)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(TEXT.style)}
            <select value={style} onChange={(event) => setStyle(event.target.value)}>
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {t(STYLE_NAMES[s])}
                </option>
              ))}
            </select>
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
