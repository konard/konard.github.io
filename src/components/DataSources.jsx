import { useLang } from '../i18n/prefs';
import { sources } from '../data/indicators.json';
import '../indicators.css';

export function DataMark() {
  const { t } = useLang();
  return (
    <a
      className="data-mark"
      href="#data-sources"
      onClick={() => {
        const details = document.getElementById('data-sources');
        if (details) details.open = true;
      }}
      aria-label={t({ en: 'Data effective dates', ru: 'Даты актуальности данных' })}
    >
      (*)
    </a>
  );
}

export default function DataSources() {
  const { t } = useLang();
  return (
    <details className="data-sources" id="data-sources">
      <summary>
        {t({
          en: '(*) Effective dates and sources for numerical indicators',
          ru: '(*) Даты актуальности и источники числовых показателей',
        })}
      </summary>
      <p>
        {t({
          en: 'Repository, language, package and community figures are dated snapshots, not live counters. Calendar and article cards can refresh from public services; otherwise their displayed effective date applies. The calendar service caches GitHub data for up to one hour; conflicting results keep the saved GitHub graph. Career durations are calculated today. Dates in the career record describe the events themselves.',
          ru: 'Числа репозиториев, языков, пакетов и показатели сообществ — датированные снимки. Календарь и карточки статей могут обновляться из публичных сервисов; иначе действует указанная дата снимка. Сервис календаря кэширует данные GitHub до часа; при расхождении сохраняется график со снимка GitHub. Продолжительность карьеры рассчитывается на сегодня. Даты в истории карьеры относятся к самим событиям.',
        })}
      </p>
      <ul>
        {Object.entries(sources).map(([name, source]) => (
          <li key={name}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {t(source.label)}
            </a>
            : <time dateTime={source.effectiveAt}>{source.effectiveAt.slice(0, 10)}</time> (UTC)
          </li>
        ))}
      </ul>
      <p>
        {t({
          en: 'Only public source repositories are counted. The calendar also includes anonymized private activity shared on the GitHub profile. No private repository names, languages or source code are collected.',
          ru: 'Учитываются только публичные исходные репозитории. Календарь также включает обезличенную приватную активность, открытую в профиле GitHub. Названия, языки и код приватных репозиториев не собираются.',
        })}
      </p>
      <a href="https://github.com/konard/konard.github.io/tree/main/docs/case-studies/issue-33">
        {t({ en: 'Methods, coverage and reproducible collection', ru: 'Методы, охват и воспроизводимый сбор данных' })}
      </a>
    </details>
  );
}
