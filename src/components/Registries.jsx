import { tr, useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { formatCompact, formatNumber } from './format';
import { DataMark } from './DataSources';

// The units and notes come from scripts/registries.cjs in English; known ones are
// translated here, unknown ones are shown as they are.
const UNITS = {
  'downloads / month': 'загрузок в месяц',
  'downloads total': 'загрузок всего',
  'pulls total': 'скачиваний образов всего',
  'downloads total (rounded)': 'загрузок всего (округлённо)',
};
const NOTES = {
  'download counts are rounded by github.com and cover public packages only':
    'число загрузок округляет github.com, и оно учитывает только публичные пакеты',
};
const local = (dictionary, text, lang) => tr({ en: text, ru: dictionary[text] }, lang);
const PACKAGES = { en: ['package', 'packages'], ru: ['пакет', 'пакета', 'пакетов'] };
const REGISTRIES = { en: ['registry', 'registries'], ru: ['реестр', 'реестра', 'реестров'] };

function Bars({ registry }) {
  const { lang, t } = useLang();
  const max = Math.max(...registry.top.map((p) => p.downloads || 0));
  const unit = local(UNITS, registry.downloadsUnit, lang);
  return (
    <ul
      className="hbars hbars--compact"
      aria-label={t({
        en: `Top ${registry.name} packages by ${unit}`,
        ru: `Самые популярные пакеты ${registry.name}: ${unit}`,
      })}
    >
      {registry.top.map((p) => (
        <li key={p.name} className="hbars__row">
          <a className="hbars__name" href={p.url} target="_blank" rel="noopener noreferrer">
            {p.name}
          </a>
          <span className="hbars__track">
            <span className="hbars__fill" style={{ width: `${max ? ((p.downloads || 0) / max) * 100 : 0}%` }} />
          </span>
          <span className="hbars__value" title={formatNumber(p.downloads || 0, lang)}>
            {formatCompact(p.downloads || 0, lang)}
          </span>
        </li>
      ))}
    </ul>
  );
}

// One card per package registry. Units differ (npm and PyPI report monthly
// downloads, crates.io and NuGet lifetime totals, Docker Hub pulls; Go, Nimble
// and Homebrew publish no counts), so each card has its own scale.
export default function Registries({ registries, summary }) {
  const { lang, t } = useLang();
  return (
    <>
      <ul className="registries">
        {registries.map((r) => (
          <li key={r.id} className="registry">
            <a className="registry__name" href={r.url} target="_blank" rel="noopener noreferrer">
              {r.name}
            </a>
            <div className="registry__numbers">
              <span>
                <strong>{formatNumber(r.packages, lang)}</strong> {plural(r.packages, lang, PACKAGES)} <DataMark />
              </span>
              {r.downloadsUnit ? (
                <span>
                  <strong title={formatNumber(r.downloads, lang)}>{formatCompact(r.downloads, lang)}</strong>{' '}
                  {local(UNITS, r.downloadsUnit, lang)}
                </span>
              ) : (
                <span className="muted">
                  {t({ en: 'no public download counts', ru: 'нет публичной статистики загрузок' })}
                </span>
              )}
            </div>
            {r.downloadsUnit ? (
              <Bars registry={r} />
            ) : (
              <ul className="registry__packages">
                {r.top.map((p) => (
                  <li key={p.name}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="mono">
                      {p.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {summary && (
        <p className="registries__note muted">
          {t({
            en: `${summary.checked} ${plural(summary.checked, 'en', REGISTRIES)} checked on ${summary.collectedAt.slice(0, 10)}, by account and by the manifests of every original repository; packages of forks and mirrors are not counted. Nothing published on ${summary.empty.join(', ')}.`,
            ru: `${summary.collectedAt.slice(0, 10)} проверено ${summary.checked} ${plural(summary.checked, 'ru', REGISTRIES)} — по аккаунту и по манифестам всех собственных репозиториев; пакеты форков и зеркал не учитываются. Ничего не опубликовано в: ${summary.empty.join(', ')}.`,
          })}
          {summary.blocked.map((b) => ` ${b.name}: ${local(NOTES, b.note, lang)}.`)}
        </p>
      )}
    </>
  );
}
