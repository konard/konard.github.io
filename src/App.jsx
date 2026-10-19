import './App.css';
import './App.sections.css';
// Responsive and print overrides must come last.
import './App.media.css';
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
  skillGroups,
  socials,
} from './data/profile';
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
import Contacts from './components/Contacts';

const NAV = [
  ['experience', 'Experience'],
  ['ecosystem', 'Ecosystem'],
  ['activity', 'Activity'],
  ['skills', 'Skills'],
  ['projects', 'Projects'],
  ['packages', 'Packages'],
  ['community', 'Community'],
  ['contacts', 'Contacts'],
];

function App() {
  const lastYear = github.contributions[github.contributions.length - 1].year;
  return (
    <div className="app">
      <div className="backdrop" aria-hidden="true" />
      <nav className="nav" aria-label="Sections">
        <a className="nav__brand mono" href="#top">
          konard<span className="nav__cursor">_</span>
        </a>
        <ul>
          {NAV.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <main>
        <Hero profile={profile} github={github.profile} />
        <StatTiles github={github} codingSince={profile.codingSince} habr={habr} />

        <Section id="experience" kicker="01 · Career" title="Companies & ventures">
          <Timeline items={experience} endYear={lastYear} />
        </Section>

        <Section id="ecosystem" kicker="02 · Organizations" title="Open-source ecosystem">
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
        </Section>

        <Section id="activity" kicker="03 · Activity" title="Contributions & languages">
          <div className="split split--wide">
            <ContributionsChart data={github.contributions} />
            <LanguagesChart languages={github.languages} favorites={favoriteLanguages} />
          </div>
        </Section>

        <Section id="skills" kicker="04 · Stack" title="Technologies">
          <Skills groups={skillGroups} favorites={favoriteLanguages} />
        </Section>

        <Section id="projects" kicker="05 · Work" title="Featured projects">
          <Projects featured={featuredProjects} projects={github.projects} />
        </Section>

        <Section id="packages" kicker="06 · Distribution" title="Published packages">
          <Registries registries={github.registries} />
        </Section>

        <Section id="community" kicker="07 · Knowledge" title="Community, writing & education">
          <div className="cards">
            <StackOverflowCard so={github.stackOverflow} />
            <Publications items={publications} />
            <Education items={education} achievements={achievements} />
          </div>
        </Section>

        <Section id="method" kicker="08 · Method" title="Universal problem solving algorithm">
          <ProblemSolving steps={problemSolving} />
        </Section>

        <Section id="contacts" kicker="09 · Links" title="Contacts & social media">
          <Contacts socials={socials} />
        </Section>
      </main>

      <footer className="footer">
        <span className="mono">{profile.motto}</span>
        <span>
          Data: public GitHub, Habr Career, CodersRank, Stack Overflow, npm, crates.io and NuGet ·{' '}
          <a href="https://github.com/konard/konard.github.io" target="_blank" rel="noopener noreferrer">
            source
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
