import { localized } from '../i18n/localizer.js';
import Layout from '../components/Layout';
import { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import Skills from '../components/Skills';
import Timeline from '../components/Timeline';
import { cvPagePath, pdfPath } from '../cv/paths';
import github from '../data/github.lino';
import { professions } from '../data/fields';
import { experience, favoriteLanguages, positions, skillGroups } from '../data/profile';
import { useLang } from '../i18n/prefs';
import { useNotation } from '../links/notation';
import { plural } from '../i18n/plural';
import { useQueryParam } from './query';
import { repo } from './repos';
import { ArrowRight } from 'lucide-react';
import { iconProps } from '../components/icons';

const endYear = github.contributions[github.contributions.length - 1].year;

// The positions to choose from; 'all' is the tab without a position.
const ALL = positions.find((p) => p.id === 'all');
const CHOICES = positions.filter((p) => p.id !== 'all');

const TEXT = {
  kicker: localized('m59ce29a188ea'),
  title: localized('ma1d6ee362ce5'),
  tabs: localized('m702edf6581fb'),
  all: localized('m8e35d36c12a5'),
  cv: localized('m4fba0d94ec05'),
  pdf: localized('mbeb82eae76ec'),
  timeline: localized('m68260e09d38b'),
  examples: localized('m89a78bc55de8'),
  skills: localized('m76cd1ef8816d'),
  companies: localized('m10401887ca26'),
  openSource: localized('m284f146ee95c'),
  repositories: localized('m946c01a2522b'),
  allExamples: localized('mc158ea57326f'),
  stack: localized('m2bfca692a47b'),
  technologies: localized('m7622035d0674'),
};

const POSITIONS = { en: ['position', 'positions'], ru: ['место работы', 'места работы', 'мест работы'] };

/** Experience filtered to one position (`?role=`), with the CV of that position. */
export default function ExperiencePage() {
  const { lang, t } = useLang();
  const { n } = useNotation();
  const [roleId, setRole] = useQueryParam('role');
  const role = CHOICES.find((p) => p.id === roleId) || null;
  const position = role || ALL;
  const ids = new Set(position.jobs);
  const items = experience.filter((e) => ids.has(e.id));
  const groups = role ? skillGroups.filter((g) => role.skills.includes(g.id)) : skillGroups;
  // Without a position every profession is shown, with every repository picked for it.
  const picks = role ? professions.filter((p) => role.professions.includes(p.id)) : professions;
  const cvRole = role ? role.id : 'all';

  const select = (id) => (event) => {
    event.preventDefault();
    setRole(id);
  };

  return (
    <Layout
      page="experience"
      sections={[
        ['timeline', TEXT.timeline],
        ...(picks.length ? [['examples', TEXT.examples]] : []),
        ['skills', TEXT.skills],
      ]}
    >
      <header className="page-hero" id="top">
        <p className="section__kicker">{t(TEXT.kicker)}</p>
        <h1 className="page-hero__title">
          {role ? t({ en: `${role.name.en} experience`, ru: `Опыт: ${role.name.ru}` }) : t(TEXT.title)}
        </h1>
        <p className="page-hero__lead">{n(t(position.summary))}</p>
        <nav aria-label={t(TEXT.tabs)}>
          <ul className="role-tabs">
            <li>
              <a href="?" aria-current={!role ? 'page' : undefined} onClick={select('')}>
                {t(TEXT.all)} <span className="mono">{experience.length}</span>
              </a>
            </li>
            {CHOICES.map((p) => (
              <li key={p.id}>
                <a href={`?role=${p.id}`} aria-current={role?.id === p.id ? 'page' : undefined} onClick={select(p.id)}>
                  {t(p.name)} <span className="mono">{p.jobs.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="page-hero__actions">
          <a className="button button--primary" href={cvPagePath({ role: cvRole, lang })}>
            {t(TEXT.cv)}
          </a>
          <a className="button" href={pdfPath({ role: cvRole, lang })} download>
            {t(TEXT.pdf)}
          </a>
        </p>
      </header>

      <Section id="timeline" kicker={`${items.length} ${plural(items.length, lang, POSITIONS)}`} title={TEXT.companies}>
        <Timeline key={position.id} items={items} endYear={endYear} />
      </Section>

      {picks.length > 0 && (
        <Section id="examples" kicker={TEXT.openSource} title={TEXT.repositories}>
          <div className="profession-grid">
            {picks.map((p) => (
              <article key={p.id} className="profession">
                <h3>{t(p.name)}</h3>
                <p className="muted">{n(t(p.summary))}</p>
                <ul className="repos repos--compact">
                  {p.repos
                    .map(([name, why]) => [repo(name), why])
                    .filter(([r]) => r)
                    .map(([r, why]) => (
                      <RepoItem key={r.fullName} repo={r} note={why} />
                    ))}
                </ul>
                <a href={`/repositories/#profession-${p.id}`}>
                  {t(TEXT.allExamples)} <ArrowRight {...iconProps} />
                </a>
              </article>
            ))}
          </div>
        </Section>
      )}

      <Section
        id="skills"
        kicker={TEXT.stack}
        title={role ? { en: `Skills for ${role.name.en}`, ru: `Навыки: ${role.name.ru}` } : TEXT.technologies}
      >
        <Skills groups={groups} favorites={favoriteLanguages} />
      </Section>
    </Layout>
  );
}
