import Glyph from '../components/Glyph';
import Layout from '../components/Layout';
import RepoList, { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import { useLang } from '../i18n/prefs';
import { useNotation } from '../links/notation';
import { plural } from '../i18n/plural';
import { fields } from '../data/fields';
import { metaTheory } from '../data/theory';
import { inField, repo } from './repos';

const SECTIONS = [
  ['stack', { en: 'Stack', ru: 'Стек' }],
  ['all', { en: 'All associative repositories', ru: 'Все ассоциативные репозитории' }],
];

// The associative stack from the bottom (theory) to the top (AI), every layer
// with the repositories that implement it.
export const STACK = [
  {
    id: 'theory',
    title: { en: 'Theory', ru: 'Теория' },
    glyph: '11',
    summary: {
      en: 'Everything is a link: a reference to a vector of references. One formula, L → L², covers all data.',
      ru: 'Всё есть связь: ссылка на вектор ссылок. Одна формула, L → L², описывает любые данные.',
    },
    repos: [
      [
        'link-foundation/meta-theory',
        {
          en: 'The links meta-theory with versions, PDFs and proofs.',
          ru: 'Метатеория связей с версиями, PDF и доказательствами.',
        },
      ],
      [
        'deep-foundation/deep-theory',
        { en: 'The original links theory formalized in Coq.', ru: 'Исходная теория связей, формализованная на Coq.' },
      ],
      [
        'link-foundation/meta-ontology',
        { en: 'An ontology built only from links.', ru: 'Онтология, построенная только из связей.' },
      ],
      [
        'link-foundation/relative-meta-logic',
        { en: 'A probabilistic logic on top of links.', ru: 'Вероятностная логика поверх связей.' },
      ],
    ],
  },
  {
    id: 'notation',
    title: { en: 'Notation & languages', ru: 'Нотация и языки' },
    glyph: '11 12',
    summary: {
      en: 'A human readable way to write links, and languages that are themselves links.',
      ru: 'Понятный человеку способ записывать связи и языки, которые сами состоят из связей.',
    },
    repos: [
      [
        'link-foundation/links-notation',
        {
          en: 'Links Notation (LiNo): describe any data with references and links.',
          ru: 'Links Notation (LiNo): описание любых данных ссылками и связями.',
        },
      ],
      [
        'link-foundation/meta-notation',
        { en: 'A notation for all languages at once.', ru: 'Нотация сразу для всех языков.' },
      ],
      [
        'link-foundation/meta-language',
        {
          en: 'A language that can describe any language, including itself.',
          ru: 'Язык, способный описать любой язык, включая самого себя.',
        },
      ],
      [
        'link-foundation/lino-objects-codec',
        {
          en: 'Encode and decode objects as Links Notation.',
          ru: 'Кодирование и декодирование объектов в Links Notation.',
        },
      ],
      [
        'link-foundation/lino-arguments',
        { en: 'Command line arguments as links.', ru: 'Аргументы командной строки как связи.' },
      ],
      [
        'linksplatform/Data.Doublets.Lino',
        { en: 'Import and export of doublets as Links Notation.', ru: 'Импорт и экспорт дуплетов в Links Notation.' },
      ],
    ],
  },
  {
    id: 'storage',
    title: { en: 'Storage engines', ru: 'Движки хранения' },
    glyph: '11 22 12',
    summary: {
      en: 'Doublet and triplet stores on memory-mapped files with size-balanced trees, in C#, C++ and Rust.',
      ru: 'Хранилища дуплетов и триплетов на отображаемых в память файлах с деревьями, сбалансированными по размеру, на C#, C++ и Rust.',
    },
    repos: [
      [
        'konard/LinksPlatform',
        {
          en: 'The holistic system for storing and transforming information, started in 2010.',
          ru: 'Целостная система хранения и преобразования информации, начатая в 2010 году.',
        },
      ],
      [
        'linksplatform/Data.Doublets',
        { en: 'The doublets (links) database engine in C#.', ru: 'Движок базы данных дуплетов (связей) на C#.' },
      ],
      [
        'linksplatform/doublets-rs',
        { en: 'The doublets engine rewritten in Rust.', ru: 'Движок дуплетов, переписанный на Rust.' },
      ],
      [
        'linksplatform/Data.Triplets',
        { en: 'The triplets engine: links with a type.', ru: 'Движок триплетов: связи с типом.' },
      ],
      [
        'linksplatform/Memory',
        {
          en: 'Memory-mapped files and raw memory blocks for links.',
          ru: 'Отображаемые в память файлы и блоки памяти для связей.',
        },
      ],
      ['linksplatform/mem-rs', { en: 'The memory layer in Rust.', ru: 'Слой памяти на Rust.' }],
      [
        'linksplatform/trees-rs',
        {
          en: 'Size-balanced trees in Rust, the indexes of links.',
          ru: 'Деревья, сбалансированные по размеру, на Rust — индексы связей.',
        },
      ],
      [
        'linksplatform/Collections',
        {
          en: 'Collections and bit structures the engines are built from.',
          ru: 'Коллекции и битовые структуры, из которых собраны движки.',
        },
      ],
    ],
  },
  {
    id: 'tools',
    title: { en: 'Query & tools', ru: 'Запросы и инструменты' },
    glyph: '11 12 33',
    summary: {
      en: 'Ways to read and change links: a CLI, an SQL-like language, GraphQL and queues.',
      ru: 'Способы читать и менять связи: CLI, SQL-подобный язык, GraphQL и очереди.',
    },
    repos: [
      [
        'link-foundation/link-cli',
        { en: 'A CLI tool to manipulate links.', ru: 'Инструмент командной строки для работы со связями.' },
      ],
      ['link-foundation/linksql', { en: 'SQL on top of links.', ru: 'SQL поверх связей.' }],
      [
        'linksplatform/Data.Doublets.Gql',
        { en: 'GraphQL access to a doublets store.', ru: 'Доступ к хранилищу дуплетов через GraphQL.' },
      ],
      ['link-foundation/links-queue', { en: 'A message queue made of links.', ru: 'Очередь сообщений из связей.' }],
      [
        'linksplatform/Data.Doublets.Sequences',
        { en: 'Strings and sequences as nested doublets.', ru: 'Строки и последовательности как вложенные дуплеты.' },
      ],
    ],
  },
  {
    id: 'benchmarks',
    title: { en: 'Benchmarks', ru: 'Бенчмарки' },
    glyph: '12 21',
    summary: {
      en: 'Doublets compared with relational, graph and key-value databases on the same operations.',
      ru: 'Дуплеты в сравнении с реляционными, графовыми и key-value базами данных на одних и тех же операциях.',
    },
    repos: [
      ['linksplatform/Comparisons.SQLiteVSDoublets', { en: 'Doublets against SQLite.', ru: 'Дуплеты против SQLite.' }],
      [
        'linksplatform/Comparisons.PostgreSQLVSDoublets',
        { en: 'Doublets against PostgreSQL.', ru: 'Дуплеты против PostgreSQL.' },
      ],
      ['linksplatform/Comparisons.Neo4jVSDoublets', { en: 'Doublets against Neo4j.', ru: 'Дуплеты против Neo4j.' }],
      ['linksplatform/Comparisons.RedisVSDoublets', { en: 'Doublets against Redis.', ru: 'Дуплеты против Redis.' }],
    ],
  },
  {
    id: 'platform',
    title: { en: 'Deep platform', ru: 'Платформа Deep' },
    glyph: '12 23 31',
    summary: {
      en: 'Deep: links in PostgreSQL with Hasura, handlers in any language and a visual client.',
      ru: 'Deep: связи в PostgreSQL с Hasura, обработчики на любом языке и визуальный клиент.',
    },
    repos: [
      [
        'deep-foundation/deeplinks',
        {
          en: 'The core of Deep: links storage, permissions and handlers.',
          ru: 'Ядро Deep: хранилище связей, права доступа и обработчики.',
        },
      ],
      [
        'deep-foundation/deepcase-app',
        {
          en: 'Deep.Case, the visual client for the links of Deep.',
          ru: 'Deep.Case — визуальный клиент для связей Deep.',
        },
      ],
      [
        'deep-foundation/sdk',
        { en: 'The SDK to build applications on Deep.', ru: 'SDK для создания приложений на Deep.' },
      ],
      [
        'deep-foundation/deepclient',
        { en: 'Connect your favourite language with Deep.', ru: 'Подключите свой любимый язык к Deep.' },
      ],
      [
        'deep-foundation/dev',
        { en: 'A monorepository to develop the whole platform.', ru: 'Монорепозиторий для разработки всей платформы.' },
      ],
    ],
  },
  {
    id: 'ai',
    title: { en: 'AI on links', ru: 'ИИ на связях' },
    glyph: '12 23 34 41',
    summary: {
      en: 'Agents and inference that use links as their memory: the automation of automation.',
      ru: 'Агенты и логический вывод, использующие связи как память: автоматизация автоматизации.',
    },
    repos: [
      [
        'link-assistant/hive-mind',
        {
          en: 'The AI that controls AIs to do the automation of automation.',
          ru: 'ИИ, который управляет другими ИИ ради автоматизации автоматизации.',
        },
      ],
      [
        'link-assistant/agent',
        { en: 'A thin coding agent based on OpenCode.', ru: 'Лёгкий агент для программирования на основе OpenCode.' },
      ],
      [
        'link-assistant/formal-ai',
        { en: 'Know just enough to get to know anything.', ru: 'Знать ровно столько, чтобы узнать что угодно.' },
      ],
      [
        'link-foundation/rules-inference',
        { en: 'Rules inferred from events and requirements.', ru: 'Правила, выведенные из событий и требований.' },
      ],
      [
        'konard/associative-markov-network',
        {
          en: 'Markov chains stored as an associative network.',
          ru: 'Цепи Маркова, хранящиеся как ассоциативная сеть.',
        },
      ],
    ],
  },
];

const REPOSITORIES = { en: ['repository', 'repositories'], ru: ['репозиторий', 'репозитория', 'репозиториев'] };

const assocFields = fields.filter((f) =>
  ['associative', 'data', 'systems', 'ai', 'languages', 'research'].includes(f.id),
);

/** The associative stack: theory, notation, storage, tools, benchmarks, platform and AI. */
export default function AssociativePage() {
  const { lang, t } = useLang();
  const { n } = useNotation();
  const all = inField('associative');
  return (
    <Layout page="associative" sections={SECTIONS}>
      <header className="page-hero" id="top">
        <p className="section__kicker">{t({ en: 'Associative technologies', ru: 'Ассоциативные технологии' })}</p>
        <h1 className="page-hero__title">{t({ en: 'The associative stack', ru: 'Ассоциативный стек' })}</h1>
        <p className="page-hero__lead">
          {t({
            en: `Since 2010: ${all.length} repositories that store, query and reason about data as links (${n(metaTheory.tldr)}). The layers below go from the theory up to the AI that uses links as its memory.`,
            ru: `С 2010 года: ${all.length} ${plural(all.length, lang, REPOSITORIES)}, которые хранят данные как связи, выполняют по ним запросы и рассуждают о них (${n(metaTheory.tldr)}). Слои ниже идут от теории до ИИ, который использует связи как свою память.`,
          })}
        </p>
      </header>

      <Section
        id="stack"
        kicker={{ en: 'Layers', ru: 'Слои' }}
        title={{ en: 'From theory to AI', ru: 'От теории до ИИ' }}
      >
        <ol className="stack">
          {[...STACK].reverse().map((layer) => (
            <li key={layer.id} className="stack__layer" id={`layer-${layer.id}`}>
              <div className="stack__head">
                <Glyph code={layer.glyph} size={44} />
                <div>
                  <h3>{t(layer.title)}</h3>
                  <p className="muted">{n(t(layer.summary))}</p>
                </div>
              </div>
              <ul className="repos repos--compact" aria-label={t(layer.title)}>
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

      <Section
        id="all"
        kicker={{ en: 'Catalog', ru: 'Каталог' }}
        title={{ en: 'All associative repositories', ru: 'Все ассоциативные репозитории' }}
      >
        <RepoList
          items={all}
          label={{ en: 'Associative repositories', ru: 'Ассоциативные репозитории' }}
          fieldOptions={assocFields}
          showKinds={false}
        />
      </Section>
    </Layout>
  );
}
