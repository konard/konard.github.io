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
    `${date(d.date, { year: 'numeric', month: 'long', day: 'numeric' })}: ${number(d.contributionCount)} ${t({ en: 'contributions', ru: 'вкладов' })}`;
  const months = new Set();
  return (
    <div className="contribution-calendar">
      <div className="contribution-calendar__heading">
        <h3>{t({ en: 'Daily GitHub contributions', ru: 'Ежедневный вклад на GitHub' })}</h3>
        <span>
          {number(calendar.totalContributions)} <DataMark />
        </span>
      </div>
      <p className="muted">
        {days[0]?.date} – {days.at(-1)?.date} ·{' '}
        {status === 'live' ? t({ en: 'Updated live', ru: 'Обновлено онлайн' }) : t({ en: 'Snapshot', ru: 'Снимок' })}:{' '}
        <time dateTime={effectiveAt}>{effectiveAt.slice(0, 10)}</time>
      </p>
      <div
        className="contribution-calendar__scroll"
        tabIndex={0}
        role="region"
        aria-label={t({
          en: 'Scrollable GitHub contribution calendar',
          ru: 'Прокручиваемый календарь вклада на GitHub',
        })}
      >
        <svg
          width={42 + calendar.weeks.length * 14}
          height="132"
          role="img"
          aria-label={t({
            en: 'GitHub contribution calendar including shared private activity',
            ru: 'Календарь вклада GitHub, включая открытую приватную активность',
          })}
        >
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
          {t({ en: 'View on GitHub', ru: 'Смотреть на GitHub' })}
        </a>
        <span>
          {t({ en: 'Less', ru: 'Меньше' })}{' '}
          {LEVELS.map((_, i) => (
            <i key={i} data-level={i} />
          ))}{' '}
          {t({ en: 'More', ru: 'Больше' })}
        </span>
      </div>
      <p className="muted">
        {t({
          en: 'Same daily levels as GitHub, including anonymized private contributions shared on the profile. Code statistics below use public repositories only.',
          ru: 'Те же ежедневные уровни, что на GitHub, включая обезличенный приватный вклад, открытый в профиле. Статистика кода ниже использует только публичные репозитории.',
        })}
      </p>
      {disciplined && (
        <div className="discipline">
          <h3>
            {t({
              en: 'Discipline comes first in any work or art',
              ru: 'Дисциплина прежде всего в любой работе или искусстве',
            })}
          </h3>
          <p>
            {t({
              en: 'My goal was to make at least one contribution every day, until it became a habit that grew into what you see today.',
              ru: 'Моей целью был хотя бы один вклад в день — пока это не стало привычкой, выросшей в то, что вы видите сегодня.',
            })}
          </p>
        </div>
      )}
      <details className="table-view">
        <summary>{t({ en: 'Daily contribution data', ru: 'Данные о ежедневном вкладе' })}</summary>
        <table>
          <thead>
            <tr>
              <th>{t({ en: 'Date (UTC)', ru: 'Дата (UTC)' })}</th>
              <th>{t({ en: 'Contributions', ru: 'Вклады' })}</th>
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
