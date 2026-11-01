// Career timeline (issue #11): the full record. The hh.ru CV is a subset of it.
//
// Every text is `{ en, ru }`. English titles follow LinkedIn, Russian titles
// follow hh.ru; company names are the English names in English and the Russian
// legal names in Russian where they are known.
//
// - start / end: 'YYYY-MM', end: null means present.
// - type: 'company' (employment) or 'open-source' (founded or led projects).
// - employment: the full-time part of an open-source project, counted as work experience.
// - roles: the kinds of experience (the base positions in src/data/positions.js) the job counts for.
// - bullets: achievements; `topics` let a tailored CV pick the relevant ones
//   (see TOPICS and src/data/positions.js).
// - tags: the stack, all of it (the site shows every tag, a CV shows the first ones).
//
// Sources: the hh.ru CV and LinkedIn as quoted in issue #11, Habr Career
// (career.habr.com/drakonard), CodersRank, t.me/drakonard and GitHub
// organization metadata (docs/case-studies/issue-1/data/web-research.md).
import { npmMonthly } from './figures';

// Package figures come from src/data/github.lino (issue #47).
const LINKS_NOTATION_NPM = npmMonthly('links-notation');

/** Topics of the bullets; positions choose bullets by them. */
export const TOPICS = [
  'lead',
  'architecture',
  'devops',
  'ai',
  'backend',
  'frontend',
  'mobile',
  'data',
  'rust',
  'dotnet',
  'trading',
  'research',
  'writing',
  'product',
];

export const experience = [
  {
    id: 'artbridge',
    type: 'company',
    title: { en: 'ArtBridge', ru: 'ArtBridge' },
    role: { en: 'Web Developer', ru: 'Веб-разработчик' },
    start: '2006-11',
    end: '2007-08',
    location: { en: 'Moscow', ru: 'Москва' },
    summary: {
      en: 'Online gift store: new features of the site and automated import of the catalogue from Excel into the database.',
      ru: 'Интернет-магазин подарков: новые возможности сайта и автоматический импорт каталога из Excel в базу данных.',
    },
    bullets: [
      {
        en: 'Extended the store website with new features in PHP, MySQL, HTML/CSS and JavaScript.',
        ru: 'Добавлял новые возможности на сайт магазина на PHP, MySQL, HTML/CSS и JavaScript.',
        topics: ['frontend', 'backend'],
      },
      {
        en: 'Automated the import of goods from Excel price lists into the database, which replaced manual catalogue updates.',
        ru: 'Автоматизировал импорт товаров из прайс-листов Excel в базу данных вместо ручного обновления каталога.',
        topics: ['data', 'backend'],
      },
    ],
    tags: ['PHP', 'MySQL', 'HTML/CSS/JS', 'jQuery', 'Excel'],
    roles: ['developer'],
  },
  {
    id: 'asgardro',
    type: 'company',
    title: { en: 'AsgardRo', ru: 'AsgardRo' },
    role: { en: 'Lead Developer', ru: 'Ведущий разработчик' },
    start: '2007-09',
    end: '2008-04',
    location: { en: 'Moscow', ru: 'Москва' },
    summary: {
      en: 'Ragnarok Online game server: organized team development, extended the eAthena server core, protected the server from cheats and helped to redesign the site.',
      ru: 'Игровой сервер Ragnarok Online: организовал командную разработку, расширял ядро сервера eAthena, защищал сервер от читов и помогал с редизайном сайта.',
    },
    bullets: [
      {
        en: 'Organized team development of the server: tasks, a shared code base and releases.',
        ru: 'Организовал командную разработку сервера: задачи, общая кодовая база и выпуски.',
        topics: ['lead'],
      },
      {
        en: 'Extended the eAthena server core in C/C++ and wrote quest scripts in the server scripting language and Lua.',
        ru: 'Расширял ядро сервера eAthena на C/C++, писал скрипты квестов на языке сервера и Lua.',
        topics: ['backend'],
      },
      {
        en: 'Built anti-cheat protection by reverse engineering the game client with IDA.',
        ru: 'Сделал защиту от читов, исследуя игровой клиент в IDA (обратная разработка).',
        topics: ['backend', 'research'],
      },
      {
        en: 'Helped to redesign the server website (PHP, MySQL, Kohana).',
        ru: 'Помогал с редизайном сайта сервера (PHP, MySQL, Kohana).',
        topics: ['frontend'],
      },
    ],
    tags: ['C/C++', 'eAthena', 'IDA', 'PHP', 'MySQL', 'Lua', 'Kohana'],
    roles: ['developer', 'lead'],
  },
  {
    id: 'alponline',
    type: 'company',
    title: { en: 'AlpOnline', ru: 'АлпОнлайн' },
    role: { en: 'Software Developer', ru: 'Разработчик программного обеспечения' },
    start: '2008-05',
    end: '2009-08',
    location: { en: 'Moscow', ru: 'Москва' },
    url: 'https://alprussia.com',
    summary: {
      en: 'Tour search and booking for travel agencies: aggregation of tour-operator offers into one database and a search engine over hundreds of millions of tours.',
      ru: 'Поиск и бронирование туров для турагентств: сбор предложений туроператоров в единую базу и поисковая система по сотням миллионов туров.',
    },
    bullets: [
      {
        en: 'Built the tour search engine that answered in under 0.1 s across hundreds of millions of tours.',
        ru: 'Создал поисковую систему, которая отвечала быстрее 0,1 с по сотням миллионов туров.',
        topics: ['backend', 'data', 'dotnet', 'architecture'],
      },
      {
        en: 'Automated the aggregation of tour-operator offers and the synchronization with dozens of the largest Russian tour operators.',
        ru: 'Автоматизировал сбор предложений туроператоров и синхронизацию с десятками крупнейших туроператоров России.',
        topics: ['backend', 'data', 'dotnet'],
      },
      {
        en: 'Built the tour content database used by the search and the agencies.',
        ru: 'Создал базу контента туров, которой пользовались поиск и турагентства.',
        topics: ['data'],
      },
      {
        en: 'Developed the search and booking web interface for travel agencies (ASP.NET, AJAX).',
        ru: 'Разрабатывал веб-интерфейс поиска и бронирования для турагентств (ASP.NET, AJAX).',
        topics: ['frontend', 'dotnet'],
      },
    ],
    tags: ['C#', 'ASP.NET', 'AJAX', 'MS SQL'],
    roles: ['developer'],
  },
  {
    id: 'pegas',
    type: 'company',
    title: { en: 'Pegas', ru: 'Пегас' },
    role: { en: 'Software Developer', ru: 'Разработчик программного обеспечения' },
    start: '2009-09',
    end: '2011-03',
    location: { en: 'Tel Aviv, Israel', ru: 'Тель-Авив, Израиль' },
    url: 'https://pegast.ru',
    summary: {
      en: 'Unified management system of a tour operator: multilingual data, role-based access, pricing of tours, hotels and flights, search and booking.',
      ru: 'Единая система управления туроператора: многоязычные данные, разграничение доступа по ролям, расчёт цен туров, отелей и перелётов, поиск и бронирование.',
    },
    bullets: [
      {
        en: 'Developed the unified tour-operator management system: pricing of tours, hotels and flights, search and booking.',
        ru: 'Разрабатывал единую систему управления туроператора: расчёт цен туров, отелей и перелётов, поиск и бронирование.',
        topics: ['backend', 'dotnet', 'architecture'],
      },
      {
        en: 'Implemented multilingual data and role-based access control across the system.',
        ru: 'Реализовал многоязычные данные и разграничение доступа по ролям во всей системе.',
        topics: ['backend', 'dotnet', 'data'],
      },
      {
        en: 'Built desktop and web clients with WinForms, DevExpress, Silverlight, ASP.NET MVC and jQuery over WCF services and MS SQL.',
        ru: 'Создавал настольные и веб-клиенты на WinForms, DevExpress, Silverlight, ASP.NET MVC и jQuery поверх сервисов WCF и MS SQL.',
        topics: ['frontend', 'dotnet'],
      },
    ],
    tags: ['C#', 'WCF', 'WinForms', 'DevExpress', 'Silverlight', 'ASP.NET MVC', 'jQuery', 'MS SQL'],
    roles: ['developer'],
  },
  {
    id: 'linksplatform',
    type: 'open-source',
    title: { en: 'LinksPlatform', ru: 'LinksPlatform' },
    role: { en: 'Founder, CEO', ru: 'Основатель, CEO' },
    start: '2010-03',
    end: null,
    // On hh.ru LinksPlatform only fills the gap between ELAR and Abracar; this
    // period counts towards the total experience (see experienceMonths).
    employment: { start: '2015-01', end: '2020-06' },
    url: 'https://github.com/linksplatform',
    summary: {
      en: 'Started in March 2010 with the first Link (Source, Linker, Target) prototype; on GitHub since 2012, full time in 2015 – 2020. Associative database engines, Links Notation, rule-based code translators and bots, made by an international open-source team.',
      ru: 'Начата в марте 2010 года с первого прототипа связи (Source, Linker, Target); на GitHub с 2012 года, основная работа в 2015 – 2020 годах. Движки ассоциативных баз данных, нотация связей Links Notation, трансляторы кода на правилах и боты, созданные международной open-source-командой.',
    },
    bullets: [
      {
        en: 'Founded and led an international open-source team: roadmap, reviews, CI and releases of 80+ repositories.',
        ru: 'Основал и возглавил международную open-source-команду: план развития, ревью, CI и выпуски более 80 репозиториев.',
        topics: ['lead', 'devops'],
      },
      {
        en: 'Designed the associative database engines Doublets, Triplets and Sequences in C#, C++ and Rust; ~1.9M NuGet downloads.',
        ru: 'Спроектировал движки ассоциативных баз данных Doublets, Triplets и Sequences на C#, C++ и Rust; около 1,9 млн загрузок из NuGet.',
        topics: ['data', 'architecture', 'rust', 'dotnet', 'research'],
      },
      {
        en: `Created Links Notation, a way to describe data with references and links (${LINKS_NOTATION_NPM.en}).`,
        ru: `Создал Links Notation — нотацию для описания данных ссылками и связями (${LINKS_NOTATION_NPM.ru}).`,
        topics: ['research', 'data'],
      },
      {
        en: 'Built rule-based source code translators: C# → C++, C# → Python, C++ → Java, Python → Nim, Java → C++.',
        ru: 'Создал трансляторы исходного кода на правилах: C# → C++, C# → Python, C++ → Java, Python → Nim, Java → C++.',
        topics: ['dotnet', 'research', 'architecture'],
      },
      {
        en: 'Built bots: a VK community bot, a Discord bot for GitHub registration, a GitHub repository generator and a Tinkoff Invest trading bot.',
        ru: 'Создал ботов: бот сообщества ВКонтакте, Discord-бот для регистрации на GitHub, генератор репозиториев GitHub и торгового бота для Tinkoff Invest API.',
        topics: ['backend', 'trading', 'ai'],
      },
      {
        en: 'Built a web spider that loads pages into the associative storage.',
        ru: 'Создал веб-паук, который загружает страницы в ассоциативное хранилище.',
        topics: ['data', 'backend'],
      },
    ],
    tags: [
      'C#',
      'Rust',
      'C++',
      'C',
      'JavaScript',
      'Python',
      'ASP.NET MVC',
      'SQLite',
      'Associative data',
      'GitHub Actions',
      'Travis CI',
    ],
    roles: ['lead', 'developer', 'devops', 'research'],
  },
  {
    id: 'termika',
    type: 'company',
    title: { en: 'Termika', ru: 'ЗАО «Термика»' },
    role: { en: '.NET Programmer', ru: 'Программист .NET' },
    start: '2013-04',
    end: '2014-04',
    location: { en: 'Moscow', ru: 'Москва' },
    summary: {
      en: 'Production Control system for Rosneft and OLIMPOKS, the system of employee certification: development, load testing and support.',
      ru: 'Система «Производственный контроль» для «Роснефти» и ОЛИМПОКС — система аттестации сотрудников: разработка, нагрузочное тестирование и поддержка.',
    },
    bullets: [
      {
        en: 'Developed the Production Control system for Rosneft (WPF, Telerik, Stimulsoft reports, MS SQL).',
        ru: 'Разрабатывал систему «Производственный контроль» для «Роснефти» (WPF, Telerik, отчёты Stimulsoft, MS SQL).',
        topics: ['dotnet', 'frontend', 'backend'],
      },
      {
        en: 'Supported and extended OLIMPOKS, the employee certification system (ASP.NET, MS SQL, SQLite).',
        ru: 'Поддерживал и развивал ОЛИМПОКС — систему аттестации сотрудников (ASP.NET, MS SQL, SQLite).',
        topics: ['dotnet', 'backend'],
      },
      {
        en: 'Load testing (Selenium) of the employee training and certification system (listed on Habr Career).',
        ru: 'Нагрузочное тестирование (Selenium) системы обучения и аттестации сотрудников (указано на «Хабр Карьере»).',
        topics: ['devops'],
      },
    ],
    tags: ['C#', 'WPF', 'Telerik', 'Stimulsoft', 'MS SQL', 'ASP.NET', 'SQLite', 'Selenium'],
    roles: ['developer', 'devops'],
  },
  {
    id: 'elar',
    type: 'company',
    title: { en: 'ELAR', ru: 'АО «ЭЛАР»' },
    role: { en: 'Programmer', ru: 'Программист' },
    start: '2014-05',
    end: '2014-12',
    location: { en: 'Moscow', ru: 'Москва' },
    url: 'https://elar.ru',
    summary: {
      en: 'Document management: integrations with Saperion, import of recognized documents, PDF compression, the AIS “Archive” for state archives and patent classification automation for FIPS.',
      ru: 'Электронный документооборот: интеграции с Saperion, импорт распознанных документов, сжатие PDF, АИС «Архив» для государственных архивов и автоматизация классификации патентов для ФИПС.',
    },
    bullets: [
      {
        en: 'Built the adapter between the document system of Gazprombank and ELAR’s Saperion archive.',
        ru: 'Создал адаптер между системой документооборота Газпромбанка и архивом Saperion компании ЭЛАР.',
        topics: ['backend', 'dotnet'],
      },
      {
        en: 'Built the import component for recognized documents (ABBYY FineReader Engine) and a PDF compression component (Aspose).',
        ru: 'Создал компонент импорта распознанных документов (ABBYY FineReader Engine) и компонент сжатия PDF (Aspose).',
        topics: ['backend', 'dotnet', 'data'],
      },
      {
        en: 'Supported the AIS “Archive”, the information system used by state archives (WinForms, MS SQL).',
        ru: 'Поддерживал АИС «Архив» — информационную систему государственных архивов (WinForms, MS SQL).',
        topics: ['dotnet', 'data'],
      },
      {
        en: 'Built a system for FIPS that automates the classification of business activities for patent registration.',
        ru: 'Создал для ФИПС систему, которая автоматизирует классификацию видов деятельности при регистрации патентов.',
        topics: ['backend', 'dotnet', 'ai'],
      },
    ],
    tags: ['C#', 'ASP.NET WebForms', 'WinForms', 'MS SQL', 'Java', 'Aspose', 'ABBYY FineReader Engine', 'TFS'],
    roles: ['developer'],
  },
  {
    id: 'abracar',
    type: 'company',
    title: { en: 'Abracar LLC (ShakeApp)', ru: 'ООО «Абракар» (ShakeApp)' },
    role: { en: 'Senior Software Engineer', ru: 'Программист' },
    start: '2020-07',
    end: '2022-08',
    location: { en: 'Moscow', ru: 'Москва' },
    summary: {
      en: 'ShakeApp, a car and apartment sharing platform: web and mobile apps, GraphQL backend on Hasura and PostgreSQL, infrastructure on Kubernetes.',
      ru: 'ShakeApp — платформа совместного использования автомобилей и квартир: веб- и мобильные приложения, бэкенд GraphQL на Hasura и PostgreSQL, инфраструктура на Kubernetes.',
    },
    bullets: [
      {
        en: 'Developed the ShakeApp web app with TypeScript, Next.js and React, and its iOS and Android apps with Capacitor and Cordova.',
        ru: 'Разрабатывал веб-приложение ShakeApp на TypeScript, Next.js и React, а также приложения для iOS и Android на Capacitor и Cordova.',
        topics: ['frontend', 'mobile'],
      },
      {
        en: 'Built the backend on PostgreSQL, Hasura and GraphQL, with file storage in MinIO (S3).',
        ru: 'Создал бэкенд на PostgreSQL, Hasura и GraphQL с хранением файлов в MinIO (S3).',
        topics: ['backend', 'data'],
      },
      {
        en: 'Set up GitLab CI/CD, Docker and Kubernetes on Selectel, with monitoring in Grafana and Prometheus.',
        ru: 'Настроил GitLab CI/CD, Docker и Kubernetes в Selectel, мониторинг в Grafana и Prometheus.',
        topics: ['devops'],
      },
    ],
    tags: [
      'TypeScript',
      'Next.js',
      'React',
      'PostgreSQL',
      'Hasura',
      'GraphQL',
      'MinIO',
      'Capacitor',
      'Cordova',
      'GitLab CI/CD',
      'Docker',
      'Kubernetes',
      'Selectel',
      'Grafana',
      'Prometheus',
    ],
    roles: ['developer', 'devops'],
  },
  {
    id: 'deep-foundation',
    type: 'open-source',
    title: { en: 'Deep.Foundation', ru: 'Deep.Foundation' },
    role: { en: 'Co-founder, CTO', ru: 'Сооснователь, CTO' },
    start: '2022-09',
    end: '2024-06',
    employment: { start: '2022-09', end: '2024-06' },
    location: { en: 'Remote', ru: 'Удалённо' },
    url: 'https://deep.foundation/',
    summary: {
      en: 'Deep, an associative data-oriented OS and super-app. Open-source work on Deep began in 2020 (the GitHub organization exists since March 2020, alongside Abracar); full time as CTO from September 2022.',
      ru: 'Deep — ассоциативная, ориентированная на данные ОС и суперприложение. Open-source-разработка Deep началась в 2020 году (организация на GitHub существует с марта 2020 года, параллельно с работой в «Абракаре»); основная работа в должности CTO — с сентября 2022 года.',
    },
    bullets: [
      {
        en: 'Led an international distributed team: planning, code review, documentation, tests, benchmarks and CI/CD.',
        ru: 'Руководил международной распределённой командой: планирование, ревью кода, документация, тесты, бенчмарки и CI/CD.',
        topics: ['lead', 'devops'],
      },
      {
        en: 'Designed the core: a PostgreSQL link storage with a GraphQL API on Hasura, permissions, S3-compatible file storage and isolated handlers in JS, PHP, Python, Rust, C/C++ and Kotlin.',
        ru: 'Спроектировал ядро: хранилище связей на PostgreSQL с GraphQL API на Hasura, правами доступа, S3-совместимым хранилищем файлов и изолированными обработчиками на JS, PHP, Python, Rust, C/C++ и Kotlin.',
        topics: ['architecture', 'backend', 'data'],
      },
      {
        en: 'Built the npm adapter that turned 330+ npm packages into associative Deep packages.',
        ru: 'Создал npm-адаптер, который превратил более 330 npm-пакетов в ассоциативные пакеты Deep.',
        topics: ['backend', 'architecture'],
      },
      {
        en: 'Built the link-network visualization and the React UI of Deep.',
        ru: 'Создал визуализацию сети связей и React-интерфейс Deep.',
        topics: ['frontend'],
      },
      {
        en: 'Delivered demo projects: a GPT-4o Discord bot, news analytics, Deep.Memo, Deep.Me, Deep.Chain (a blockchain with smart contracts), a JS execution bot, Deep.GPT and a smart shop with a voice and text storefront.',
        ru: 'Выпустил демонстрационные проекты: Discord-бот на GPT-4o, аналитика новостей, Deep.Memo, Deep.Me, Deep.Chain (блокчейн со смарт-контрактами), бот выполнения JS, Deep.GPT и умный магазин с голосовой и текстовой витриной.',
        topics: ['ai', 'product', 'trading'],
      },
      {
        en: 'Built a Telegram bot that searches Russian legislation with full-text and vector search.',
        ru: 'Создал Telegram-бота для поиска по законодательству России с полнотекстовым и векторным поиском.',
        topics: ['ai', 'data'],
      },
      {
        en: 'Wrote Habr articles and recorded training videos about Deep and the links theory.',
        ru: 'Писал статьи на «Хабре» и записывал обучающие видео о Deep и теории связей.',
        topics: ['writing', 'research'],
      },
    ],
    tags: [
      'TypeScript',
      'PostgreSQL',
      'Hasura',
      'GraphQL',
      'React',
      'S3',
      'Docker',
      'Kubernetes',
      'Rust',
      'Python',
      'OpenAI API',
    ],
    roles: ['lead', 'developer', 'devops', 'research', 'ml'],
  },
  {
    id: 'deep-gpt',
    type: 'open-source',
    title: { en: 'Deep.GPT (Deep.Assistant)', ru: 'Deep.GPT (Deep.Assistant)' },
    role: { en: 'Co-creator, developer', ru: 'Соавтор, разработчик' },
    start: '2024-05',
    end: null,
    url: 'https://github.com/deep-assistant',
    summary: {
      en: 'The Deep.GPT Telegram bot (t.me/DeepGPTBot): question answering with GPT, Claude and open models, image generation and editing, music generation via Suno, payments and referrals; an OpenAI-compatible API gateway and the GPTutor VK mini app.',
      ru: 'Telegram-бот Deep.GPT (t.me/DeepGPTBot): ответы на вопросы с GPT, Claude и открытыми моделями, генерация и редактирование изображений, генерация музыки через Suno, платежи и реферальная программа; OpenAI-совместимый API-шлюз и мини-приложение GPTutor во ВКонтакте.',
    },
    bullets: [
      {
        en: 'Co-created the Deep.GPT Telegram bot with GPT, Claude and open models, image and music generation, payments and referrals.',
        ru: 'Соавтор Telegram-бота Deep.GPT с моделями GPT, Claude и открытыми моделями, генерацией изображений и музыки, платежами и рефералами.',
        topics: ['ai', 'product', 'backend'],
      },
      {
        en: 'Built the OpenAI-compatible API gateway that routes requests to many model providers.',
        ru: 'Создал OpenAI-совместимый API-шлюз, который направляет запросы к разным поставщикам моделей.',
        topics: ['ai', 'backend', 'architecture'],
      },
    ],
    tags: ['Python', 'JavaScript', 'LLM', 'OpenAI API', 'Telegram'],
    roles: ['ml', 'developer', 'devops'],
  },
  {
    id: 'kaiten',
    type: 'company',
    title: { en: 'Kaiten', ru: 'Kaiten' },
    role: { en: 'Development Team Lead', ru: 'Руководитель группы разработки' },
    start: '2024-07',
    end: '2025-11',
    location: { en: 'Moscow', ru: 'Москва' },
    url: 'https://kaiten.ru',
    summary: {
      en: 'Kaiten, a business process management system: led a team of 5 senior developers working on add-ons, the iOS and Android apps, the billing system and developer tooling.',
      ru: 'Kaiten — система управления бизнес-процессами: руководил группой из 5 senior-разработчиков, которая занималась дополнениями, приложениями для iOS и Android, биллингом и инструментами разработчиков.',
    },
    bullets: [
      {
        en: 'Led a team of 5 senior developers: planning, code review and delivery.',
        ru: 'Руководил группой из 5 senior-разработчиков: планирование, ревью кода и выпуск задач.',
        topics: ['lead'],
      },
      {
        en: 'Developed the add-ons subsystem and the Yandex.Disk add-on (Node.js, React, PostgreSQL, RabbitMQ).',
        ru: 'Разрабатывал подсистему дополнений и дополнение для Яндекс.Диска (Node.js, React, PostgreSQL, RabbitMQ).',
        topics: ['backend', 'frontend', 'architecture'],
      },
      {
        en: 'Built Convertinator, which converts ClickUp data into Kaiten’s import format.',
        ru: 'Создал «Конвертинатор», который переводит данные ClickUp в формат импорта Kaiten.',
        topics: ['data', 'backend'],
      },
      {
        en: 'Worked on the iOS and Android apps and the billing system of a high-load service.',
        ru: 'Работал над приложениями для iOS и Android и системой биллинга высоконагруженного сервиса.',
        topics: ['mobile', 'backend', 'product'],
      },
      {
        en: 'Built developer tooling for the team.',
        ru: 'Создавал инструменты для разработчиков команды.',
        topics: ['devops', 'lead'],
      },
    ],
    tags: ['JavaScript', 'Node.js', 'React', 'Redux', 'Express', 'PostgreSQL', 'MongoDB', 'Redis', 'RabbitMQ'],
    roles: ['lead', 'developer'],
  },
  {
    id: 'link-foundation',
    type: 'open-source',
    title: { en: 'Link.Foundation', ru: 'Link.Foundation' },
    role: { en: 'Founder', ru: 'Основатель' },
    start: '2024-07',
    end: null,
    url: 'https://github.com/link-foundation',
    summary: {
      en: '“The foundation of foundations. Our mission is linkness.” Links Notation, link-cli, use-m, command-stream and the Links Theory.',
      ru: '«Фонд фондов. Наша миссия — связность». Links Notation, link-cli, use-m, command-stream и теория связей.',
    },
    bullets: [
      {
        en: 'Published Links Theory 0.0.1 – 0.0.3 and the links meta-theory with formal proofs in Rocq and Lean.',
        ru: 'Опубликовал теорию связей 0.0.1 – 0.0.3 и метатеорию связей с формальными доказательствами на Rocq и Lean.',
        topics: ['research', 'writing'],
      },
      {
        en: 'Built use-m (import any npm module at runtime), command-stream and link-cli, a CLI with a substitution-based query language.',
        ru: 'Создал use-m (импорт любого npm-модуля во время выполнения), command-stream и link-cli — CLI с языком запросов на подстановках.',
        topics: ['backend', 'devops', 'rust'],
      },
    ],
    tags: ['Rust', 'JavaScript', 'Links Notation', 'Rocq', 'Lean'],
    roles: ['lead', 'developer', 'devops', 'research', 'ml'],
  },
  {
    id: 'link-assistant',
    type: 'open-source',
    title: { en: 'Link.Assistant', ru: 'Link.Assistant' },
    role: { en: 'Founder', ru: 'Основатель' },
    start: '2025-05',
    end: null,
    url: 'https://github.com/link-assistant',
    summary: {
      en: 'Hive Mind, the AI that controls AIs to do the automation of automation; agents, model routers and formal AI.',
      ru: 'Hive Mind — ИИ, который управляет ИИ ради автоматизации автоматизации; агенты, маршрутизаторы моделей и формальный ИИ.',
    },
    bullets: [
      {
        en: 'Built Hive Mind, which solves GitHub issues end to end with AI agents (Claude Code, Codex, OpenCode): requirements, failing tests, pull requests, CI and review.',
        ru: 'Создал Hive Mind, который решает задачи GitHub от начала до конца с помощью ИИ-агентов (Claude Code, Codex, OpenCode): требования, падающие тесты, пул-реквесты, CI и ревью.',
        topics: ['ai', 'devops', 'lead', 'architecture'],
      },
      {
        en: 'Built the agent CLI, a model router and formal-ai, a symbolic assistant that runs the problem solving algorithm.',
        ru: 'Создал CLI-агента, маршрутизатор моделей и formal-ai — символьного ассистента, работающего по алгоритму решения задач.',
        topics: ['ai', 'research', 'rust'],
      },
      {
        en: 'Built trading bots (trader-bot, scalper-trader-bot) and market research tools.',
        ru: 'Создал торговых ботов (trader-bot, scalper-trader-bot) и инструменты исследования рынка.',
        topics: ['trading', 'ai'],
      },
    ],
    tags: ['AI agents', 'Claude Code', 'Codex', 'JavaScript', 'Rust', 'GitHub Actions'],
    roles: ['ml', 'lead', 'devops', 'developer', 'research'],
  },
  {
    id: 'capico',
    type: 'company',
    title: { en: 'Capico LLC', ru: 'Capico LLC' },
    role: { en: 'Senior Software Engineer', ru: 'Senior Software Engineer' },
    start: '2025-11',
    end: '2026-05',
    location: { en: 'Tbilisi, Georgia', ru: 'Тбилиси, Грузия' },
    url: 'https://capico.app',
    summary: {
      en: 'Trading aggregator: a grid trading system for the ByBit and BitGet exchanges, the trading terminal and other parts of the aggregator.',
      ru: 'Торговый агрегатор: система сеточной торговли для бирж ByBit и BitGet, торговый терминал и другие части агрегатора.',
    },
    bullets: [
      {
        en: 'Developed the grid trading system for the ByBit and BitGet exchanges in Rust (PostgreSQL, InfluxDB, Redis).',
        ru: 'Разрабатывал систему сеточной торговли для бирж ByBit и BitGet на Rust (PostgreSQL, InfluxDB, Redis).',
        topics: ['trading', 'rust', 'backend', 'data'],
      },
      {
        en: 'Designed the UI/UX of the trading terminal with TradingView charts, and other parts of the trading aggregator (Vue.js).',
        ru: 'Проектировал UI/UX торгового терминала с графиками TradingView и других частей торгового агрегатора (Vue.js).',
        topics: ['trading', 'frontend', 'product'],
      },
      {
        en: 'Maintained GitLab CI/CD pipelines of the services.',
        ru: 'Поддерживал конвейеры GitLab CI/CD сервисов.',
        topics: ['devops'],
      },
    ],
    tags: ['Rust', 'Vue.js', 'PostgreSQL', 'InfluxDB', 'Redis', 'TradingView', 'GitLab CI/CD'],
    roles: ['developer'],
  },
  {
    id: 'evirma',
    type: 'company',
    title: { en: 'Evirma', ru: 'Evirma' },
    role: { en: 'Tech Lead', ru: 'Tech Lead' },
    start: '2026-05',
    end: null,
    url: 'https://evirma.ru',
    summary: {
      en: 'AI-driven development of PHP and Go services with Claude Code and Codex: CI/CD, a test stand, automated fixing of Sentry errors, ad campaign scheduling, Wildberries data parsing and an AI router.',
      ru: 'Разработка сервисов на PHP и Go с помощью ИИ (Claude Code и Codex): CI/CD, тестовый стенд, автоматическое исправление ошибок из Sentry, планирование рекламных кампаний, парсинг данных Wildberries и ИИ-маршрутизатор.',
    },
    bullets: [
      {
        en: 'Introduced AI-driven development of the PHP and Go services with Claude Code and Codex.',
        ru: 'Внедрил разработку сервисов на PHP и Go с помощью ИИ-агентов Claude Code и Codex.',
        topics: ['lead', 'ai', 'backend'],
      },
      {
        en: 'Automated CI/CD and built a test stand for the services.',
        ru: 'Автоматизировал CI/CD и создал тестовый стенд для сервисов.',
        topics: ['devops'],
      },
      {
        en: 'Automated the fixing of Sentry errors with AI agents.',
        ru: 'Автоматизировал исправление ошибок из Sentry с помощью ИИ-агентов.',
        topics: ['ai', 'devops'],
      },
      {
        en: 'Built an AI router that gives agents and staff one access point to AI providers.',
        ru: 'Создал ИИ-маршрутизатор — единую точку доступа к поставщикам ИИ для агентов и сотрудников.',
        topics: ['ai', 'architecture', 'backend'],
      },
      {
        en: 'Built ad campaign scheduling and a Wildberries data parsing service.',
        ru: 'Создал планирование рекламных кампаний и сервис парсинга данных Wildberries.',
        topics: ['backend', 'data', 'product'],
      },
    ],
    tags: ['PHP', 'Go', 'AI agents', 'Claude Code', 'Codex', 'CI/CD', 'Sentry'],
    roles: ['lead', 'ml', 'devops', 'developer'],
  },
];

const monthIndex = (ym) => {
  const [year, month] = ym.split('-').map(Number);
  return year * 12 + month - 1;
};

/**
 * Months of professional experience, counted like hh.ru: every month of a
 * company job, and the full-time open-source periods (`employment`: LinksPlatform
 * 2015 – 2020, Deep.Foundation CTO 2022 – 2024) that the hh.ru CV lists as jobs.
 * Overlapping months count once. `asOf` is a Date (the current month counts).
 */
export function experienceMonths(items = experience, asOf = new Date()) {
  const now = asOf.getFullYear() * 12 + asOf.getMonth();
  const months = new Set();
  items.forEach((item) => {
    const period = item.type === 'company' ? item : item.employment;
    if (!period) return;
    const last = period.end ? monthIndex(period.end) : now;
    for (let m = monthIndex(period.start); m <= Math.min(last, now); m += 1) months.add(m);
  });
  return months.size;
}

export const experienceYears = (items = experience, asOf = new Date()) =>
  Math.floor(experienceMonths(items, asOf) / 12);

const filled = (text) => Boolean(text && text.en?.trim() && text.ru?.trim());

/** What a job lacks: the site is the full record, so every job needs a role, dates, a summary, bullets and tags. */
export function missingFields(job) {
  const missing = [];
  if (!filled(job.title)) missing.push('title');
  if (!filled(job.role)) missing.push('role');
  if (!/^\d{4}-\d{2}$/.test(job.start || '') || (job.end != null && !/^\d{4}-\d{2}$/.test(job.end))) {
    missing.push('dates');
  }
  if (!filled(job.summary)) missing.push('summary');
  if (!job.bullets?.length || !job.bullets.every(filled)) missing.push('bullets');
  if (!job.tags?.length) missing.push('tags');
  if (!job.roles?.length) missing.push('roles');
  return missing;
}

const ruYears = (n) => {
  const last = n % 10;
  if (n % 100 >= 11 && n % 100 <= 14) return 'лет';
  if (last === 1) return 'год';
  if (last >= 2 && last <= 4) return 'года';
  return 'лет';
};

/** `{ en: '18 years', ru: '18 лет' }` for the professional experience as of `asOf`. */
export function yearsText(asOf = new Date(), items = experience) {
  const n = experienceYears(items, asOf);
  return { en: `${n} years`, ru: `${n} ${ruYears(n)}` };
}
