import Layout from '../components/Layout';
import { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import Skills from '../components/Skills';
import Timeline from '../components/Timeline';
import github from '../data/github.json';
import { professions } from '../data/fields';
import { experience, favoriteLanguages, roles, skillGroups } from '../data/profile';
import { useQueryParam } from './query';
import { repo } from './repos';

// What to show next to the filtered timeline for every kind of experience.
export const ROLE_DETAILS = {
  ml: { professions: ['ml-ai', 'mlops'], skills: ['ai', 'languages', 'data'] },
  devops: { professions: ['devops', 'mlops', 'qa'], skills: ['devops', 'tools'] },
  lead: { professions: ['lead', 'mlops'], skills: ['domains', 'devops'] },
  developer: {
    professions: ['backend', 'frontend', 'systems', 'languages', 'data', 'bots'],
    skills: ['languages', 'markup', 'data', 'web', 'dotnet', 'parsing'],
  },
  research: { professions: ['research', 'languages'], skills: ['domains', 'parsing', 'ai'] },
};

const endYear = github.contributions[github.contributions.length - 1].year;

/** Experience filtered to one kind of work: ML/AI, DevOps, CEO/team lead, developer or researcher. */
export default function ExperiencePage() {
  const [roleId, setRole] = useQueryParam('role');
  const role = roles.find((r) => r.id === roleId) || null;
  const items = role ? experience.filter((e) => e.roles.includes(role.id)) : experience;
  const details = role ? ROLE_DETAILS[role.id] : null;
  const groups = details ? skillGroups.filter((g) => details.skills.includes(g.id)) : skillGroups;
  const picks = details ? professions.filter((p) => details.professions.includes(p.id)) : [];

  const select = (id) => (event) => {
    event.preventDefault();
    setRole(id);
  };

  return (
    <Layout
      page="experience"
      sections={[['timeline', 'Timeline'], ...(picks.length ? [['examples', 'Examples']] : []), ['skills', 'Skills']]}
    >
      <header className="page-hero" id="top">
        <p className="section__kicker">Experience</p>
        <h1 className="page-hero__title">{role ? `${role.name} experience` : 'Experience by role'}</h1>
        <p className="page-hero__lead">
          {role
            ? role.summary
            : 'Choose one kind of experience to see only the positions, example repositories and skills that matter for it.'}
        </p>
        <nav aria-label="Kinds of experience">
          <ul className="role-tabs">
            <li>
              <a href="?" aria-current={!role ? 'page' : undefined} onClick={select('')}>
                All
              </a>
            </li>
            {roles.map((r) => (
              <li key={r.id}>
                <a href={`?role=${r.id}`} aria-current={role?.id === r.id ? 'page' : undefined} onClick={select(r.id)}>
                  {r.name} <span className="mono">{experience.filter((e) => e.roles.includes(r.id)).length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <Section id="timeline" kicker={`${items.length} positions`} title="Companies & ventures">
        <Timeline key={role?.id || 'all'} items={items} endYear={endYear} />
      </Section>

      {picks.length > 0 && (
        <Section id="examples" kicker="Open source" title="Example repositories">
          <div className="profession-grid">
            {picks.map((p) => (
              <article key={p.id} className="profession">
                <h3>{p.name}</h3>
                <p className="muted">{p.summary}</p>
                <ul className="repos repos--compact">
                  {p.repos
                    .map(([name, why]) => [repo(name), why])
                    .filter(([r]) => r)
                    .slice(0, 6)
                    .map(([r, why]) => (
                      <RepoItem key={r.fullName} repo={r} note={why} />
                    ))}
                </ul>
                <a href={`/repositories/#profession-${p.id}`}>All examples →</a>
              </article>
            ))}
          </div>
        </Section>
      )}

      <Section id="skills" kicker="Stack" title={role ? `Skills for ${role.name}` : 'Technologies'}>
        <Skills groups={groups} favorites={favoriteLanguages} />
      </Section>
    </Layout>
  );
}
