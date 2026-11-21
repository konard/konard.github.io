import { localized } from '../i18n/localizer.js';
import { useEffect, useState } from 'react';
import { useLang } from '../i18n/prefs';
import { agreesWithSnapshot, fetchCalendar, isDisciplined, LEVELS } from '../data/calendar';
import { formatNumber } from './format';
import { DataMark } from './DataSources';

export default function ContributionCalendar({ snapshot, live = true, fetchImpl, now }) {
  const [calendar, setCalendar] = useState(snapshot.calendar);
  const [effectiveAt, setEffectiveAt] = useState(snapshot.collectedAt);
  const [status, setStatus] = useState('snapshot');
  const [clock, setClock] = useState(() => new Date());
  const { t, lang } = useLang();
  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    fetchCalendar(fetchImpl)
      .then((data) => {
        if (cancelled || !agreesWithSnapshot(data, snapshot.calendar)) return;
        setCalendar(data);
        const refreshedAt = new Date();
        setEffectiveAt(refreshedAt.toISOString());
        setClock(refreshedAt);
        setStatus('live');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [live, fetchImpl, snapshot.calendar]);
  // Re-evaluate freshness in long-lived tabs too, even when the API is offline.
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const disciplined = isDisciplined(calendar, effectiveAt, now || clock);
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const number = (v) => formatNumber(v, lang);
  const date = (d, options) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { timeZone: 'UTC', ...options });
  const dayLabel = (d) =>
    `${date(d.date, { year: 'numeric', month: 'long', day: 'numeric' })}: ${number(d.contributionCount)} ${t(localized('mbf795d185592'))}`;
  const months = new Set();
  return (
    <div className="contribution-calendar">
      <div className="contribution-calendar__heading">
        <h3>{t(localized('m8af98cadebc3'))}</h3>
        <span>
          {number(calendar.totalContributions)} <DataMark />
        </span>
      </div>
      <p className="muted">
        {days[0]?.date} – {days.at(-1)?.date} ·{' '}
        {status === 'live' ? t(localized('md70071003a6b')) : t(localized('m9a48a848c7ec'))}:{' '}
        <time dateTime={effectiveAt}>{effectiveAt.slice(0, 10)}</time>
      </p>
      <div
        className="contribution-calendar__scroll"
        tabIndex={0}
        role="region"
        aria-label={t(localized('mccca8a3373ee'))}
      >
        <svg width={42 + calendar.weeks.length * 14} height="132" role="img" aria-label={t(localized('ma40a038712d3'))}>
          {[1, 3, 5].map((d) => (
            <text key={d} x="0" y={29 + d * 14} className="contribution-calendar__label">
              {t({
                en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d],
                ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d],
              })}
            </text>
          ))}
          {calendar.weeks.map((week, x) => {
            const monthDay = week.contributionDays.find((d) => new Date(d.date).getUTCDate() <= 7);
            const month = monthDay?.date.slice(0, 7);
            const label = month && !months.has(month) ? date(monthDay.date, { month: 'short' }) : null;
            if (month) months.add(month);
            return (
              <g key={week.firstDay} transform={`translate(${42 + x * 14},0)`}>
                {label && (
                  <text y="12" className="contribution-calendar__label">
                    {label}
                  </text>
                )}
                {week.contributionDays.map((d) => (
                  <rect
                    key={d.date}
                    className="contribution-calendar__day"
                    data-level={LEVELS.indexOf(d.contributionLevel)}
                    x="0"
                    y={22 + d.weekday * 14}
                    width="11"
                    height="11"
                    rx="2"
                  >
                    <title>{dayLabel(d)}</title>
                  </rect>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="contribution-calendar__legend">
        <a href="https://github.com/konard?tab=overview" target="_blank" rel="noopener noreferrer">
          {t(localized('m759df9769e17'))}
        </a>
        <span>
          {t(localized('mc48c121d1004'))}{' '}
          {LEVELS.map((_, i) => (
            <i key={i} data-level={i} />
          ))}{' '}
          {t(localized('m048459339557'))}
        </span>
      </div>
      <p className="muted">{t(localized('m27af303d19b2'))}</p>
      {disciplined && (
        <div className="discipline">
          <h3>{t(localized('mb76a1e745762'))}</h3>
          <p>{t(localized('m445ab3ab5dd3'))}</p>
        </div>
      )}
      <details className="table-view">
        <summary>{t(localized('m34e13b9a3b11'))}</summary>
        <table>
          <thead>
            <tr>
              <th>{t(localized('m49b7b4c4cc50'))}</th>
              <th>{t(localized('m0a9d093cf56e'))}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{number(d.contributionCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
