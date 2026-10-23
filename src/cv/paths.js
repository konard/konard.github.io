// Paths of the CVs and the dates of a position, apart from buildCv.js so that the
// home and experience pages link to the CVs without downloading the CV builder and
// its data (issue #15: fast loading on mobile).
import { tr } from '../i18n/prefs';

export const PRESENT = { en: 'present', ru: 'н. в.' };

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ru: ['янв.', 'февр.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'],
};

/** 'May 2026 – present' / 'май 2026 – н. в.' */
export function formatPeriod(start, end, lang = 'en') {
  const fmt = (ym) => {
    const [year, month] = ym.split('-').map(Number);
    return `${MONTHS[lang][month - 1]} ${year}`;
  };
  return `${fmt(start)} – ${end ? fmt(end) : tr(PRESENT, lang)}`;
}

/** Where the prebuilt PDF of a CV is published (see scripts/build-cv-pdf.mjs). */
export const pdfPath = ({ role = 'all', style = 'classic', lang = 'en' } = {}) =>
  `/cv/pdf/konstantin-diachenko-${role}-${style}-${lang}.pdf`;

/** The /cv/ page of a CV. */
export const cvPagePath = ({ role = 'all', style = 'classic', lang = 'en' } = {}) => {
  const params = new URLSearchParams();
  if (role && role !== 'all') params.set('role', role);
  if (style && style !== 'classic') params.set('style', style);
  params.set('lang', lang);
  return `/cv/?${params}`;
};
