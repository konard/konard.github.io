import Layout from '../components/Layout';
import MetaTheory from '../components/MetaTheory';
import NetworkGallery from '../components/NetworkGallery';
import ProblemSolving from '../components/ProblemSolving';
import ProblemSolvingDiagram from '../components/ProblemSolvingDiagram';
import RepoList, { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import { fields } from '../data/fields';
import { problemSolving, problemSolvingNotes } from '../data/profile';
import { metaTheory } from '../data/theory';
import { inField, ownRepositories, repo } from './repos';

const SECTIONS = [
  ['theory', 'Links theory'],
  ['symbols', 'Link symbols'],
  ['method', 'Problem solving'],
  ['highlights', 'Highlights'],
  ['laws', 'Laws as data'],
  ['all', 'All research'],
];

// The research repositories worth a look first, grouped by question.
export const HIGHLIGHTS = [
  {
    title: 'Computational complexity',
    repos: [
      ['konard/p-vs-np', 'An experiment to prove or disprove P = NP, formalized in the Rocq (Coq) prover.'],
      ['konard/tsp', 'Solutions of the travelling salesman problem, the classic NP-hard optimization.'],
      ['konard/subset-sum', 'The simplest NP-hard problem, solved and measured in Rust.'],
      ['konard/sat', 'Boolean satisfiability experiments, the first NP-complete problem.'],
      ['konard/hash-inversion', 'A prototype of hash inversion: how hard is it really to run a hash backwards?'],
      ['link-foundation/network-isomorphism-solver', 'Graph (network) isomorphism, solved on links.'],
    ],
  },
  {
    title: 'Physics & nature',
    repos: [
      ['konard/physical-unified-theory', 'A grand unified theory of everything for physics, built on links.'],
      ['konard/gravity-simulation', 'Gravity simulated in Rust + WebAssembly right in the browser.'],
      ['konard/wave-simulation', 'Simulations of waves and interference.'],
      ['konard/fractal-interference', 'Visualization of fractal interference patterns.'],
      [
        'konard/solar-thermophotovoltaic-cell',
        'An idea for the most efficient conversion of solar energy to electricity.',
      ],
      ['konard/spacecraft', 'A concept of an autonomous spacecraft.'],
    ],
  },
  {
    title: 'Mathematics & logic',
    repos: [
      ['link-foundation/meta-theory', 'The links meta-theory: one formula, L → L², for every kind of data.'],
      ['deep-foundation/deep-theory', 'The original links theory with proofs in Coq.'],
      [
        'link-foundation/relative-meta-logic',
        'A logic that reasons about anything relative to the probability of its inputs.',
      ],
      [
        'konard/sets-paradox',
        'An attempt to solve Russell’s paradox of the set of sets that do not contain themselves.',
      ],
      ['konard/primes', 'Experiments with prime numbers.'],
      ['konard/golden-ratio', 'Computing φ, the golden ratio.'],
    ],
  },
  {
    title: 'Inference & AI',
    repos: [
      ['konard/problem-solving', 'The universal problem solving algorithm described above.'],
      ['link-assistant/formal-ai', 'Do not know everything, know just enough to get to know anything.'],
      ['linksplatform/Solver', 'Searches the shortest and simplest functions for given inputs and outputs.'],
      ['link-foundation/rules-inference', 'Infers rules from events, changes and requirements.'],
      ['link-foundation/grammar-inference', 'Infers a grammar from many examples of text in one domain.'],
      ['konard/immortality', 'A draft plan for immortality.'],
    ],
  },
];

// Laws treated as data: codices as datasets, verdicts as training data, bots on top.
export const LAWS = [
  ['deep-foundation/russian-laws', 'Russian codices as a structured dataset for links and search.'],
  ['konard/russian-law', 'The active law of Russia as HTML for analysis and diffs.'],
  ['konard/verdicts', 'Court verdicts collected for statistics and prediction.'],
  ['link-assistant/semantic-primes', 'Semantic primes: towards a formal universal ontology for legal and other texts.'],
  ['konard/price-power-law-inference', 'Inference of power-law graphs from historical prices.'],
  ['deep-foundation/russian-laws-bot', 'A bot that answers questions with articles of Russian law.'],
  ['konard/verdicts-bot', 'A bot over the collected court verdicts.'],
  ['link-assistant/legal', 'An AI legal assistant.'],
  ['konard/3-ndfl', 'Generation of the 3-NDFL tax declaration for dividends.'],
];

const researchFields = fields.filter((f) => ['research', 'legal', 'associative', 'ml', 'ai'].includes(f.id));
const research = ownRepositories.filter((r) => r.fields.includes('research') || r.fields.includes('legal'));

function Picks({ list, label }) {
  return (
    <ul className="repos repos--compact" aria-label={label}>
      {list
        .map(([name, note]) => [repo(name), note])
        .filter(([r]) => r)
        .map(([r, note]) => (
          <RepoItem key={r.fullName} repo={r} note={note} />
        ))}
    </ul>
  );
}

/** Research: the links theory, the problem solving method, open problems, physics and laws as data science. */
export default function ResearchPage() {
  return (
    <Layout page="research" sections={SECTIONS}>
      <header className="page-hero" id="top">
        <p className="section__kicker">Research</p>
        <h1 className="page-hero__title">Research & theory</h1>
        <p className="page-hero__lead">
          {inField('research').length} research repositories: a meta-theory of links that can describe any data, a
          universal algorithm to solve any problem, experiments with P vs NP and the travelling salesman problem,
          physics simulations and {inField('legal').length} projects that treat laws as data.
        </p>
      </header>

      <Section id="theory" kicker="Meta-theory" title="The links meta-theory">
        <MetaTheory theory={metaTheory} detailed />
      </Section>

      <Section id="symbols" kicker="Links theory" title="Every configuration of 1–4 links">
        <NetworkGallery />
      </Section>

      <Section id="method" kicker="Method" title="Universal problem solving algorithm">
        <p className="section__lead">
          Every project here is built the same way: decompose the problem, experiment against tests, select what passes
          and compose it back. The algorithm is recursive and applies to itself, so it produces plans, algorithms and
          better requirements as well as solutions.
        </p>
        <ProblemSolvingDiagram />
        <ProblemSolving steps={problemSolving} notes={problemSolvingNotes} />
      </Section>

      <Section id="highlights" kicker="Open questions" title="Highlighted research">
        <div className="profession-grid">
          {HIGHLIGHTS.map((h) => (
            <article key={h.title} className="profession">
              <h3>{h.title}</h3>
              <Picks list={h.repos} label={h.title} />
            </article>
          ))}
        </div>
      </Section>

      <Section id="laws" kicker="Data science" title="Laws as data science">
        <p className="section__lead">
          Laws, verdicts and tax rules are a large, versioned and well-structured corpus. Turning them into datasets
          makes them searchable, comparable between countries and usable for statistics, bots and AI assistants.
        </p>
        <Picks list={LAWS} label="Laws as data science" />
      </Section>

      <Section id="all" kicker="Catalog" title="All research repositories">
        <RepoList items={research} label="Research repositories" fieldOptions={researchFields} showKinds={false} />
      </Section>
    </Layout>
  );
}
