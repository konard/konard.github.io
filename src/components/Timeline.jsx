import { formatPeriod } from '../cv/buildCv';
import { useLang } from '../i18n/prefs';
import { useNotation } from '../links/notation';
import { Tooltip, useTooltip } from './Tooltip';

// 'Nov 2006 – Aug 2007' / 'нояб. 2006 – авг. 2007', the same dates as in the CV.
export { formatPeriod };

// 'YYYY-MM' -> fractional year (start of month).
export const toYear = (ym) => {
  const [year, month] = ym.split('-').map(Number);
  return year + (month - 1) / 12;
};

const TYPES = {
  company: { en: 'Employment', ru: 'Работа в компании' },
  'open-source': { en: 'Founded / led open-source', ru: 'Основанный / ведомый open-source' },
};

const TEXT = {
  legend: { en: 'Timeline legend', ru: 'Легенда шкалы времени' },
  timeline: { en: 'Career timeline', ru: 'Шкала карьеры' },
};

const linkProps = (url) => (url ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {});

// Gantt-style overview (one row per position, years on the x axis) followed by
// position cards, most recent first, with every bullet of the job: the site is
// the full record and a CV is a subset of it (issue #11). Employment and open-source ventures differ
// by fill style (solid vs. hatched) as well as color, so the distinction never
// relies on color alone.
export default function Timeline({ items, endYear }) {
  const { tip, show, hide } = useTooltip();
  const { lang, t } = useLang();
  const { n } = useNotation();
  const period = (item) => formatPeriod(item.start, item.end, lang);
  const startYear = Math.floor(Math.min(...items.map((i) => toYear(i.start))));
  const span = endYear + 1 - startYear;
  const pos = (year) => ((year - startYear) / span) * 100;
  const ticks = [];
  for (let y = startYear; y <= endYear; y += 2) ticks.push(y);
  const recentFirst = [...items].sort(
    (a, b) => (b.end || '9999').localeCompare(a.end || '9999') || b.start.localeCompare(a.start),
  );

  const tipContent = (item) => (
    <>
      <strong>{t(item.title)}</strong>
      <span className="tooltip__value">{period(item)}</span>
      <span className="tooltip__row">
        {t(item.role)} · {t(TYPES[item.type])}
      </span>
    </>
  );

  return (
    <div className="timeline">
      <div className="chart timeline__chart" data-tooltip-root>
        <ul className="legend" aria-label={t(TEXT.legend)}>
          {Object.entries(TYPES).map(([type, label]) => (
            <li key={type}>
              <span className={`legend__swatch timeline__swatch--${type}`} />
              {t(label)}
            </li>
          ))}
        </ul>
        <div className="timeline__axis" aria-hidden="true">
          {ticks.map((y) => (
            <span key={y} className="timeline__year" style={{ left: `${pos(y)}%` }}>
              {y}
            </span>
          ))}
        </div>
        <ol className="timeline__rows" aria-label={t(TEXT.timeline)}>
          {items.map((item) => {
            const from = toYear(item.start);
            const to = item.end ? toYear(item.end) + 1 / 12 : endYear + 1;
            return (
              <li key={item.id} className="timeline__row">
                <span className="timeline__label">{t(item.title)}</span>
                <span className="timeline__track">
                  {ticks.map((y) => (
                    <span key={y} className="timeline__tick" style={{ left: `${pos(y)}%` }} />
                  ))}
                  <span
                    className={`timeline__bar timeline__bar--${item.type}${item.end ? '' : ' is-ongoing'}`}
                    style={{ left: `${pos(from)}%`, width: `${Math.max(0.8, pos(to) - pos(from))}%` }}
                    tabIndex={0}
                    aria-label={`${t(item.title)}, ${t(item.role)}: ${period(item)}`}
                    onPointerMove={(e) => show(e, tipContent(item))}
                    onFocus={(e) => show(e, tipContent(item))}
                    onPointerLeave={hide}
                    onBlur={hide}
                  />
                </span>
              </li>
            );
          })}
        </ol>
        <Tooltip tip={tip} />
      </div>

      <ol className="positions">
        {recentFirst.map((item) => {
          const Title = item.url ? 'a' : 'span';
          return (
            <li key={item.id} className={`position position--${item.type}`}>
              <span className="position__period mono">
                {period(item)}
                {item.location && ` · ${t(item.location)}`}
              </span>
              <h3 className="position__title">
                <Title {...linkProps(item.url)}>{t(item.title)}</Title>
              </h3>
              <span className="position__role">{t(item.role)}</span>
              <p className="position__summary">{n(t(item.summary))}</p>
              {item.bullets?.length > 0 && (
                <ul className="position__bullets">
                  {item.bullets.map((b) => (
                    <li key={b.en}>{t(b)}</li>
                  ))}
                </ul>
              )}
              <ul className="tags">
                {item.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
