// Positions (issue #11): every position selects its jobs, bullet topics,
// skills, example repositories, CV strengths, products and practices.
// /experience/?role=<id> shows one of them and /cv/?role=<id> prints its CV;
// without a role both show all experience (the `all` entry below).
import { experience, yearsText } from './experience';
import { crateCount, crateDownloads, npmMonthly } from './figures';

// Professional experience at build time: 18 years in October 2026.
const YEARS = yearsText();
// Package figures come from src/data/github.json (issue #47).
const LINKS_NOTATION_NPM = npmMonthly('links-notation');
const COMMAND_STREAM_NPM = npmMonthly('command-stream');

const jobsWithRole = (role) => experience.filter((job) => job.roles.includes(role)).map((job) => job.id);

/** Products a CV can list under “Selected products”; `repo` is a repository of src/data/repositories.json. */
export const products = [
  {
    id: 'hive-mind',
    name: 'Hive Mind',
    repo: 'link-assistant/hive-mind',
    summary: {
      en: 'AI agents that solve GitHub issues end to end: requirements, failing tests, a pull request, CI and review.',
      ru: 'ИИ-агенты, которые решают задачи GitHub от начала до конца: требования, падающие тесты, пул-реквест, CI и ревью.',
    },
  },
  {
    id: 'router',
    name: 'Link.Assistant Router',
    repo: 'link-assistant/router',
    summary: {
      en: 'One access point to many AI providers for agents and people.',
      ru: 'Единая точка доступа к разным поставщикам ИИ для агентов и людей.',
    },
  },
  {
    id: 'formal-ai',
    name: 'formal-ai',
    repo: 'link-assistant/formal-ai',
    summary: {
      en: 'A symbolic assistant that runs the problem solving algorithm for every prompt.',
      ru: 'Символьный ассистент, который решает каждый запрос по алгоритму решения задач.',
    },
  },
  {
    id: 'doublets',
    name: 'Doublets',
    repo: 'linksplatform/Data.Doublets',
    packages: [
      ['NuGet', 'https://www.nuget.org/profiles/konard'],
      ['crates.io', 'https://crates.io/crates/doublets'],
    ],
    summary: {
      en: 'The associative database engine of LinksPlatform in C#, C++ and Rust; LinksPlatform libraries have ~1.9M NuGet downloads.',
      ru: 'Движок ассоциативной базы данных LinksPlatform на C#, C++ и Rust; библиотеки LinksPlatform загружены из NuGet около 1,9 млн раз.',
    },
  },
  {
    id: 'links-notation',
    name: 'Links Notation',
    repo: 'link-foundation/links-notation',
    packages: [
      ['npm', 'https://www.npmjs.com/package/links-notation'],
      ['crates.io', 'https://crates.io/crates/links-notation'],
    ],
    summary: {
      en: `A way to describe data with references and links; ${LINKS_NOTATION_NPM.en}.`,
      ru: `Нотация для описания данных ссылками и связями; ${LINKS_NOTATION_NPM.ru}.`,
    },
  },
  {
    id: 'deep',
    name: 'Deep',
    repo: 'deep-foundation/deeplinks',
    summary: {
      en: 'An associative data-oriented OS on PostgreSQL and Hasura with handlers in 6 languages and 330+ packages.',
      ru: 'Ассоциативная ОС, ориентированная на данные, на PostgreSQL и Hasura с обработчиками на 6 языках и более чем 330 пакетами.',
    },
  },
  {
    id: 'deep-gpt',
    name: 'Deep.GPT',
    repo: 'deep-assistant/telegram-bot',
    summary: {
      en: 'A Telegram bot with GPT, Claude and open models, image and music generation, payments and referrals.',
      ru: 'Telegram-бот с GPT, Claude и открытыми моделями, генерацией изображений и музыки, платежами и рефералами.',
    },
  },
  {
    id: 'api-gateway',
    name: 'Deep.GPT API gateway',
    repo: 'deep-assistant/api-gateway',
    summary: {
      en: 'An OpenAI-compatible gateway in front of many model providers.',
      ru: 'OpenAI-совместимый шлюз перед множеством поставщиков моделей.',
    },
  },
  {
    id: 'use-m',
    name: 'use-m',
    repo: 'link-foundation/use-m',
    packages: [['npm', 'https://www.npmjs.com/package/use-m']],
    summary: {
      en: 'Downloads and imports any JavaScript module at runtime.',
      ru: 'Загружает и импортирует любой модуль JavaScript во время выполнения.',
    },
  },
  {
    id: 'command-stream',
    name: 'command-stream',
    repo: 'link-foundation/command-stream',
    packages: [['npm', 'https://www.npmjs.com/package/command-stream']],
    summary: {
      en: `Shell commands as streams in JavaScript; ${COMMAND_STREAM_NPM.en}.`,
      ru: `Команды оболочки как потоки в JavaScript; ${COMMAND_STREAM_NPM.ru}.`,
    },
  },
  {
    id: 'link-cli',
    name: 'link-cli',
    repo: 'link-foundation/link-cli',
    summary: {
      en: 'A CLI that manipulates links with a substitution-based query language.',
      ru: 'CLI для работы со связями на языке запросов, основанном на подстановках.',
    },
  },
  {
    id: 'translators',
    name: 'Code translators',
    repo: 'linksplatform/RegularExpressions.Transformer.CSharpToCpp',
    summary: {
      en: 'Rule-based source-to-source translators: C# → C++, C# → Python, C++ → Java, Python → Nim.',
      ru: 'Трансляторы исходного кода на правилах: C# → C++, C# → Python, C++ → Java, Python → Nim.',
    },
  },
  {
    id: 'trader-bot',
    name: 'trader-bot',
    repo: 'link-assistant/trader-bot',
    summary: {
      en: 'An automated trading bot; the LinksPlatform bots also traded through the Tinkoff Invest API.',
      ru: 'Автоматический торговый бот; боты LinksPlatform также торговали через Tinkoff Invest API.',
    },
  },
  {
    id: 'meta-theory',
    name: 'Links meta-theory',
    repo: 'link-foundation/meta-theory',
    summary: {
      en: 'Everything is a link, a link is a reference to links: L ↦ L², with formal proofs in Rocq and Lean.',
      ru: 'Всё — связь, связь — ссылка на связи: L ↦ L², с формальными доказательствами на Rocq и Lean.',
    },
  },
];

/** “How I work”: practices a CV can list; positions pick them by topic. */
export const practices = [
  {
    id: 'tests-first',
    topics: ['lead', 'architecture', 'backend', 'frontend', 'devops', 'research', 'data', 'rust', 'dotnet', 'trading'],
    text: {
      en: 'Problem first: every task is decomposed until it can be checked, and is written down as a failing test before the code.',
      ru: 'Сначала задача: каждая задача раскладывается до проверяемых частей и записывается как падающий тест до написания кода.',
    },
  },
  {
    id: 'ai-driven',
    topics: ['ai', 'lead', 'devops', 'backend', 'frontend'],
    text: {
      en: 'AI-driven development: agents (Claude Code, Codex) draft pull requests from issues; CI and human review decide what is merged.',
      ru: 'Разработка с ИИ: агенты (Claude Code, Codex) готовят пул-реквесты по задачам, а CI и ревью людей решают, что попадёт в код.',
    },
  },
  {
    id: 'automation',
    topics: ['devops', 'lead', 'ai'],
    text: {
      en: 'Automation of automation: CI/CD, releases, tests and routine fixes are automated from the first day.',
      ru: 'Автоматизация автоматизации: CI/CD, выпуски, тесты и рутинные исправления автоматизируются с первого дня.',
    },
  },
  {
    id: 'data-model',
    topics: ['data', 'architecture', 'research', 'backend', 'rust'],
    text: {
      en: 'Data model first: one simple model (links) for storage, APIs and UI, checked with benchmarks before optimization.',
      ru: 'Сначала модель данных: одна простая модель (связи) для хранения, API и интерфейса, проверенная бенчмарками до оптимизации.',
    },
  },
  {
    id: 'open',
    topics: ['lead', 'writing', 'research', 'product'],
    text: {
      en: 'Open by default: open-source code, documentation, case studies and articles, so the team and users share one context.',
      ru: 'Открытость по умолчанию: открытый код, документация, разборы задач и статьи, чтобы у команды и пользователей был общий контекст.',
    },
  },
  {
    id: 'remote',
    topics: ['lead', 'product'],
    text: {
      en: 'Remote and asynchronous: distributed international teams, written decisions and short feedback loops.',
      ru: 'Удалённо и асинхронно: распределённые международные команды, письменные решения и короткие циклы обратной связи.',
    },
  },
  {
    id: 'product',
    topics: ['product', 'frontend', 'mobile', 'trading'],
    text: {
      en: 'Product focus: small releases that users can try, with UI/UX checked on real devices.',
      ru: 'Фокус на продукте: небольшие выпуски, которые пользователи могут попробовать, и UI/UX, проверенный на реальных устройствах.',
    },
  },
];

const strength = (en, ru, items) => ({ label: { en, ru }, items });

const LEADERSHIP = strength('Leadership', 'Руководство', [
  'teams of up to 5 senior developers',
  'distributed open-source teams',
  'planning',
  'code review',
  'hiring',
]);
const AI_TOOLS = strength('AI', 'ИИ', [
  'Claude Code',
  'Codex',
  'AI agents',
  'LLM APIs',
  'model routing',
  'vector search',
]);
const DEVOPS = strength('DevOps', 'DevOps', [
  'GitHub Actions',
  'GitLab CI/CD',
  'Docker',
  'Kubernetes',
  'Grafana',
  'Prometheus',
  'Sentry',
]);
const DATABASES = strength('Data', 'Данные', [
  'PostgreSQL',
  'Hasura / GraphQL',
  'MS SQL',
  'Redis',
  'InfluxDB',
  'MongoDB',
  'RabbitMQ',
  'S3 / MinIO',
  'associative databases',
]);
const BACKEND = strength('Backend', 'Бэкенд', [
  'Node.js',
  'Rust',
  'Go',
  'PHP',
  'C# / .NET',
  'Python',
  'GraphQL',
  'REST',
]);
const FRONTEND = strength('Frontend', 'Фронтенд', [
  'TypeScript',
  'React',
  'Next.js',
  'Vue.js',
  'Redux',
  'Capacitor / Cordova',
  'TradingView',
]);
const DOTNET = strength('.NET', '.NET', [
  'C#',
  'ASP.NET Core / MVC / WebForms',
  'WPF',
  'WinForms',
  'WCF',
  'Silverlight',
  'DevExpress',
  'Telerik',
]);
const RUST = strength('Rust', 'Rust', [
  'Rust',
  `crates.io (${crateCount.en})`,
  'async services',
  'memory-mapped storage',
  'C/C++',
]);
const RESEARCH = strength('Research', 'Исследования', [
  'Links Theory',
  'associative data model',
  'formal proofs (Rocq, Lean)',
  'source-to-source translation',
]);
const TRADING = strength('Trading', 'Трейдинг', [
  'grid trading',
  'ByBit / BitGet APIs',
  'Tinkoff Invest API',
  'TradingView',
  'time series (InfluxDB)',
  'billing',
]);
const ARCHITECTURE = strength('Architecture', 'Архитектура', [
  'system design',
  'GraphQL APIs',
  'event-driven services',
  'high-load search',
  'plugin systems',
]);

/** Positions; `jobs` keep the order of the timeline (oldest first). */
export const positions = [
  {
    id: 'all',
    name: { en: 'All', ru: 'Весь опыт' },
    title: {
      en: 'Software Architect · Tech Lead · Full-stack Engineer',
      ru: 'Архитектор ПО · Tech Lead · Фулстек-разработчик',
    },
    summary: {
      en: 'Choose a position to see only the jobs, example repositories and skills that matter for it.',
      ru: 'Выберите должность, чтобы увидеть только нужные для неё места работы, примеры репозиториев и навыки.',
    },
    profile: {
      en: `Software architect and tech lead with ${YEARS.en} of professional experience (coding since 2000). Builds products end to end, from data models and backends to web and mobile apps, and leads teams that develop them with AI agents. Founder of LinksPlatform, Link.Foundation and Link.Assistant, co-founder and former CTO of Deep.Foundation, co-author of the Links Theory.`,
      ru: `Архитектор ПО и технический лидер с профессиональным опытом ${YEARS.ru} (программирую с 2000 года). Создаю продукты целиком — от моделей данных и бэкенда до веб- и мобильных приложений — и руковожу командами, которые разрабатывают их с помощью ИИ-агентов. Основатель LinksPlatform, Link.Foundation и Link.Assistant, сооснователь и бывший CTO Deep.Foundation, соавтор теории связей.`,
    },
    jobs: experience.map((job) => job.id),
    topics: ['lead', 'architecture', 'ai', 'backend', 'frontend', 'devops', 'data', 'trading', 'research'],
    bullets: 2,
    skills: null,
    professions: null,
    strengths: [LEADERSHIP, BACKEND, FRONTEND, DATABASES, DEVOPS, AI_TOOLS],
    products: ['hive-mind', 'doublets', 'links-notation', 'deep', 'deep-gpt'],
  },
  {
    id: 'ml',
    name: { en: 'ML / AI', ru: 'ML / ИИ' },
    title: { en: 'ML / AI Engineer', ru: 'ML / AI-инженер' },
    summary: {
      en: 'LLM products, AI agents, model routing and ML research.',
      ru: 'Продукты на LLM, ИИ-агенты, маршрутизация моделей и исследования в ML.',
    },
    profile: {
      en: `Engineer who ships LLM products: AI agents that solve GitHub issues, an AI router for a company, the Deep.GPT bot with many models, and AI fixing of production errors. ${YEARS.en} of professional software development and research in data models and formal methods.`,
      ru: `Инженер, который выпускает продукты на LLM: ИИ-агенты, решающие задачи на GitHub, ИИ-маршрутизатор для компании, бот Deep.GPT с множеством моделей и исправление ошибок продакшена с помощью ИИ. ${YEARS.ru} профессиональной разработки и исследований моделей данных и формальных методов.`,
    },
    jobs: jobsWithRole('ml'),
    topics: ['ai', 'research', 'data'],
    bullets: 3,
    skills: ['ai', 'languages', 'data'],
    professions: ['ml-ai', 'mlops'],
    strengths: [
      AI_TOOLS,
      strength('LLM products', 'Продукты на LLM', [
        'Telegram bots',
        'OpenAI-compatible APIs',
        'image & music generation',
      ]),
      strength('Languages', 'Языки', ['Python', 'JavaScript / TypeScript', 'Rust', 'Go', 'PHP']),
      DATABASES,
      DEVOPS,
    ],
    products: ['hive-mind', 'router', 'deep-gpt', 'api-gateway', 'formal-ai'],
  },
  {
    id: 'ai-agents',
    name: { en: 'AI Agents / LLM', ru: 'ИИ-агенты / LLM' },
    title: { en: 'AI Agents / LLM Engineer', ru: 'Инженер ИИ-агентов / LLM' },
    summary: {
      en: 'Autonomous coding agents, AI routers and AI-driven development processes.',
      ru: 'Автономные агенты для разработки, ИИ-маршрутизаторы и процессы разработки с ИИ.',
    },
    profile: {
      en: `Builds AI agents and the processes around them: Hive Mind solves GitHub issues end to end with Claude Code, Codex and OpenCode; at Evirma AI agents develop PHP and Go services, fix Sentry errors and reach providers through one AI router. ${YEARS.en} of professional development.`,
      ru: `Создаю ИИ-агентов и процессы вокруг них: Hive Mind решает задачи GitHub от начала до конца с Claude Code, Codex и OpenCode; в Evirma ИИ-агенты разрабатывают сервисы на PHP и Go, исправляют ошибки из Sentry и обращаются к поставщикам через единый ИИ-маршрутизатор. ${YEARS.ru} профессиональной разработки.`,
    },
    jobs: ['deep-foundation', 'deep-gpt', 'link-foundation', 'link-assistant', 'evirma'],
    topics: ['ai', 'devops', 'architecture'],
    bullets: 4,
    skills: ['ai', 'languages', 'devops'],
    professions: ['ml-ai', 'mlops', 'bots'],
    strengths: [
      strength('Agents', 'Агенты', ['Claude Code', 'Codex', 'OpenCode', 'agent orchestration', 'tool use']),
      strength('LLM', 'LLM', [
        'OpenAI-compatible APIs',
        'model routing',
        'local LLMs',
        'vector search',
        'speech-to-text',
      ]),
      DEVOPS,
      strength('Languages', 'Языки', ['JavaScript / TypeScript', 'Rust', 'Python', 'Go', 'PHP']),
    ],
    products: ['hive-mind', 'router', 'formal-ai', 'api-gateway', 'deep-gpt'],
  },
  {
    id: 'lead',
    name: { en: 'CEO / Team lead', ru: 'CEO / Руководитель' },
    title: { en: 'Founder, CEO · Engineering Lead', ru: 'Основатель, CEO · Руководитель разработки' },
    summary: {
      en: 'Founding organizations, leading distributed teams and roadmaps.',
      ru: 'Создание организаций, руководство распределёнными командами и планами развития.',
    },
    profile: {
      en: `Founder of LinksPlatform, Link.Foundation and Link.Assistant, co-founder and former CTO of Deep.Foundation. Led international open-source teams and a team of 5 senior developers at Kaiten; now Tech Lead at Evirma, introducing AI-driven development. ${YEARS.en} of professional experience.`,
      ru: `Основатель LinksPlatform, Link.Foundation и Link.Assistant, сооснователь и бывший CTO Deep.Foundation. Руководил международными open-source-командами и группой из 5 senior-разработчиков в Kaiten; сейчас Tech Lead в Evirma, внедряю разработку с ИИ. Профессиональный опыт — ${YEARS.ru}.`,
    },
    jobs: jobsWithRole('lead'),
    topics: ['lead', 'architecture', 'product', 'ai'],
    bullets: 3,
    skills: ['domains', 'devops', 'ai'],
    professions: ['lead', 'mlops'],
    strengths: [LEADERSHIP, ARCHITECTURE, AI_TOOLS, DEVOPS],
    products: ['hive-mind', 'deep', 'doublets', 'links-notation'],
  },
  {
    id: 'techlead',
    name: { en: 'Tech Lead / Team Lead', ru: 'Техлид / Тимлид' },
    title: { en: 'Tech Lead / Team Lead', ru: 'Tech Lead / Team Lead' },
    summary: {
      en: 'Leading development teams hands-on: planning, reviews, CI/CD and AI-driven development.',
      ru: 'Руководство командой разработки с участием в коде: планирование, ревью, CI/CD и разработка с ИИ.',
    },
    profile: {
      en: `Hands-on tech lead: Tech Lead at Evirma (AI-driven development of PHP and Go services, CI/CD, a test stand), Development Team Lead of 5 senior developers at Kaiten, CTO of Deep.Foundation with an international distributed team. ${YEARS.en} of professional experience.`,
      ru: `Технический лидер, который пишет код: Tech Lead в Evirma (разработка сервисов на PHP и Go с ИИ, CI/CD, тестовый стенд), руководитель группы из 5 senior-разработчиков в Kaiten, CTO Deep.Foundation с международной распределённой командой. Профессиональный опыт — ${YEARS.ru}.`,
    },
    jobs: ['linksplatform', 'abracar', 'deep-foundation', 'kaiten', 'link-assistant', 'capico', 'evirma'],
    topics: ['lead', 'architecture', 'devops', 'ai', 'backend'],
    bullets: 3,
    skills: ['domains', 'devops', 'ai'],
    professions: ['lead', 'devops'],
    strengths: [LEADERSHIP, ARCHITECTURE, BACKEND, DEVOPS, AI_TOOLS],
    products: ['hive-mind', 'deep', 'router'],
  },
  {
    id: 'cto',
    name: { en: 'CTO / Architect', ru: 'CTO / Архитектор' },
    title: { en: 'CTO / Software Architect', ru: 'CTO / Архитектор ПО' },
    summary: {
      en: 'System design, data models and technical strategy, from search engines to associative platforms.',
      ru: 'Проектирование систем, модели данных и техническая стратегия — от поисковых систем до ассоциативных платформ.',
    },
    profile: {
      en: `Software architect and former CTO of Deep.Foundation: designed an associative data-oriented OS on PostgreSQL and Hasura, the Doublets database engines, a tour search engine over hundreds of millions of offers and AI infrastructure for a company. ${YEARS.en} of professional experience.`,
      ru: `Архитектор ПО и бывший CTO Deep.Foundation: спроектировал ассоциативную ОС на PostgreSQL и Hasura, движки баз данных Doublets, поисковую систему по сотням миллионов туров и ИИ-инфраструктуру компании. Профессиональный опыт — ${YEARS.ru}.`,
    },
    jobs: [
      'alponline',
      'pegas',
      'linksplatform',
      'abracar',
      'deep-foundation',
      'kaiten',
      'link-foundation',
      'link-assistant',
      'evirma',
    ],
    topics: ['architecture', 'lead', 'data', 'devops', 'product'],
    bullets: 2,
    skills: ['languages', 'data', 'devops', 'domains'],
    professions: ['lead', 'systems', 'data'],
    strengths: [ARCHITECTURE, LEADERSHIP, DATABASES, BACKEND, DEVOPS, AI_TOOLS],
    products: ['deep', 'doublets', 'hive-mind', 'links-notation'],
  },
  {
    id: 'developer',
    name: { en: 'Developer', ru: 'Разработчик' },
    title: { en: 'Senior Software Engineer', ru: 'Ведущий разработчик (Senior)' },
    summary: {
      en: 'Hands-on software engineering in many languages and stacks.',
      ru: 'Практическая разработка на многих языках и стеках.',
    },
    profile: {
      en: `Senior software engineer with ${YEARS.en} of professional experience (coding since 2000): backends in Node.js, Rust, Go, PHP and C#, web and mobile apps in React, Next.js and Vue.js, databases and CI/CD. Writes code with AI agents and covers it with tests.`,
      ru: `Senior-разработчик с профессиональным опытом ${YEARS.ru} (программирую с 2000 года): бэкенд на Node.js, Rust, Go, PHP и C#, веб- и мобильные приложения на React, Next.js и Vue.js, базы данных и CI/CD. Пишу код вместе с ИИ-агентами и покрываю его тестами.`,
    },
    jobs: jobsWithRole('developer'),
    topics: ['backend', 'frontend', 'data', 'rust', 'dotnet', 'trading', 'mobile'],
    bullets: 2,
    skills: ['languages', 'markup', 'data', 'web', 'dotnet', 'parsing'],
    professions: ['backend', 'frontend', 'systems', 'languages', 'data', 'bots'],
    strengths: [BACKEND, FRONTEND, DATABASES, DEVOPS, AI_TOOLS],
    products: ['doublets', 'links-notation', 'use-m', 'hive-mind'],
  },
  {
    id: 'backend',
    name: { en: 'Backend', ru: 'Бэкенд' },
    title: {
      en: 'Senior Backend Developer (Node.js, Rust, Go, PHP, C#)',
      ru: 'Senior бэкенд-разработчик (Node.js, Rust, Go, PHP, C#)',
    },
    summary: {
      en: 'Services, APIs and databases in Node.js, Rust, Go, PHP and C#.',
      ru: 'Сервисы, API и базы данных на Node.js, Rust, Go, PHP и C#.',
    },
    profile: {
      en: `Backend developer with ${YEARS.en} of professional experience: PHP and Go services with AI at Evirma, a Rust grid trading system, Node.js add-ons and billing at Kaiten, GraphQL backends on Hasura and PostgreSQL, and C# search and booking systems for travel.`,
      ru: `Бэкенд-разработчик с профессиональным опытом ${YEARS.ru}: сервисы на PHP и Go с ИИ в Evirma, система сеточной торговли на Rust, дополнения и биллинг на Node.js в Kaiten, GraphQL-бэкенды на Hasura и PostgreSQL и системы поиска и бронирования туров на C#.`,
    },
    jobs: ['alponline', 'pegas', 'elar', 'abracar', 'deep-foundation', 'deep-gpt', 'kaiten', 'capico', 'evirma'],
    topics: ['backend', 'data', 'architecture'],
    bullets: 3,
    skills: ['languages', 'data', 'web', 'devops'],
    professions: ['backend', 'data', 'bots'],
    strengths: [BACKEND, DATABASES, ARCHITECTURE, DEVOPS],
    products: ['deep', 'doublets', 'api-gateway', 'command-stream'],
  },
  {
    id: 'fullstack',
    name: { en: 'Full-stack', ru: 'Фулстек' },
    title: {
      en: 'Full-stack Developer (TypeScript, React, Next.js, Vue.js)',
      ru: 'Фулстек-разработчик (TypeScript, React, Next.js, Vue.js)',
    },
    summary: {
      en: 'Web and mobile apps with their backends: TypeScript, React, Next.js, Vue.js, Node.js.',
      ru: 'Веб- и мобильные приложения вместе с бэкендом: TypeScript, React, Next.js, Vue.js, Node.js.',
    },
    profile: {
      en: `Full-stack developer with ${YEARS.en} of professional experience: the trading terminal UI in Vue.js, Kaiten add-ons in React and Node.js, ShakeApp web and mobile apps in Next.js and Capacitor, the React UI of Deep, and backends on PostgreSQL and GraphQL.`,
      ru: `Фулстек-разработчик с профессиональным опытом ${YEARS.ru}: интерфейс торгового терминала на Vue.js, дополнения Kaiten на React и Node.js, веб- и мобильные приложения ShakeApp на Next.js и Capacitor, React-интерфейс Deep и бэкенды на PostgreSQL и GraphQL.`,
    },
    jobs: ['artbridge', 'alponline', 'pegas', 'abracar', 'deep-foundation', 'deep-gpt', 'kaiten', 'capico'],
    topics: ['frontend', 'backend', 'mobile', 'product'],
    bullets: 3,
    skills: ['languages', 'markup', 'web', 'data'],
    professions: ['frontend', 'backend'],
    strengths: [FRONTEND, BACKEND, DATABASES, DEVOPS],
    products: ['deep', 'deep-gpt', 'use-m', 'links-notation'],
  },
  {
    id: 'dotnet',
    name: { en: '.NET / C#', ru: '.NET / C#' },
    title: { en: '.NET / C# Developer', ru: '.NET / C#-разработчик' },
    summary: {
      en: 'C# since 2008: ASP.NET, WPF, WinForms, WCF and the LinksPlatform libraries.',
      ru: 'C# с 2008 года: ASP.NET, WPF, WinForms, WCF и библиотеки LinksPlatform.',
    },
    profile: {
      en: `C# developer since 2008: travel search and booking systems, the Production Control system for Rosneft, document management for ELAR, and the LinksPlatform libraries with ~1.9M NuGet downloads, including C# → C++ and C# → Python translators. ${YEARS.en} of professional experience.`,
      ru: `Разработчик на C# с 2008 года: системы поиска и бронирования туров, система «Производственный контроль» для «Роснефти», документооборот для ЭЛАР и библиотеки LinksPlatform с 1,9 млн загрузок из NuGet, включая трансляторы C# → C++ и C# → Python. Профессиональный опыт — ${YEARS.ru}.`,
    },
    jobs: ['alponline', 'pegas', 'termika', 'elar', 'linksplatform'],
    topics: ['dotnet', 'backend', 'data', 'architecture'],
    bullets: 4,
    skills: ['dotnet', 'languages', 'data'],
    professions: ['languages', 'systems'],
    strengths: [
      DOTNET,
      strength('Data', 'Данные', ['MS SQL', 'SQLite', 'Doublets', 'Entity Framework']),
      strength('Tools', 'Инструменты', ['Roslyn', 'T4', 'Stimulsoft', 'Aspose', 'ABBYY FineReader Engine', 'TFS']),
      DEVOPS,
    ],
    products: ['doublets', 'translators', 'links-notation'],
  },
  {
    id: 'rust',
    name: { en: 'Rust', ru: 'Rust' },
    title: { en: 'Rust Developer', ru: 'Rust-разработчик' },
    summary: {
      en: 'Rust services and libraries: a grid trading system, database engines and CLI tools.',
      ru: 'Сервисы и библиотеки на Rust: система сеточной торговли, движки баз данных и CLI-инструменты.',
    },
    profile: {
      en: `Rust developer: a grid trading system for ByBit and BitGet at Capico, the Doublets associative database engine and ${crateCount.en} on crates.io (${crateDownloads.en}), link-cli and AI agent tooling. ${YEARS.en} of professional experience in C#, C++ and other systems languages before.`,
      ru: `Rust-разработчик: система сеточной торговли для ByBit и BitGet в Capico, движок ассоциативной базы данных Doublets и ${crateCount.ru} на crates.io (${crateDownloads.ru}), link-cli и инструменты ИИ-агентов. До этого — ${YEARS.ru} профессионального опыта на C#, C++ и других системных языках.`,
    },
    jobs: ['linksplatform', 'deep-foundation', 'link-foundation', 'link-assistant', 'capico'],
    topics: ['rust', 'backend', 'data', 'trading'],
    bullets: 3,
    skills: ['languages', 'data', 'devops'],
    professions: ['systems', 'data'],
    strengths: [RUST, DATABASES, TRADING, DEVOPS],
    products: ['doublets', 'links-notation', 'link-cli', 'formal-ai'],
  },
  {
    id: 'trading',
    name: { en: 'Trading / fintech', ru: 'Трейдинг / финтех' },
    title: { en: 'Trading Systems Developer (fintech)', ru: 'Разработчик торговых систем (финтех)' },
    summary: {
      en: 'Grid trading on crypto exchanges, trading bots, trading terminals and billing.',
      ru: 'Сеточная торговля на криптобиржах, торговые боты, торговые терминалы и биллинг.',
    },
    profile: {
      en: `Developer of trading systems: a grid trading system for ByBit and BitGet in Rust and the UI/UX of a trading terminal with TradingView charts at Capico, trading bots for Tinkoff Invest and crypto markets, the Deep.Chain blockchain demo and billing at Kaiten. ${YEARS.en} of professional experience.`,
      ru: `Разработчик торговых систем: система сеточной торговли для ByBit и BitGet на Rust и UI/UX торгового терминала с графиками TradingView в Capico, торговые боты для Tinkoff Invest и криптовалютных рынков, демонстрационный блокчейн Deep.Chain и биллинг в Kaiten. Профессиональный опыт — ${YEARS.ru}.`,
    },
    jobs: ['linksplatform', 'deep-foundation', 'kaiten', 'link-assistant', 'capico', 'evirma'],
    topics: ['trading', 'rust', 'backend', 'data'],
    bullets: 3,
    skills: ['languages', 'data', 'domains'],
    professions: ['finance', 'bots'],
    strengths: [TRADING, RUST, DATABASES, FRONTEND],
    products: ['trader-bot', 'doublets', 'deep'],
  },
  {
    id: 'data',
    name: { en: 'Data / Databases', ru: 'Данные / СУБД' },
    title: { en: 'Data Engineer / Database Developer', ru: 'Дата-инженер / разработчик баз данных' },
    summary: {
      en: 'PostgreSQL, Hasura, associative databases, parsers and data pipelines.',
      ru: 'PostgreSQL, Hasura, ассоциативные базы данных, парсеры и конвейеры данных.',
    },
    profile: {
      en: `Database developer and data engineer: author of the Doublets associative database engines, the PostgreSQL and Hasura core of Deep, data parsing for Wildberries, data converters and imports, and a tour search over hundreds of millions of offers. ${YEARS.en} of professional experience.`,
      ru: `Разработчик баз данных и дата-инженер: автор движков ассоциативных баз данных Doublets, ядра Deep на PostgreSQL и Hasura, парсинга данных Wildberries, конвертеров и импорта данных и поиска по сотням миллионов туров. Профессиональный опыт — ${YEARS.ru}.`,
    },
    jobs: [
      'artbridge',
      'alponline',
      'elar',
      'linksplatform',
      'abracar',
      'deep-foundation',
      'kaiten',
      'capico',
      'evirma',
    ],
    topics: ['data', 'backend', 'architecture'],
    bullets: 2,
    skills: ['data', 'languages', 'parsing'],
    professions: ['data', 'backend'],
    strengths: [
      DATABASES,
      strength('Engines', 'Движки', ['Doublets', 'Triplets', 'Sequences', 'memory-mapped files']),
      BACKEND,
    ],
    products: ['doublets', 'deep', 'links-notation', 'link-cli'],
  },
  {
    id: 'devops',
    name: { en: 'DevOps', ru: 'DevOps' },
    title: { en: 'DevOps Engineer', ru: 'DevOps-инженер' },
    summary: {
      en: 'CI/CD, containers, release automation and infrastructure.',
      ru: 'CI/CD, контейнеры, автоматизация выпусков и инфраструктура.',
    },
    profile: {
      en: `Engineer who automates delivery: CI/CD and a test stand at Evirma, AI fixing of Sentry errors, GitLab CI/CD with Docker and Kubernetes on Selectel at Abracar, and CI for hundreds of open-source repositories. ${YEARS.en} of professional experience.`,
      ru: `Инженер, который автоматизирует поставку: CI/CD и тестовый стенд в Evirma, исправление ошибок из Sentry с ИИ, GitLab CI/CD с Docker и Kubernetes в Selectel в «Абракаре» и CI для сотен open-source-репозиториев. Профессиональный опыт — ${YEARS.ru}.`,
    },
    jobs: jobsWithRole('devops'),
    topics: ['devops', 'architecture', 'ai'],
    bullets: 2,
    skills: ['devops', 'tools'],
    professions: ['devops', 'mlops', 'qa'],
    strengths: [DEVOPS, strength('Platforms', 'Платформы', ['Linux', 'Nix', 'Selectel', 'GitHub Pages']), AI_TOOLS],
    products: ['hive-mind', 'command-stream', 'use-m'],
  },
  {
    id: 'research',
    name: { en: 'Scientist', ru: 'Учёный' },
    title: { en: 'Researcher · Links Theory', ru: 'Исследователь · теория связей' },
    summary: {
      en: 'Links theory, formal proofs and algorithm research.',
      ru: 'Теория связей, формальные доказательства и исследования алгоритмов.',
    },
    profile: {
      en: 'Researcher of the associative data model since 2010: co-author of the Links Theory (0.0.1 – 0.0.3) and the links meta-theory with formal proofs in Rocq and Lean, author of the universal problem solving algorithm and of the Doublets database engines that put the theory into practice.',
      ru: 'Исследую ассоциативную модель данных с 2010 года: соавтор теории связей (0.0.1 – 0.0.3) и метатеории связей с формальными доказательствами на Rocq и Lean, автор универсального алгоритма решения задач и движков баз данных Doublets, которые воплощают теорию на практике.',
    },
    jobs: jobsWithRole('research'),
    topics: ['research', 'writing', 'data', 'ai'],
    bullets: 3,
    skills: ['domains', 'parsing', 'ai'],
    professions: ['research', 'languages'],
    strengths: [
      RESEARCH,
      strength('Writing', 'Публикации', ['Habr articles', 'YouTube talks', 'case studies']),
      AI_TOOLS,
    ],
    products: ['meta-theory', 'links-notation', 'doublets', 'formal-ai'],
  },
];

export const positionById = (id) => positions.find((p) => p.id === id) || positions[0];
