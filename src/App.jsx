import github from './data/github.json';
import habr from './data/habr.json';
import {
  achievements,
  education,
  experience,
  favoriteLanguages,
  featuredProjects,
  problemSolving,
  profile,
  publications,
  roles,
  skillGroups,
  socials,
} from './data/profile';
import { metaTheory } from './data/theory';
import Layout from './components/Layout';
import Section from './components/Section';
import Hero from './components/Hero';
import StatTiles from './components/StatTiles';
import Timeline from './components/Timeline';
import EcosystemMap from './components/EcosystemMap';
import ContributionsChart from './components/ContributionsChart';
import LanguagesChart from './components/LanguagesChart';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Registries from './components/Registries';
import { Education, Publications, StackOverflowCard } from './components/Community';
import ProblemSolving from './components/ProblemSolving';
import ProblemSolvingDiagram from './components/ProblemSolvingDiagram';
import MetaTheory from './components/MetaTheory';
import HabrCards from './components/HabrCards';
import LanguageCloud from './components/LanguageCloud';
import PageCards from './components/PageCards';
import Contacts from './components/Contacts';

const NAV = [
  ['experience', 'Experience'],
  ['theory', 'Theory'],
  ['method', 'Method'],
  ['ecosystem', 'Ecosystem'],
  ['activity', 'Activity'],
  ['skills', 'Skills'],
  ['projects', 'Projects'],
  ['packages', 'Packages'],
  ['habr', 'Articles'],
  ['community', 'Community'],
  ['explore', 'Pages'],
  ['contacts', 'Contacts'],
];

const languageSkills = skillGroups.find((g) => g.id === 'languages').items;

function App() {
  const lastYear = github.contributions[github.contributions.length - 1].year;
  return (
    <Layout page="home" sections={NAV}>
      <Hero profile={profile} github={github.profile} />
      <StatTiles github={github} codingSince={profile.codingSince} habr={habr} />

      <Section id="experience" kicker="01 · Career" title="Companies & ventures">
        <Timeline items={experience} endYear={lastYear} />
        <p className="section__more">
          Only one kind of experience is relevant? See it filtered by role:{' '}
          {roles.map((r, i) => (
            <span key={r.id}>
              {i > 0 && ' · '}
              <a href={`/experience/?role=${r.id}`}>{r.name}</a>
            </span>
          ))}
          .
        </p>
      </Section>

      <Section id="theory" kicker="02 · Theory" title="Links meta-theory">
        <MetaTheory theory={metaTheory} />
        <p className="section__more">
          <a href="/research/">Research page</a>: the theory in detail, formal proofs and other research repositories.
        </p>
      </Section>

      <Section id="method" kicker="03 · Method" title="Universal problem solving algorithm">
        <div className="method">
          <ProblemSolvingDiagram />
          <ProblemSolving steps={problemSolving} />
        </div>
      </Section>

      <Section id="ecosystem" kicker="04 · Organizations" title="Open-source ecosystem">
        <div className="split">
          <EcosystemMap owners={github.owners} avatarUrl={github.profile.avatarUrl} />
          <ul className="orgs">
            {github.owners.map((o) => (
              <li key={o.login} className="org">
                <a href={o.url} target="_blank" rel="noopener noreferrer" className="org__name">
                  {o.name}
                </a>
                <span className="org__meta">
                  since {o.createdAt.slice(0, 4)} · {o.repositories} repos · ★ {o.stars}
                </span>
                {o.description && <p className="org__desc">{o.description}</p>}
              </li>
            ))}
          </ul>
        </div>
        <p className="section__more">
          <a href="/repositories/">All {github.totals.ownRepositories} original repositories</a>, grouped by field and
          by IT profession.
        </p>
      </Section>

      <Section id="activity" kicker="05 · Activity" title="Contributions & languages">
        <div className="split split--wide">
          <ContributionsChart data={github.contributions} />
          <LanguagesChart languages={github.languages} favorites={favoriteLanguages} />
        </div>
        <LanguageCloud languages={github.languages} extra={languageSkills} favorites={favoriteLanguages} />
      </Section>

      <Section id="skills" kicker="06 · Stack" title="Technologies">
        <Skills groups={skillGroups} favorites={favoriteLanguages} />
      </Section>

      <Section id="projects" kicker="07 · Work" title="Featured projects">
        <Projects featured={featuredProjects} projects={github.projects} />
      </Section>

      <Section id="packages" kicker="08 · Distribution" title="Published packages">
        <Registries registries={github.registries} summary={github.packageRegistries} />
      </Section>

      <Section id="habr" kicker="09 · Writing" title="Articles on Habr">
        <HabrCards snapshot={habr} />
      </Section>

      <Section id="community" kicker="10 · Knowledge" title="Community, writing & education">
        <div className="cards">
          <StackOverflowCard so={github.stackOverflow} />
          <Publications items={publications} />
          <Education items={education} achievements={achievements} />
        </div>
      </Section>

      <Section id="explore" kicker="11 · Explore" title="More pages">
        <PageCards />
      </Section>

      <Section id="contacts" kicker="12 · Links" title="Contacts & social media">
        <Contacts socials={socials} />
      </Section>
    </Layout>
  );
}

export default App;
