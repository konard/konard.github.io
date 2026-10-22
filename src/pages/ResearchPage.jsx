import Layout from '../components/Layout';
import MetaTheory from '../components/MetaTheory';
import NetworkGallery from '../components/NetworkGallery';
import ProblemSolving from '../components/ProblemSolving';
import ProblemSolvingDiagram from '../components/ProblemSolvingDiagram';
import RepoList, { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import { tr, useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { fields } from '../data/fields';
import { problemSolving, problemSolvingNotes } from '../data/profile';
import { metaTheory } from '../data/theory';
import { inField, ownRepositories, repo } from './repos';

const SECTIONS = [
  ['theory', { en: 'Links theory', ru: 'Теория связей' }],
  ['symbols', { en: 'Link symbols', ru: 'Символы связей' }],
  ['method', { en: 'Problem solving', ru: 'Решение задач' }],
  ['highlights', { en: 'Highlights', ru: 'Главное' }],
  ['laws', { en: 'Laws as data', ru: 'Законы как данные' }],
  ['all', { en: 'All research', ru: 'Все исследования' }],
];

// The research repositories worth a look first, grouped by question.
export const HIGHLIGHTS = [
  {
    title: { en: 'Computational complexity', ru: 'Вычислительная сложность' },
    repos: [
      [
        'konard/p-vs-np',
        {
          en: 'An experiment to prove or disprove P = NP, formalized in the Rocq (Coq) prover.',
          ru: 'Эксперимент по доказательству или опровержению P = NP, формализованный в системе доказательств Rocq (Coq).',
        },
      ],
      [
        'konard/tsp',
        {
          en: 'Solutions of the travelling salesman problem, the classic NP-hard optimization.',
          ru: 'Решения задачи коммивояжёра — классической NP-трудной задачи оптимизации.',
        },
      ],
      [
        'konard/subset-sum',
        {
          en: 'The simplest NP-hard problem, solved and measured in Rust.',
          ru: 'Простейшая NP-трудная задача, решённая и измеренная на Rust.',
        },
      ],
      [
        'konard/sat',
        {
          en: 'Boolean satisfiability experiments, the first NP-complete problem.',
          ru: 'Эксперименты с выполнимостью булевых формул — первой NP-полной задачей.',
        },
      ],
      [
        'konard/hash-inversion',
        {
          en: 'A prototype of hash inversion: how hard is it really to run a hash backwards?',
          ru: 'Прототип обращения хеша: насколько на самом деле трудно вычислить хеш в обратную сторону?',
        },
      ],
      [
        'link-foundation/network-isomorphism-solver',
        { en: 'Graph (network) isomorphism, solved on links.', ru: 'Изоморфизм графов (сетей), решённый на связях.' },
      ],
    ],
  },
  {
    title: { en: 'Physics & nature', ru: 'Физика и природа' },
    repos: [
      [
        'konard/physical-unified-theory',
        {
          en: 'A grand unified theory of everything for physics, built on links.',
          ru: 'Великая единая теория всего для физики, построенная на связях.',
        },
      ],
      [
        'konard/gravity-simulation',
        {
          en: 'Gravity simulated in Rust + WebAssembly right in the browser.',
          ru: 'Симуляция гравитации на Rust + WebAssembly прямо в браузере.',
        },
      ],
      [
        'konard/wave-simulation',
        { en: 'Simulations of waves and interference.', ru: 'Симуляции волн и интерференции.' },
      ],
      [
        'konard/fractal-interference',
        {
          en: 'Visualization of fractal interference patterns.',
          ru: 'Визуализация фрактальных интерференционных узоров.',
        },
      ],
      [
        'konard/solar-thermophotovoltaic-cell',
        {
          en: 'An idea for the most efficient conversion of solar energy to electricity.',
          ru: 'Идея самого эффективного преобразования солнечной энергии в электричество.',
        },
      ],
      [
        'konard/spacecraft',
        { en: 'A concept of an autonomous spacecraft.', ru: 'Концепция автономного космического корабля.' },
      ],
    ],
  },
  {
    title: { en: 'Mathematics & logic', ru: 'Математика и логика' },
    repos: [
      [
        'link-foundation/meta-theory',
        {
          en: 'The links meta-theory: one formula, L → L², for every kind of data.',
          ru: 'Метатеория связей: одна формула, L → L², для любых данных.',
        },
      ],
      [
        'deep-foundation/deep-theory',
        {
          en: 'The original links theory with proofs in Coq.',
          ru: 'Исходная теория связей с доказательствами на Coq.',
        },
      ],
      [
        'link-foundation/relative-meta-logic',
        {
          en: 'A logic that reasons about anything relative to the probability of its inputs.',
          ru: 'Логика, которая рассуждает о чём угодно относительно вероятности своих входных данных.',
        },
      ],
      [
        'konard/sets-paradox',
        {
          en: 'An attempt to solve Russell’s paradox of the set of sets that do not contain themselves.',
          ru: 'Попытка решить парадокс Рассела о множестве всех множеств, не содержащих себя.',
        },
      ],
      ['konard/primes', { en: 'Experiments with prime numbers.', ru: 'Эксперименты с простыми числами.' }],
      ['konard/golden-ratio', { en: 'Computing φ, the golden ratio.', ru: 'Вычисление φ — золотого сечения.' }],
    ],
  },
  {
    title: { en: 'Inference & AI', ru: 'Вывод и ИИ' },
    repos: [
      [
        'konard/problem-solving',
        {
          en: 'The universal problem solving algorithm described above.',
          ru: 'Универсальный алгоритм решения задач, описанный выше.',
        },
      ],
      [
        'link-assistant/formal-ai',
        {
          en: 'Do not know everything, know just enough to get to know anything.',
          ru: 'Не знать всё, а знать ровно столько, чтобы узнать что угодно.',
        },
      ],
      [
        'linksplatform/Solver',
        {
          en: 'Searches the shortest and simplest functions for given inputs and outputs.',
          ru: 'Ищет самые короткие и простые функции для заданных входов и выходов.',
        },
      ],
      [
        'link-foundation/rules-inference',
        {
          en: 'Infers rules from events, changes and requirements.',
          ru: 'Выводит правила из событий, изменений и требований.',
        },
      ],
      [
        'link-foundation/grammar-inference',
        {
          en: 'Infers a grammar from many examples of text in one domain.',
          ru: 'Выводит грамматику из множества примеров текста одной предметной области.',
        },
      ],
      ['konard/immortality', { en: 'A draft plan for immortality.', ru: 'Черновой план бессмертия.' }],
    ],
  },
];

// Laws treated as data: codices as datasets, verdicts as training data, bots on top.
export const LAWS = [
  [
    'deep-foundation/russian-laws',
    {
      en: 'Russian codices as a structured dataset for links and search.',
      ru: 'Кодексы России как структурированный набор данных для связей и поиска.',
    },
  ],
  [
    'konard/russian-law',
    {
      en: 'The active law of Russia as HTML for analysis and diffs.',
      ru: 'Действующее законодательство России в HTML для анализа и сравнения редакций.',
    },
  ],
  [
    'konard/verdicts',
    {
      en: 'Court verdicts collected for statistics and prediction.',
      ru: 'Судебные решения, собранные для статистики и прогнозов.',
    },
  ],
  [
    'link-assistant/semantic-primes',
    {
      en: 'Semantic primes: towards a formal universal ontology for legal and other texts.',
      ru: 'Семантические примитивы: на пути к формальной универсальной онтологии для юридических и других текстов.',
    },
  ],
  [
    'konard/price-power-law-inference',
    {
      en: 'Inference of power-law graphs from historical prices.',
      ru: 'Вывод степенных графиков из исторических цен.',
    },
  ],
  [
    'deep-foundation/russian-laws-bot',
    {
      en: 'A bot that answers questions with articles of Russian law.',
      ru: 'Бот, который отвечает на вопросы статьями российских законов.',
    },
  ],
  [
    'konard/verdicts-bot',
    { en: 'A bot over the collected court verdicts.', ru: 'Бот по собранным судебным решениям.' },
  ],
  ['link-assistant/legal', { en: 'An AI legal assistant.', ru: 'ИИ-помощник юриста.' }],
  [
    'konard/3-ndfl',
    {
      en: 'Generation of the 3-NDFL tax declaration for dividends.',
      ru: 'Формирование декларации 3-НДФЛ по дивидендам.',
    },
  ],
];

const RESEARCH_REPOSITORIES = {
  en: ['research repository', 'research repositories'],
  ru: ['исследовательский репозиторий', 'исследовательских репозитория', 'исследовательских репозиториев'],
};
const PROJECTS = { en: ['project', 'projects'], ru: ['проект', 'проекта', 'проектов'] };

const researchFields = fields.filter((f) => ['research', 'legal', 'associative', 'ml', 'ai'].includes(f.id));
const research = ownRepositories.filter((r) => r.fields.includes('research') || r.fields.includes('legal'));

function Picks({ list, label }) {
  const { t } = useLang();
  return (
    <ul className="repos repos--compact" aria-label={t(label)}>
      {list
        .map(([name, note]) => [repo(name), note])
        .filter(([r]) => r)
        .map(([r, note]) => (
          <RepoItem key={r.fullName} repo={r} note={note} />
        ))}
    </ul>
  );
}

const LAWS_TITLE = { en: 'Laws as data science', ru: 'Законы как наука о данных' };

/** Research: the links theory, the problem solving method, open problems, physics and laws as data science. */
export default function ResearchPage() {
  const { lang, t } = useLang();
  const researchCount = inField('research').length;
  const legalCount = inField('legal').length;
  return (
    <Layout page="research" sections={SECTIONS}>
      <header className="page-hero" id="top">
        <p className="section__kicker">{t({ en: 'Research', ru: 'Исследования' })}</p>
        <h1 className="page-hero__title">{t({ en: 'Research & theory', ru: 'Исследования и теория' })}</h1>
        <p className="page-hero__lead">
          {t({
            en: `${researchCount} research repositories: a meta-theory of links that can describe any data, a universal algorithm to solve any problem, experiments with P vs NP and the travelling salesman problem, physics simulations and ${legalCount} projects that treat laws as data.`,
            ru: `${researchCount} ${plural(researchCount, lang, RESEARCH_REPOSITORIES)}: метатеория связей, способная описать любые данные, универсальный алгоритм решения любых задач, эксперименты с P vs NP и задачей коммивояжёра, физические симуляции и ${legalCount} ${plural(legalCount, lang, PROJECTS)}, в которых законы — это данные.`,
          })}
        </p>
      </header>

      <Section
        id="theory"
        kicker={{ en: 'Meta-theory', ru: 'Метатеория' }}
        title={{ en: 'The links meta-theory', ru: 'Метатеория связей' }}
      >
        <MetaTheory theory={metaTheory} detailed />
      </Section>

      <Section
        id="symbols"
        kicker={{ en: 'Links theory', ru: 'Теория связей' }}
        title={{ en: 'Every configuration of 1–4 links', ru: 'Все конфигурации из 1–4 связей' }}
      >
        <NetworkGallery />
      </Section>

      <Section
        id="method"
        kicker={{ en: 'Method', ru: 'Метод' }}
        title={{ en: 'Universal problem solving algorithm', ru: 'Универсальный алгоритм решения задач' }}
      >
        <p className="section__lead">
          {t({
            en: 'Every project here is built the same way: decompose the problem, experiment against tests, select what passes and compose it back. The algorithm is recursive and applies to itself, so it produces plans, algorithms and better requirements as well as solutions.',
            ru: 'Каждый проект здесь построен одинаково: разложить задачу на части, поставить эксперименты против тестов, отобрать то, что их проходит, и собрать обратно. Алгоритм рекурсивен и применим к самому себе, поэтому он даёт не только решения, но и планы, алгоритмы и более точные требования.',
          })}
        </p>
        <ProblemSolvingDiagram />
        <ProblemSolving steps={problemSolving} notes={problemSolvingNotes} />
      </Section>

      <Section
        id="highlights"
        kicker={{ en: 'Open questions', ru: 'Открытые вопросы' }}
        title={{ en: 'Highlighted research', ru: 'Избранные исследования' }}
      >
        <div className="profession-grid">
          {HIGHLIGHTS.map((h) => (
            <article key={tr(h.title, 'en')} className="profession">
              <h3>{t(h.title)}</h3>
              <Picks list={h.repos} label={h.title} />
            </article>
          ))}
        </div>
      </Section>

      <Section id="laws" kicker={{ en: 'Data science', ru: 'Наука о данных' }} title={LAWS_TITLE}>
        <p className="section__lead">
          {t({
            en: 'Laws, verdicts and tax rules are a large, versioned and well-structured corpus. Turning them into datasets makes them searchable, comparable between countries and usable for statistics, bots and AI assistants.',
            ru: 'Законы, судебные решения и налоговые правила — это большой, версионируемый и хорошо структурированный корпус текстов. Превращённые в наборы данных, они становятся доступными для поиска, сравнимыми между странами и пригодными для статистики, ботов и ИИ-помощников.',
          })}
        </p>
        <Picks list={LAWS} label={LAWS_TITLE} />
      </Section>

      <Section
        id="all"
        kicker={{ en: 'Catalog', ru: 'Каталог' }}
        title={{ en: 'All research repositories', ru: 'Все исследовательские репозитории' }}
      >
        <RepoList
          items={research}
          label={{ en: 'Research repositories', ru: 'Исследовательские репозитории' }}
          fieldOptions={researchFields}
          showKinds={false}
        />
      </Section>
    </Layout>
  );
}
