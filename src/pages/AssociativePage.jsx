import Glyph from '../components/Glyph';
import Layout from '../components/Layout';
import RepoList, { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import { fields } from '../data/fields';
import { metaTheory } from '../data/theory';
import { inField, repo } from './repos';

const SECTIONS = [
  ['stack', 'Stack'],
  ['all', 'All associative repositories'],
];

// The associative stack from the bottom (theory) to the top (AI), every layer
// with the repositories that implement it.
export const STACK = [
  {
    id: 'theory',
    title: 'Theory',
    glyph: '00',
    summary: 'Everything is a link: a reference to a vector of references. One formula, L → L², covers all data.',
    repos: [
      ['link-foundation/meta-theory', 'The links meta-theory with versions, PDFs and proofs.'],
      ['deep-foundation/deep-theory', 'The original links theory formalized in Coq.'],
      ['link-foundation/meta-ontology', 'An ontology built only from links.'],
      ['link-foundation/relative-meta-logic', 'A probabilistic logic on top of links.'],
    ],
  },
  {
    id: 'notation',
    title: 'Notation & languages',
    glyph: '00 01',
    summary: 'A human readable way to write links, and languages that are themselves links.',
    repos: [
      ['link-foundation/links-notation', 'Links Notation (LiNo): describe any data with references and links.'],
      ['link-foundation/meta-notation', 'A notation for all languages at once.'],
      ['link-foundation/meta-language', 'A language that can describe any language, including itself.'],
      ['link-foundation/lino-objects-codec', 'Encode and decode objects as Links Notation.'],
      ['link-foundation/lino-arguments', 'Command line arguments as links.'],
      ['linksplatform/Data.Doublets.Lino', 'Import and export of doublets as Links Notation.'],
    ],
  },
  {
    id: 'storage',
    title: 'Storage engines',
    glyph: '00 11 01',
    summary: 'Doublet and triplet stores on memory-mapped files with size-balanced trees, in C#, C++ and Rust.',
    repos: [
      ['konard/LinksPlatform', 'The holistic system for storing and transforming information, started in 2010.'],
      ['linksplatform/Data.Doublets', 'The doublets (links) database engine in C#.'],
      ['linksplatform/doublets-rs', 'The doublets engine rewritten in Rust.'],
      ['linksplatform/Data.Triplets', 'The triplets engine: links with a type.'],
      ['linksplatform/Memory', 'Memory-mapped files and raw memory blocks for links.'],
      ['linksplatform/mem-rs', 'The memory layer in Rust.'],
      ['linksplatform/trees-rs', 'Size-balanced trees in Rust, the indexes of links.'],
      ['linksplatform/Collections', 'Collections and bit structures the engines are built from.'],
    ],
  },
  {
    id: 'tools',
    title: 'Query & tools',
    glyph: '00 01 22',
    summary: 'Ways to read and change links: a CLI, an SQL-like language, GraphQL and queues.',
    repos: [
      ['link-foundation/link-cli', 'A CLI tool to manipulate links.'],
      ['link-foundation/linksql', 'SQL on top of links.'],
      ['linksplatform/Data.Doublets.Gql', 'GraphQL access to a doublets store.'],
      ['link-foundation/links-queue', 'A message queue made of links.'],
      ['linksplatform/Data.Doublets.Sequences', 'Strings and sequences as nested doublets.'],
    ],
  },
  {
    id: 'benchmarks',
    title: 'Benchmarks',
    glyph: '01 10',
    summary: 'Doublets compared with relational, graph and key-value databases on the same operations.',
    repos: [
      ['linksplatform/Comparisons.SQLiteVSDoublets', 'Doublets against SQLite.'],
      ['linksplatform/Comparisons.PostgreSQLVSDoublets', 'Doublets against PostgreSQL.'],
      ['linksplatform/Comparisons.Neo4jVSDoublets', 'Doublets against Neo4j.'],
      ['linksplatform/Comparisons.RedisVSDoublets', 'Doublets against Redis.'],
    ],
  },
  {
    id: 'platform',
    title: 'Deep platform',
    glyph: '01 12 20',
    summary: 'Deep: links in PostgreSQL with Hasura, handlers in any language and a visual client.',
    repos: [
      ['deep-foundation/deeplinks', 'The core of Deep: links storage, permissions and handlers.'],
      ['deep-foundation/deepcase-app', 'Deep.Case, the visual client for the links of Deep.'],
      ['deep-foundation/sdk', 'The SDK to build applications on Deep.'],
      ['deep-foundation/deepclient', 'Connect your favourite language with Deep.'],
      ['deep-foundation/dev', 'A monorepository to develop the whole platform.'],
    ],
  },
  {
    id: 'ai',
    title: 'AI on links',
    glyph: '01 12 23 30',
    summary: 'Agents and inference that use links as their memory: the automation of automation.',
    repos: [
      ['link-assistant/hive-mind', 'The AI that controls AIs to do the automation of automation.'],
      ['link-assistant/agent', 'A thin coding agent based on OpenCode.'],
      ['link-assistant/formal-ai', 'Know just enough to get to know anything.'],
      ['link-foundation/rules-inference', 'Rules inferred from events and requirements.'],
      ['konard/associative-markov-network', 'Markov chains stored as an associative network.'],
    ],
  },
];

const assocFields = fields.filter((f) =>
  ['associative', 'data', 'systems', 'ai', 'languages', 'research'].includes(f.id),
);

/** The associative stack: theory, notation, storage, tools, benchmarks, platform and AI. */
export default function AssociativePage() {
  const all = inField('associative');
  return (
    <Layout page="associative" sections={SECTIONS}>
      <header className="page-hero" id="top">
        <p className="section__kicker">Associative technologies</p>
        <h1 className="page-hero__title">The associative stack</h1>
        <p className="page-hero__lead">
          Since 2010: {all.length} repositories that store, query and reason about data as links ({metaTheory.tldr}).
          The layers below go from the theory up to the AI that uses links as its memory.
        </p>
      </header>

      <Section id="stack" kicker="Layers" title="From theory to AI">
        <ol className="stack">
          {[...STACK].reverse().map((layer) => (
            <li key={layer.id} className="stack__layer" id={`layer-${layer.id}`}>
              <div className="stack__head">
                <Glyph code={layer.glyph} size={44} />
                <div>
                  <h3>{layer.title}</h3>
                  <p className="muted">{layer.summary}</p>
                </div>
              </div>
              <ul className="repos repos--compact" aria-label={layer.title}>
                {layer.repos
                  .map(([name, note]) => [repo(name), note])
                  .filter(([r]) => r)
                  .map(([r, note]) => (
                    <RepoItem key={r.fullName} repo={r} note={note} />
                  ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="all" kicker="Catalog" title="All associative repositories">
        <RepoList items={all} label="Associative repositories" fieldOptions={assocFields} showKinds={false} />
      </Section>
    </Layout>
  );
}
