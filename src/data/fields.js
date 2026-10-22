// Fields of study or business and how konard's repositories are useful in them.
// Repositories are assigned to fields by scripts/repositories.cjs (keyword and
// language rules), so every id here must exist in its FIELDS list.
// Texts are `{ en, ru }` objects, translated with useLang().t (src/i18n/prefs.js).
export const fields = [
  {
    id: 'associative',
    name: { en: 'Associative technologies', ru: 'Ассоциативные технологии' },
    summary: {
      en: 'Links/doublets storage engines, Links Notation, the Deep platform and links theory: a single data model for any meaning, useful for knowledge graphs, semantic search and data integration.',
      ru: 'Движки хранения связей и дуплетов, Links Notation, платформа Deep и теория связей: единая модель данных для любого смысла, полезная для графов знаний, семантического поиска и интеграции данных.',
    },
  },
  {
    id: 'data',
    name: { en: 'Data & databases', ru: 'Данные и базы данных' },
    summary: {
      en: 'Storage engines, benchmarks against PostgreSQL, SQLite, Neo4j and Redis, GraphQL over Hasura, import/export and serialization: reusable for data engineering and database research.',
      ru: 'Движки хранения, сравнения производительности с PostgreSQL, SQLite, Neo4j и Redis, GraphQL поверх Hasura, импорт, экспорт и сериализация: пригодится в инженерии данных и в исследованиях баз данных.',
    },
  },
  {
    id: 'ai',
    name: { en: 'AI agents & LLM apps', ru: 'ИИ-агенты и LLM-приложения' },
    summary: {
      en: 'Autonomous coding agents, chat bots on top of GPT/Claude, AI review and research assistants: ready-made building blocks for products that use large language models.',
      ru: 'Автономные агенты для программирования, чат-боты на основе GPT и Claude, ИИ-помощники для ревью и исследований: готовые строительные блоки для продуктов на больших языковых моделях.',
    },
  },
  {
    id: 'ml',
    name: { en: 'Machine learning & data science', ru: 'Машинное обучение и анализ данных' },
    summary: {
      en: 'Vector search, inference of laws from data, Markov chains, medical and retail ML research plans, offline AI tools: starting points for experiments with models and datasets.',
      ru: 'Векторный поиск, вывод законов из данных, цепи Маркова, планы ML-исследований в медицине и рознице, офлайн-инструменты ИИ: отправные точки для экспериментов с моделями и наборами данных.',
    },
  },
  {
    id: 'mlops',
    name: { en: 'MLOps & AI infrastructure', ru: 'MLOps и ИИ-инфраструктура' },
    summary: {
      en: 'Model routers and API gateways, AI-driven CI/CD pipeline templates, sandboxes and orchestration of many AI agents: how to run AI reliably in production and in CI.',
      ru: 'Маршрутизаторы моделей и API-шлюзы, шаблоны CI/CD-конвейеров для разработки с ИИ, песочницы и оркестрация множества ИИ-агентов: как надёжно запускать ИИ в продакшене и в CI.',
    },
  },
  {
    id: 'devops',
    name: { en: 'DevOps & automation', ru: 'DevOps и автоматизация' },
    summary: {
      en: 'Docker images with every language runtime, GitHub Actions workflows, release automation, git and GitHub CLI tools, server scripts: automation of automation for any team.',
      ru: 'Docker-образы со средами выполнения всех языков, рабочие процессы GitHub Actions, автоматизация релизов, инструменты для git и GitHub CLI, серверные скрипты: автоматизация автоматизации для любой команды.',
    },
  },
  {
    id: 'web',
    name: { en: 'Web & mobile', ru: 'Веб и мобильная разработка' },
    summary: {
      en: 'React, Next.js and Capacitor apps, GitHub Pages mini apps for Telegram and VK, browser extensions and editors: examples of shipping UI to the web and to phones.',
      ru: 'Приложения на React, Next.js и Capacitor, мини-приложения для Telegram и VK на GitHub Pages, расширения браузера и редакторы: примеры того, как доставить интерфейс в веб и на телефоны.',
    },
  },
  {
    id: 'backend',
    name: { en: 'Backend & APIs', ru: 'Бэкенд и API' },
    summary: {
      en: 'REST and GraphQL services, WebSocket servers, payment integrations and microservices for web capture, search and speech: backend patterns in many languages.',
      ru: 'REST- и GraphQL-сервисы, WebSocket-серверы, интеграции платежей и микросервисы для захвата веб-страниц, поиска и речи: паттерны бэкенда на многих языках.',
    },
  },
  {
    id: 'bots',
    name: { en: 'Bots & social networks', ru: 'Боты и социальные сети' },
    summary: {
      en: 'Telegram, VK and Discord bots, cross-platform chat bridges and social automation: useful for communities, support desks and marketing.',
      ru: 'Боты для Telegram, VK и Discord, мосты между чатами разных платформ и автоматизация соцсетей: пригодится сообществам, службам поддержки и маркетингу.',
    },
  },
  {
    id: 'languages',
    name: { en: 'Languages, parsers & translators', ru: 'Языки, парсеры и трансляторы' },
    summary: {
      en: 'Code translators (C# → C++, Python → JavaScript, JavaScript → Rust), PEG and ANTLR examples, grammar inference and meta languages: compiler and DSL engineering.',
      ru: 'Трансляторы кода (C# → C++, Python → JavaScript, JavaScript → Rust), примеры PEG и ANTLR, вывод грамматик и метаязыки: разработка компиляторов и DSL.',
    },
  },
  {
    id: 'systems',
    name: { en: 'Systems & performance', ru: 'Системное программирование и производительность' },
    summary: {
      en: 'Memory-mapped storage, size-balanced trees, unsafe and low-level .NET/C++/Rust libraries, GPU sorting and bare-metal ports: high-performance and systems programming.',
      ru: 'Хранилища на отображаемых в память файлах, деревья, сбалансированные по размеру, unsafe- и низкоуровневые библиотеки на .NET, C++ и Rust, сортировка на GPU и порты на «голое железо»: высокопроизводительное и системное программирование.',
    },
  },
  {
    id: 'research',
    name: { en: 'Math, logic & science research', ru: 'Математика, логика и научные исследования' },
    summary: {
      en: 'Formal proofs in Rocq/Lean, P vs NP, travelling salesman and subset sum experiments, physics theories, meta-theory of links and the universal problem solving algorithm.',
      ru: 'Формальные доказательства на Rocq и Lean, P vs NP, эксперименты с задачей коммивояжёра и задачей о сумме подмножеств, физические теории, метатеория связей и универсальный алгоритм решения задач.',
    },
  },
  {
    id: 'legal',
    name: { en: 'Law & legal tech', ru: 'Право и легалтех' },
    summary: {
      en: 'Machine-readable collections of Russian and Indian laws, court verdicts, legal assistants and tax document generation: a base for legal search and compliance tools.',
      ru: 'Машиночитаемые собрания законов России и Индии, судебные решения, юридические помощники и формирование налоговых документов: основа для правового поиска и инструментов комплаенса.',
    },
  },
  {
    id: 'finance',
    name: { en: 'Finance, trading & commerce', ru: 'Финансы, трейдинг и коммерция' },
    summary: {
      en: 'Trading bots, net worth and key-rate monitors, payment gateways, marketplace bidders and price-law inference: tools for personal finance and e-commerce.',
      ru: 'Торговые боты, мониторы капитала и ключевой ставки, платёжные шлюзы, автоматические ставки на маркетплейсах и вывод законов цен: инструменты для личных финансов и электронной коммерции.',
    },
  },
  {
    id: 'education',
    name: { en: 'Education & documentation', ru: 'Образование и документация' },
    summary: {
      en: 'Worked examples for .NET, C++/CLI, T4 and parsers, a Moodle plugin, tutoring sites, documentation and Q&A collections: learning material for students and teams.',
      ru: 'Разобранные примеры для .NET, C++/CLI, T4 и парсеров, плагин для Moodle, сайты для репетиторства, документация и сборники вопросов и ответов: учебные материалы для студентов и команд.',
    },
  },
  {
    id: 'art',
    name: { en: 'Art, games & simulation', ru: 'Искусство, игры и симуляции' },
    summary: {
      en: 'Matrix digital rain, link visuals, anime avatar, gravity and wave simulations, Gaussian splatting, audio decomposition and game universes: creative coding.',
      ru: 'Цифровой дождь из «Матрицы», визуализации связей, аниме-аватар, симуляции гравитации и волн, Gaussian splatting, разложение звука и игровые вселенные: творческое программирование.',
    },
  },
  {
    id: 'productivity',
    name: { en: 'Productivity & developer tools', ru: 'Продуктивность и инструменты разработчика' },
    summary: {
      en: 'CLI tools for GitHub issues, gists and pull requests, task tracker integrations (Kaiten, Trello, YouGile), PDF to Markdown, uploaders and search tools.',
      ru: 'CLI-инструменты для issues, гистов и пул-реквестов GitHub, интеграции с трекерами задач (Kaiten, Trello, YouGile), конвертация PDF в Markdown, загрузчики и инструменты поиска.',
    },
  },
  {
    id: 'other',
    name: { en: 'Other experiments', ru: 'Прочие эксперименты' },
    summary: {
      en: 'Small experiments, placeholders and personal repositories that do not fit a specific field yet.',
      ru: 'Небольшие эксперименты, заготовки и личные репозитории, которые пока не относятся к какой-либо области.',
    },
  },
];

// Best example repositories for different IT professions, picked by hand.
// Each entry is [full repository name, why it is a good example for the profession].
export const professions = [
  {
    id: 'mlops',
    name: { en: 'MLOps & AI platform engineer', ru: 'MLOps-инженер и инженер ИИ-платформ' },
    summary: {
      en: 'Running, routing and orchestrating AI models and agents in CI and production.',
      ru: 'Запуск, маршрутизация и оркестрация ИИ-моделей и агентов в CI и в продакшене.',
    },
    repos: [
      [
        'link-assistant/hive-mind',
        {
          en: 'Orchestrates many AI coding agents that solve GitHub issues end to end.',
          ru: 'Оркестрирует множество ИИ-агентов, которые решают issues на GitHub от начала до конца.',
        },
      ],
      [
        'link-assistant/agent',
        {
          en: 'Thin headless agent runtime based on OpenCode CLI.',
          ru: 'Лёгкая среда выполнения агента без интерфейса на основе OpenCode CLI.',
        },
      ],
      [
        'link-assistant/router',
        {
          en: 'API router that switches between AI providers.',
          ru: 'API-маршрутизатор, переключающийся между провайдерами ИИ.',
        },
      ],
      [
        'deep-assistant/api-gateway',
        {
          en: 'OpenAI-compatible gateway behind the Deep.GPT bot.',
          ru: 'OpenAI-совместимый шлюз, на котором работает бот Deep.GPT.',
        },
      ],
      [
        'link-foundation/box',
        {
          en: 'Docker image with the most popular language runtimes for AI sandboxes.',
          ru: 'Docker-образ с самыми популярными средами выполнения языков для ИИ-песочниц.',
        },
      ],
      [
        'link-foundation/js-ai-driven-development-pipeline-template',
        { en: 'CI/CD template for AI-driven development.', ru: 'Шаблон CI/CD для разработки с помощью ИИ.' },
      ],
      [
        'link-foundation/rust-ai-driven-development-pipeline-template',
        { en: 'Same pipeline template for Rust.', ru: 'Такой же шаблон конвейера для Rust.' },
      ],
      [
        'link-assistant/model-in-browser',
        { en: 'Runs a language model fully in the browser.', ru: 'Запускает языковую модель целиком в браузере.' },
      ],
      [
        'link-assistant/agent-commander',
        {
          en: 'Library to control agents enclosed in CLI commands like Claude Code.',
          ru: 'Библиотека для управления агентами, запускаемыми как CLI-команды, например Claude Code.',
        },
      ],
      [
        'link-assistant/claude-profiles',
        { en: 'Manages multiple Claude Code profiles.', ru: 'Управляет несколькими профилями Claude Code.' },
      ],
    ],
  },
  {
    id: 'devops',
    name: { en: 'DevOps & SRE', ru: 'DevOps и SRE' },
    summary: {
      en: 'Automation of builds, releases, servers and developer machines.',
      ru: 'Автоматизация сборок, релизов, серверов и машин разработчиков.',
    },
    repos: [
      [
        'link-foundation/command-stream',
        {
          en: 'Streamable shell command executor for JavaScript.',
          ru: 'Потоковый исполнитель shell-команд для JavaScript.',
        },
      ],
      [
        'link-foundation/start',
        {
          en: 'Runs any command and auto-reports failures as issues.',
          ru: 'Запускает любую команду и автоматически сообщает о сбоях в issues.',
        },
      ],
      [
        'link-foundation/gh-pull-all',
        {
          en: 'Clones and pulls every repository of a user or organization.',
          ru: 'Клонирует и обновляет все репозитории пользователя или организации.',
        },
      ],
      [
        'deep-foundation/workflows',
        {
          en: 'Reusable GitHub Actions workflows for npm packages.',
          ru: 'Переиспользуемые рабочие процессы GitHub Actions для npm-пакетов.',
        },
      ],
      [
        'deep-foundation/rust-docker-isolation-provider',
        {
          en: 'Runs user code in isolated Docker containers.',
          ru: 'Запускает пользовательский код в изолированных Docker-контейнерах.',
        },
      ],
      [
        'linksplatform/Scripts',
        {
          en: 'CI/CD automation scripts for dozens of .NET and C++ libraries.',
          ru: 'Скрипты автоматизации CI/CD для десятков библиотек на .NET и C++.',
        },
      ],
      [
        'link-foundation/package-registry-manager',
        {
          en: 'Manages packages across language registries.',
          ru: 'Управляет пакетами в реестрах разных языков.',
        },
      ],
      [
        'link-foundation/links-logs-vault',
        {
          en: 'Microservice to accumulate and search logs.',
          ru: 'Микросервис для накопления логов и поиска по ним.',
        },
      ],
      [
        'link-foundation/disk-space-saviour',
        { en: 'Safely frees disk space.', ru: 'Безопасно освобождает место на диске.' },
      ],
      [
        'konard/macos-ram-volume',
        {
          en: 'Creates RAM volumes on macOS for fast builds.',
          ru: 'Создаёт RAM-диски в macOS для быстрых сборок.',
        },
      ],
    ],
  },
  {
    id: 'ml-ai',
    name: { en: 'ML / AI engineer', ru: 'ML / AI-инженер' },
    summary: {
      en: 'Products and research built on machine learning and large language models.',
      ru: 'Продукты и исследования на основе машинного обучения и больших языковых моделей.',
    },
    repos: [
      [
        'deep-assistant/telegram-bot',
        {
          en: 'Deep.GPT bot: answers, image and music generation, payments.',
          ru: 'Бот Deep.GPT: ответы, генерация изображений и музыки, платежи.',
        },
      ],
      ['deep-assistant/GPTutor', { en: 'GPT tutor as a VK mini app.', ru: 'GPT-репетитор в виде мини-приложения VK.' }],
      [
        'link-assistant/formal-ai',
        {
          en: 'Formal AI: know just enough to get to know anything.',
          ru: 'Формальный ИИ: знать ровно столько, чтобы суметь узнать что угодно.',
        },
      ],
      [
        'link-assistant/fact-checker-bot',
        {
          en: 'Fact checks statements in Telegram and VK groups.',
          ru: 'Проверяет факты в утверждениях в группах Telegram и VK.',
        },
      ],
      ['konard/universal-vector-search', { en: 'Vector search experiments.', ru: 'Эксперименты с векторным поиском.' }],
      [
        'konard/medical-neural-network-ml',
        {
          en: 'Research plan for a medical neural network.',
          ru: 'План исследования медицинской нейронной сети.',
        },
      ],
      [
        'konard/marketplace-retail-ai-control',
        {
          en: 'AI-assisted business management for a marketplace seller.',
          ru: 'Управление бизнесом продавца на маркетплейсе с помощью ИИ.',
        },
      ],
      [
        'link-assistant/image-to-number',
        {
          en: 'Converts images with numbers to numbers with Claude Code and haiku models.',
          ru: 'Превращает изображения с числами в числа с помощью Claude Code и моделей haiku.',
        },
      ],
      [
        'konard/2DPatterns',
        { en: 'Recognizes 2D patterns in PNG images.', ru: 'Распознаёт двумерные шаблоны на PNG-изображениях.' },
      ],
      [
        'konard/high-performance-gaussian-splatting',
        {
          en: 'High performance Gaussian splatting with dynamic scenes.',
          ru: 'Высокопроизводительный Gaussian splatting с динамическими сценами.',
        },
      ],
    ],
  },
  {
    id: 'data',
    name: { en: 'Data engineer & DBA', ru: 'Инженер данных и администратор БД' },
    summary: {
      en: 'Storage engines, query languages and honest benchmarks.',
      ru: 'Движки хранения, языки запросов и честные сравнения производительности.',
    },
    repos: [
      [
        'linksplatform/Data.Doublets',
        { en: 'Doublets associative storage engine in C#.', ru: 'Ассоциативный движок хранения Doublets на C#.' },
      ],
      [
        'linksplatform/doublets-rs',
        { en: 'Doublets storage engine in Rust.', ru: 'Движок хранения Doublets на Rust.' },
      ],
      [
        'link-foundation/link-cli',
        {
          en: 'CLI to create, query and update links.',
          ru: 'CLI для создания и изменения связей и запросов к ним.',
        },
      ],
      [
        'link-foundation/links-notation',
        {
          en: 'Links Notation: data as references and links.',
          ru: 'Links Notation: данные в виде ссылок и связей.',
        },
      ],
      [
        'linksplatform/Comparisons.PostgreSQLVSDoublets',
        { en: 'Benchmark: PostgreSQL vs Doublets.', ru: 'Сравнение производительности: PostgreSQL и Doublets.' },
      ],
      [
        'linksplatform/Comparisons.SQLiteVSDoublets',
        { en: 'Benchmark: SQLite vs Doublets.', ru: 'Сравнение производительности: SQLite и Doublets.' },
      ],
      [
        'linksplatform/Comparisons.Neo4jVSDoublets',
        { en: 'Benchmark: Neo4j vs Doublets.', ru: 'Сравнение производительности: Neo4j и Doublets.' },
      ],
      [
        'linksplatform/Data.Doublets.Gql',
        { en: 'GraphQL server over doublets.', ru: 'GraphQL-сервер поверх дуплетов.' },
      ],
      [
        'deep-foundation/hasura',
        { en: 'Hasura GraphQL engine integration for Deep.', ru: 'Интеграция движка Hasura GraphQL для Deep.' },
      ],
      ['link-foundation/linksql', { en: 'A query language for links.', ru: 'Язык запросов для связей.' }],
    ],
  },
  {
    id: 'backend',
    name: { en: 'Backend developer', ru: 'Бэкенд-разработчик' },
    summary: { en: 'Services, APIs and integrations.', ru: 'Сервисы, API и интеграции.' },
    repos: [
      [
        'deep-foundation/deeplinks',
        {
          en: 'Core of Deep: links storage with GraphQL API and handlers.',
          ru: 'Ядро Deep: хранилище связей с GraphQL API и обработчиками.',
        },
      ],
      ['deep-foundation/sdk', { en: 'SDK and application shell for Deep.', ru: 'SDK и оболочка приложений для Deep.' }],
      [
        'konard/ASP.NET-Core-WebSocket-Example',
        {
          en: 'ASP.NET Core WebSocket echo server and JS client.',
          ru: 'Эхо-сервер WebSocket на ASP.NET Core и клиент на JS.',
        },
      ],
      [
        'link-foundation/lino-rest-api',
        {
          en: 'REST framework that uses Links Notation instead of JSON.',
          ru: 'REST-фреймворк, использующий Links Notation вместо JSON.',
        },
      ],
      [
        'link-assistant/web-capture',
        {
          en: 'Library, CLI and microservice to capture web pages.',
          ru: 'Библиотека, CLI и микросервис для захвата веб-страниц.',
        },
      ],
      ['link-assistant/web-search', { en: 'Web search microservice.', ru: 'Микросервис веб-поиска.' }],
      [
        'link-foundation/links-queue',
        { en: 'Message queue built on links.', ru: 'Очередь сообщений на основе связей.' },
      ],
      [
        'deep-foundation/payments-tinkoff-c2b',
        { en: 'Tinkoff payments integration.', ru: 'Интеграция платежей Тинькофф.' },
      ],
      [
        'linksplatform/IdDistributorServer',
        { en: 'TCP/IP identifier distribution server.', ru: 'TCP/IP-сервер выдачи идентификаторов.' },
      ],
    ],
  },
  {
    id: 'frontend',
    name: { en: 'Frontend & mobile developer', ru: 'Фронтенд- и мобильный разработчик' },
    summary: { en: 'Web, mobile and browser UI.', ru: 'Интерфейсы для веба, телефонов и браузера.' },
    repos: [
      ['deep-foundation/deepcase-app', { en: 'Visual IDE for links of Deep.', ru: 'Визуальная IDE для связей Deep.' }],
      [
        'deep-foundation/store',
        {
          en: 'useState-style React data layers synced to storage.',
          ru: 'Слои данных для React в стиле useState, синхронизированные с хранилищем.',
        },
      ],
      [
        'deep-foundation/capacitor-camera',
        {
          en: 'Capacitor camera integration for mobile apps.',
          ru: 'Интеграция камеры через Capacitor для мобильных приложений.',
        },
      ],
      [
        'linksplatform/react-deep-tree',
        {
          en: 'React component for infinitely deep trees.',
          ru: 'React-компонент для бесконечно глубоких деревьев.',
        },
      ],
      [
        'deep-foundation/deep-memo-app',
        {
          en: 'Deep.Memo app that stores memos and device data as links in Deep.',
          ru: 'Приложение Deep.Memo, которое хранит заметки и данные устройства в виде связей в Deep.',
        },
      ],
      [
        'deep-foundation/browser-extension',
        {
          en: 'Next.js browser extension connected to Deep.',
          ru: 'Расширение браузера на Next.js, подключённое к Deep.',
        },
      ],
      [
        'link-foundation/monaco-editor-auto-typings',
        {
          en: 'Auto-loads typings in the Monaco editor.',
          ru: 'Автоматически загружает типизации в редакторе Monaco.',
        },
      ],
      [
        'konard/github-pages-telegram-mini-app',
        {
          en: 'Telegram Mini App hosted on GitHub Pages.',
          ru: 'Мини-приложение Telegram, размещённое на GitHub Pages.',
        },
      ],
      [
        'styleschool/uniforms-masked-phone-field',
        {
          en: 'Masked phone input for uniforms-material.',
          ru: 'Поле ввода телефона с маской для uniforms-material.',
        },
      ],
    ],
  },
  {
    id: 'systems',
    name: { en: 'Systems & performance engineer', ru: 'Системный программист и инженер производительности' },
    summary: {
      en: 'Memory, data structures and low-level code.',
      ru: 'Память, структуры данных и низкоуровневый код.',
    },
    repos: [
      [
        'linksplatform/Memory',
        {
          en: 'Memory-mapped and heap memory abstractions for .NET.',
          ru: 'Абстракции памяти для .NET: отображаемые в память файлы и куча.',
        },
      ],
      ['linksplatform/mem-rs', { en: 'Memory abstractions in Rust.', ru: 'Абстракции памяти на Rust.' }],
      [
        'linksplatform/trees-rs',
        { en: 'Size-balanced trees in Rust.', ru: 'Деревья, сбалансированные по размеру, на Rust.' },
      ],
      [
        'linksplatform/Ranges',
        {
          en: 'Range types and checks of the LinksPlatform class libraries.',
          ru: 'Типы диапазонов и проверки из библиотек классов LinksPlatform.',
        },
      ],
      [
        'linksplatform/Collections',
        { en: 'High-performance collections for .NET.', ru: 'Высокопроизводительные коллекции для .NET.' },
      ],
      [
        'linksplatform/Unsafe',
        {
          en: 'Unsafe helpers for zero-copy .NET code.',
          ru: 'Unsafe-помощники для кода на .NET без копирования данных.',
        },
      ],
      [
        'linksplatform/Data.Triplets.Kernel',
        { en: 'Native triplets kernel in C.', ru: 'Нативное ядро триплетов на C.' },
      ],
      [
        'konard/gpu-sorting',
        {
          en: 'The simplest possible GPU sorting in Rust.',
          ru: 'Самая простая из возможных сортировок на GPU на Rust.',
        },
      ],
      [
        'linksplatform/Solver',
        {
          en: 'Rust search for the shortest and simplest functions for given inputs and outputs.',
          ru: 'Поиск на Rust кратчайших и простейших функций для заданных входов и выходов.',
        },
      ],
    ],
  },
  {
    id: 'languages',
    name: { en: 'Compiler & language engineer', ru: 'Разработчик компиляторов и языков' },
    summary: { en: 'Parsers, translators and notations.', ru: 'Парсеры, трансляторы и нотации.' },
    repos: [
      [
        'linksplatform/RegularExpressions.Transformer.CSharpToCpp',
        {
          en: 'Translates C# libraries to C++ with regex rules.',
          ru: 'Транслирует библиотеки с C# на C++ по правилам на регулярных выражениях.',
        },
      ],
      [
        'linksplatform/RegularExpressions.Transformer',
        { en: 'Rule-based text transformation engine.', ru: 'Движок преобразования текста по правилам.' },
      ],
      [
        'link-foundation/grammar-expressions',
        {
          en: 'Hybrid of regular expressions and PEGs over Links Notation tokens.',
          ru: 'Гибрид регулярных выражений и PEG над токенами Links Notation.',
        },
      ],
      [
        'link-foundation/grammar-inference',
        { en: 'Infers a grammar from examples.', ru: 'Выводит грамматику из примеров.' },
      ],
      [
        'link-foundation/transformer',
        {
          en: 'Rule-based Turing complete transformer on Links Notation.',
          ru: 'Тьюринг-полный преобразователь на правилах поверх Links Notation.',
        },
      ],
      ['link-foundation/meta-language', { en: 'A language about languages.', ru: 'Язык о языках.' }],
      ['konard/metalanguage', { en: 'The meta programming language.', ru: 'Язык метапрограммирования.' }],
      [
        'konard/PegasusExample',
        { en: 'Pegasus PEG parser generator on .NET Core.', ru: 'Генератор PEG-парсеров Pegasus на .NET Core.' },
      ],
      ['konard/AntlrExample', { en: 'ANTLR parsing of C# code.', ru: 'Разбор кода на C# с помощью ANTLR.' }],
    ],
  },
  {
    id: 'qa',
    name: { en: 'QA & test automation', ru: 'QA и автоматизация тестирования' },
    summary: {
      en: 'Testing frameworks, e2e and security checks.',
      ru: 'Фреймворки тестирования, e2e-тесты и проверки безопасности.',
    },
    repos: [
      [
        'link-foundation/test-anywhere',
        {
          en: 'One test API for Node.js, Bun and Deno built-in runners.',
          ru: 'Единый API тестов для встроенных средств запуска Node.js, Bun и Deno.',
        },
      ],
      [
        'link-foundation/browser-commander',
        {
          en: 'Simplified control of local browsers for e2e tests.',
          ru: 'Упрощённое управление локальными браузерами для e2e-тестов.',
        },
      ],
      ['konard/jest-template', { en: 'Jest template for both CJS and ESM.', ru: 'Шаблон Jest сразу для CJS и ESM.' }],
      ['link-assistant/api-tester', { en: 'API testing tool.', ru: 'Инструмент для тестирования API.' }],
      [
        'konard/knex-sql-injection-detector',
        {
          en: 'Detects potential SQL injections in knex code.',
          ru: 'Находит потенциальные SQL-инъекции в коде на knex.',
        },
      ],
      [
        'link-foundation/sensitive-data-sanitizer',
        { en: 'Removes secrets from logs and data.', ru: 'Удаляет секреты из логов и данных.' },
      ],
      [
        'konard/recurscan',
        {
          en: 'Finds recursive functions in JavaScript files.',
          ru: 'Находит рекурсивные функции в файлах JavaScript.',
        },
      ],
    ],
  },
  {
    id: 'bots',
    name: { en: 'Bot developer', ru: 'Разработчик ботов' },
    summary: {
      en: 'Chat bots for Telegram, VK, Discord and GitHub.',
      ru: 'Чат-боты для Telegram, VK, Discord и GitHub.',
    },
    repos: [
      [
        'linksplatform/Bot',
        { en: 'VK, GitHub, Discord and trader bots.', ru: 'Боты для VK, GitHub, Discord и трейдинга.' },
      ],
      ['deep-assistant/telegram-bot', { en: 'Deep.GPT Telegram bot.', ru: 'Telegram-бот Deep.GPT.' }],
      [
        'link-foundation/anygram',
        {
          en: 'Telegram library with best practices for bots.',
          ru: 'Библиотека для Telegram с лучшими практиками для ботов.',
        },
      ],
      [
        'link-foundation/bridge',
        {
          en: 'Bridge between group chats on different platforms.',
          ru: 'Мост между групповыми чатами на разных платформах.',
        },
      ],
      ['konard/vk-bot', { en: 'VK user bot on vk-io.', ru: 'Пользовательский бот VK на vk-io.' }],
      [
        'konard/telegram-terminal-bot',
        { en: 'Terminal access through a Telegram bot.', ru: 'Доступ к терминалу через Telegram-бота.' },
      ],
      [
        'deep-foundation/russian-laws-bot',
        { en: 'Search in Russian laws via a bot.', ru: 'Поиск по законам России через бота.' },
      ],
    ],
  },
  {
    id: 'research',
    name: { en: 'Scientist', ru: 'Учёный' },
    summary: {
      en: 'Mathematics, logic, physics and theory of links.',
      ru: 'Математика, логика, физика и теория связей.',
    },
    repos: [
      ['link-foundation/meta-theory', { en: 'The links meta-theory.', ru: 'Метатеория связей.' }],
      [
        'deep-foundation/deep-theory',
        { en: 'Links theory formalized in Coq.', ru: 'Теория связей, формализованная в Coq.' },
      ],
      [
        'konard/problem-solving',
        { en: 'Universal problem solving algorithm.', ru: 'Универсальный алгоритм решения задач.' },
      ],
      [
        'konard/p-vs-np',
        {
          en: 'Experiment to prove or disprove P = NP in Rocq.',
          ru: 'Эксперимент по доказательству или опровержению P = NP на Rocq.',
        },
      ],
      ['konard/tsp', { en: 'Travelling salesman problem solutions.', ru: 'Решения задачи коммивояжёра.' }],
      ['konard/subset-sum', { en: 'The simplest NP-hard problem.', ru: 'Простейшая NP-трудная задача.' }],
      [
        'konard/physical-unified-theory',
        {
          en: 'Grand unified theory of everything for physics.',
          ru: 'Великая единая теория всего для физики.',
        },
      ],
      [
        'link-foundation/relative-meta-logic',
        {
          en: 'Logic framework that reasons relatively.',
          ru: 'Логическая система, которая рассуждает относительно.',
        },
      ],
      [
        'link-foundation/network-isomorphism-solver',
        { en: 'Network isomorphism solver.', ru: 'Решатель задачи изоморфизма сетей.' },
      ],
      [
        'link-assistant/semantic-primes',
        {
          en: 'Formal universal ontology from semantic primes.',
          ru: 'Формальная универсальная онтология из семантических примитивов.',
        },
      ],
    ],
  },
  {
    id: 'lead',
    name: { en: 'CEO, CTO & team lead', ru: 'CEO, CTO и тимлид' },
    summary: {
      en: 'Organizing people, plans, architecture and processes.',
      ru: 'Организация людей, планов, архитектуры и процессов.',
    },
    repos: [
      [
        'link-assistant/hive-mind',
        {
          en: 'Automation of automation: AI agents as a development team.',
          ru: 'Автоматизация автоматизации: ИИ-агенты как команда разработки.',
        },
      ],
      [
        'deep-foundation/dev',
        {
          en: 'Monorepository that onboards a whole team in one command.',
          ru: 'Монорепозиторий, который готовит рабочее окружение для всей команды одной командой в терминале.',
        },
      ],
      [
        'link-foundation/code-architecture-principles',
        { en: 'Architecture principles for code design.', ru: 'Принципы архитектуры для проектирования кода.' },
      ],
      [
        'link-assistant/master-plan',
        { en: 'Issues and community hub of Link.Assistant.', ru: 'Задачи и центр сообщества Link.Assistant.' },
      ],
      [
        'linksplatform/Documentation',
        {
          en: 'Documentation root for all LinksPlatform projects.',
          ru: 'Корень документации всех проектов LinksPlatform.',
        },
      ],
      [
        'konard/kaiten-api-tools',
        {
          en: 'Kaiten API tools for project management.',
          ru: 'Инструменты для Kaiten API для управления проектами.',
        },
      ],
      [
        'konard/yougile-to-gh',
        { en: 'Converts YouGile tasks to GitHub issues.', ru: 'Переносит задачи из YouGile в issues на GitHub.' },
      ],
    ],
  },
  {
    id: 'finance',
    name: { en: 'FinTech & e-commerce', ru: 'Финтех и электронная коммерция' },
    summary: {
      en: 'Trading, payments and personal finance.',
      ru: 'Трейдинг, платежи и личные финансы.',
    },
    repos: [
      [
        'link-assistant/trader-bot',
        {
          en: 'Portfolio balancing trading bot in Rust.',
          ru: 'Торговый бот на Rust для балансировки портфеля.',
        },
      ],
      [
        'link-assistant/scalper-trader-bot',
        { en: 'Scalping strategy trading bot.', ru: 'Торговый бот со скальпинговой стратегией.' },
      ],
      [
        'konard/networth-calculator',
        {
          en: 'Speed of net worth growth or decline.',
          ru: 'Скорость роста или снижения чистого капитала.',
        },
      ],
      [
        'konard/cbr-key-rate-monitor',
        { en: 'Monitors the Bank of Russia key rate.', ru: 'Следит за ключевой ставкой Банка России.' },
      ],
      [
        'konard/price-power-law-inference',
        {
          en: 'Infers a power law from historical prices.',
          ru: 'Выводит степенной закон из исторических цен.',
        },
      ],
      ['konard/payplay-api', { en: 'PayPlay payments API via PHP.', ru: 'API платежей PayPlay на PHP.' }],
      [
        'konard/3-ndfl',
        {
          en: '3-NDFL tax document generation for dividends.',
          ru: 'Формирование декларации 3-НДФЛ по дивидендам.',
        },
      ],
    ],
  },
];
