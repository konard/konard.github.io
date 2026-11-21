import { localized } from '../i18n/localizer.js';
import { DataMark } from './DataSources';
import { experience, experienceYears } from '../data/experience';
import { tr, useLang } from '../i18n/prefs';
import { formatCompact, formatNumber } from './format';
import { plural } from '../i18n/plural';
import { HABR_NOTE_ID, habrAuthorship } from '../data/habrAuthorship';

const ARTICLES = { en: ['article', 'articles'], ru: ['статья', 'статьи', 'статей'] };

// Repository counts only include original work of konard and of the related
// organizations: forks, mirrors, empty and generated test repositories are
// excluded (see scripts/repositories.cjs). Labels and hints are in `lang`.
export function buildStats(github, codingSince, now = new Date(), habr = null, lang = 'en') {
  const { totals } = github;
  const n = (value) => formatNumber(value, lang);
  const packages = github.registries.reduce((sum, r) => sum + r.packages, 0);
  const lifetime = github.registries.filter((r) => r.downloadsUnit === 'downloads total');
  const habrViews = habr ? habr.articles.reduce((sum, a) => sum + a.statistics.views, 0) : 0;
  const authors = habr && habrAuthorship(habr);
  const articles = (count, language) => `${formatNumber(count, language)} ${plural(count, language, ARTICLES)}`;
  const first = github.contributions[0].year;
  const last = github.contributions[github.contributions.length - 1].year;
  const since = experience.reduce((min, e) => (e.start < min ? e.start : min), '9999').slice(0, 4);
  const stats = [
    {
      id: 'experience',
      value: experienceYears(undefined, now),
      label: localized('m33b216048384'),
      hint: {
        en: `${experience.length} companies and ventures since ${since}`,
        ru: `${experience.length} компаний и проектов с ${since} года`,
      },
    },
    {
      id: 'contributions',
      value: github.totals.contributions,
      label: localized('m74f8882ff2cf'),
      hint: `${first}–${last}`,
    },
    {
      id: 'repos',
      value: totals.ownRepositories,
      label: localized('mf3e532f4ecb4'),
      hint: {
        en: `${n(totals.personalRepositories)} personal + ${n(totals.organizationRepositories)} in organizations, no forks`,
        ru: `${n(totals.personalRepositories)} личных + ${n(totals.organizationRepositories)} в организациях, без форков`,
      },
    },
    {
      id: 'organizations',
      value: totals.organizations,
      label: localized('m5ebfc89a2f99'),
      hint: localized('m32e3934f78a4'),
    },
    {
      id: 'languages',
      value: totals.languages,
      // GitHub linguist also counts markup and configuration languages (HTML,
      // CSS, Dockerfile, Makefile, TeX…), so the label does not say "programming" (issue #47).
      label: localized('m864a0d36c2fb'),
      hint: localized('m492eb73fd86a'),
    },
    {
      id: 'gists',
      value: github.profile.publicGists,
      label: localized('maca4e00df6f1'),
      hint: localized('ma399f97f654c'),
    },
    {
      id: 'packages',
      value: packages,
      label: localized('m78ed0b9b6c42'),
      hint: github.registries.map((r) => r.name).join(' · '),
    },
    {
      id: 'downloads',
      value: lifetime.reduce((sum, r) => sum + r.downloads, 0),
      label: localized('m559e25ff7b73'),
      hint: {
        en: `lifetime, ${lifetime.map((r) => r.name).join(' + ')}`,
        ru: `за всё время, ${lifetime.map((r) => r.name).join(' + ')}`,
      },
    },
    {
      id: 'stars',
      value: github.totals.stars,
      label: localized('m339177b8166a'),
      hint: localized('m123b79cb8056'),
    },
    {
      id: 'followers',
      value: github.profile.followers,
      label: localized('m649d7edb4314'),
      hint: { en: `following ${n(github.profile.following)}`, ru: `подписан на ${n(github.profile.following)}` },
    },
    {
      id: 'reputation',
      value: github.stackOverflow.reputation,
      label: localized('m4764b398e32b'),
      hint: {
        en: `member since ${github.stackOverflow.memberSince}`,
        ru: `участник с ${github.stackOverflow.memberSince} года`,
      },
    },
    ...(habr
      ? [
          {
            id: 'habr',
            value: habrViews,
            label: localized('mc3497cb749cd'),
            // The tile shows the committed snapshot while the Habr section refreshes
            // from the Habr API, so the tile names its date (issue #47).
            hint: {
              en: `${articles(authors.mine, 'en')} by me, ${articles(authors.team, 'en')} by the Deep.Foundation team · snapshot of ${habr.collectedAt.slice(0, 10)}`,
              ru: `${articles(authors.mine, 'ru')} мои, ${articles(authors.team, 'ru')} команды Deep.Foundation · снимок от ${habr.collectedAt.slice(0, 10)}`,
            },
            note: HABR_NOTE_ID,
          },
        ]
      : []),
    {
      id: 'years',
      value: now.getFullYear() - codingSince,
      label: localized('mb00969e10634'),
      hint: { en: `since ${codingSince}`, ru: `с ${codingSince} года` },
    },
  ];
  return stats.map((s) => ({ ...s, label: tr(s.label, lang), hint: tr(s.hint, lang) }));
}

export default function StatTiles({ github, codingSince, habr }) {
  const { lang, t } = useLang();
  const stats = buildStats(github, codingSince, new Date(), habr, lang);
  return (
    <ul className="stats" aria-label={t(localized('m75b90f40cc0b'))}>
      {stats.map((s) => (
        <li key={s.id} className="stat">
          <span className="stat__value" title={formatNumber(s.value, lang)}>
            {s.value >= 10000 ? formatCompact(s.value, lang) : formatNumber(s.value, lang)}
            {!['years', 'experience'].includes(s.id) && <DataMark />}
          </span>
          <span className="stat__label">{s.label}</span>
          <span className="stat__hint">
            {s.hint}
            {s.note && (
              <>
                {' '}
                <a className="data-mark" href={`#${s.note}`} aria-label={t(localized('md86cf51ac6b4'))}>
                  (**)
                </a>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
