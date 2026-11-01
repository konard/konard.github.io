import Layout from '../components/Layout';
import { formatNumber } from '../components/format';
import { DataMark } from '../components/DataSources';
import RepoList, { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import { fields, professions } from '../data/fields';
import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { allRepositories, byStars, inField, KINDS, ownRepositories, repo } from './repos';
import { ArrowRight } from 'lucide-react';
import { iconProps } from '../components/icons';

const SECTIONS = [
  ['professions', { en: 'By profession', ru: 'По профессиям' }],
  ['fields', { en: 'By field', ru: 'По областям' }],
  ['all', { en: 'All repositories', ru: 'Все репозитории' }],
];

const owners = new Set(ownRepositories.map((r) => r.owner));
const stars = ownRepositories.reduce((sum, r) => sum + r.stars, 0);
const ORIGINAL = {
  en: ['original repository', 'original repositories'],
  ru: ['собственный репозиторий', 'собственных репозитория', 'собственных репозиториев'],
};
// "in N accounts": Russian needs the prepositional case after «в».
const IN_ACCOUNTS = {
  en: ['account and organization', 'accounts and organizations'],
  ru: ['аккаунте и организации', 'аккаунтах и организациях', 'аккаунтах и организациях'],
};
const STARS = { en: ['star', 'stars'], ru: ['звезда', 'звезды', 'звёзд'] };
const ALL_REPOSITORIES = { en: 'All repositories', ru: 'Все репозитории' };

/** Every repository of konard and the organizations, grouped by field and profession. */
export default function RepositoriesPage() {
  const { lang, t } = useLang();
  const number = (v) => formatNumber(v, lang);
  const words = (v, forms) => plural(v, lang, forms);
  return (
    <Layout page="repositories" sections={SECTIONS}>
      <header className="page-hero" id="top">
        <p className="section__kicker">{t({ en: 'Open source', ru: 'Открытый код' })}</p>
        <h1 className="page-hero__title">{t({ en: 'Repositories', ru: 'Репозитории' })}</h1>
        <p className="page-hero__lead">
          {t({
            en: `${number(ownRepositories.length)} ${words(ownRepositories.length, ORIGINAL)} in ${owners.size} ${words(owners.size, IN_ACCOUNTS)}, with ${number(stars)} ${words(stars, STARS)}. Each one is classified by the fields where it is useful; forks and mirrors are not counted, and empty repositories are not shown.`,
            ru: `${number(ownRepositories.length)} ${words(ownRepositories.length, ORIGINAL)} в ${owners.size} ${words(owners.size, IN_ACCOUNTS)}, ${number(stars)} ${words(stars, STARS)}. Каждый отнесён к тем областям, где он полезен; форки и зеркала не учитываются, а пустые репозитории не показаны.`,
          })}
        </p>
        <ul className="page-stats">
          {Object.entries(KINDS).map(([id, k]) => (
            <li key={id}>
              <strong className="mono">
                {number(allRepositories.filter((r) => r.kind === id).length)} <DataMark />
              </strong>
              <span>{t(k.label)}</span>
              <small>{t(k.summary)}</small>
            </li>
          ))}
        </ul>
      </header>

      <Section
        id="professions"
        kicker={{ en: 'Best examples', ru: 'Лучшие примеры' }}
        title={{ en: 'Repositories by IT profession', ru: 'Репозитории по IT-профессиям' }}
      >
        <p className="section__lead">
          {t({
            en: 'Hand-picked repositories that show the work of each profession best, from MLOps and DevOps to ML/AI, data, backend, frontend, systems, compilers and QA.',
            ru: 'Отобранные вручную репозитории, которые лучше всего показывают работу в каждой профессии: от MLOps и DevOps до ML/AI, данных, бэкенда, фронтенда, системного программирования, компиляторов и QA.',
          })}
        </p>
        <div className="profession-grid">
          {professions.map((p) => (
            <article key={p.id} className="profession" id={`profession-${p.id}`}>
              <h3>{t(p.name)}</h3>
              <p className="muted">{t(p.summary)}</p>
              <ul className="repos repos--compact">
                {p.repos.map(([name, why]) => {
                  const r = repo(name);
                  return r ? (
                    <RepoItem key={name} repo={r} note={why} />
                  ) : (
                    <li key={name} className="repo">
                      <a href={`https://github.com/${name}`} target="_blank" rel="noopener noreferrer">
                        {name}
                      </a>
                      <p className="repo__description">{t(why)}</p>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section
        id="fields"
        kicker={{ en: 'Fields', ru: 'Области' }}
        title={{
          en: 'How the repositories are useful in different fields',
          ru: 'Чем репозитории полезны в разных областях',
        }}
      >
        <ul className="field-grid">
          {fields.map((f) => {
            const list = inField(f.id).sort(byStars);
            return (
              <li key={f.id} className="field-card" id={`field-${f.id}`}>
                <h3>
                  {t(f.name)}{' '}
                  <span className="mono muted">
                    {list.length} <DataMark />
                  </span>
                </h3>
                <p>{t(f.summary)}</p>
                <p className="field-card__top">
                  {list.slice(0, 5).map((r, i) => (
                    <span key={r.fullName}>
                      {i > 0 && ' · '}
                      <a href={`https://github.com/${r.fullName}`} target="_blank" rel="noopener noreferrer">
                        {r.name}
                      </a>
                    </span>
                  ))}
                </p>
                <a className="field-card__all" href={`?field=${f.id}#all`}>
                  {t({ en: 'All', ru: 'Все' })} {list.length} <ArrowRight {...iconProps} />
                </a>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="all" kicker={{ en: 'Catalog', ru: 'Каталог' }} title={ALL_REPOSITORIES}>
        <RepoList items={allRepositories} label={ALL_REPOSITORIES} />
      </Section>
    </Layout>
  );
}
