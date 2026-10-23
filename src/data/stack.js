// The associative stack (issue #13): every original repository of linksplatform,
// link-foundation and link-assistant in exactly one layer, plus the Deep
// platform and the personal projects it grew from. The layers start from the
// theory (link-foundation/meta-theory) and go up to the applications; every
// layer lists [owner/name, { en, ru }] in reading order. Texts with L → L² are
// shown in the chosen notation (src/links/notation.js).

const ORGANIZATIONS = ['linksplatform', 'link-foundation', 'link-assistant'];

export const STACK = [
  {
    id: 'theory',
    title: { en: 'Theory & logic', ru: 'Теория и логика' },
    glyph: '11',
    summary: {
      en: 'Everything is a link: a reference to a vector of references. One formula, L → L², covers all data.',
      ru: 'Всё есть связь: ссылка на вектор ссылок. Одна формула, L → L², описывает любые данные.',
    },
    repos: [
      [
        'link-foundation/meta-theory',
        {
          en: 'The links meta-theory with versions, PDFs and proofs: the start of the whole stack.',
          ru: 'Метатеория связей с версиями, PDF и доказательствами — начало всего стека.',
        },
      ],
      [
        'deep-foundation/deep-theory',
        { en: 'The original links theory formalized in Coq.', ru: 'Исходная теория связей, формализованная на Coq.' },
      ],
      [
        'link-foundation/meta-ontology',
        { en: 'An ontology that can describe itself.', ru: 'Онтология, способная описать саму себя.' },
      ],
      [
        'link-foundation/relative-meta-logic',
        { en: 'A probabilistic logic on top of links.', ru: 'Вероятностная логика поверх связей.' },
      ],
      [
        'link-foundation/network-isomorphism-solver',
        {
          en: 'Checks whether two networks of links have the same structure.',
          ru: 'Проверяет, одинакова ли структура двух сетей связей.',
        },
      ],
      [
        'link-assistant/semantic-primes',
        {
          en: 'The search for a universal ontology, taxonomy and language from semantic primes.',
          ru: 'Поиск универсальной онтологии, таксономии и языка из семантических примитивов.',
        },
      ],
      ['link-assistant/meta-expression', { en: 'An expression about expressions.', ru: 'Выражение о выражениях.' }],
      [
        'linksplatform/Solver',
        {
          en: 'Finds the shortest and simplest functions for given inputs and outputs.',
          ru: 'Ищет самые короткие и простые функции для заданных входов и выходов.',
        },
      ],
    ],
  },
  {
    id: 'notation',
    title: { en: 'Notation & languages', ru: 'Нотация и языки' },
    glyph: '11 12',
    summary: {
      en: 'A human readable way to write links, and languages, grammars and translators made of links.',
      ru: 'Понятный человеку способ записывать связи, а также языки, грамматики и переводчики из связей.',
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
        {
          en: 'A notation for the largest possible set of languages, built on ( ), { } and [ ].',
          ru: 'Нотация для максимально широкого набора языков, построенная на ( ), { } и [ ].',
        },
      ],
      [
        'link-foundation/meta-language',
        {
          en: 'A language that can describe any language, including itself.',
          ru: 'Язык, способный описать любой язык, включая самого себя.',
        },
      ],
      [
        'link-foundation/lino-schema',
        {
          en: 'A dialect of Links Notation to describe Links Notation schemas.',
          ru: 'Диалект Links Notation для описания схем Links Notation.',
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
        'link-foundation/deduplino',
        {
          en: 'Deduplicates Links Notation: repeated links are written once.',
          ru: 'Дедупликация Links Notation: повторяющиеся связи записываются один раз.',
        },
      ],
      [
        'link-foundation/lino-env',
        {
          en: 'Read and write .lenv files: environment variables as links.',
          ru: 'Чтение и запись файлов .lenv: переменные окружения как связи.',
        },
      ],
      [
        'link-foundation/lino-arguments',
        { en: 'Command line arguments as links.', ru: 'Аргументы командной строки как связи.' },
      ],
      [
        'link-foundation/lino-i18n',
        { en: 'Internationalization written in Links Notation.', ru: 'Интернационализация на Links Notation.' },
      ],
      [
        'link-foundation/lino-cache',
        {
          en: 'A cache that stores objects as Links Notation instead of JSON.',
          ru: 'Кэш, который хранит объекты в Links Notation вместо JSON.',
        },
      ],
      [
        'link-foundation/lino-rest-api',
        {
          en: 'A REST API framework that speaks Links Notation instead of JSON.',
          ru: 'Фреймворк REST API, который использует Links Notation вместо JSON.',
        },
      ],
      [
        'link-foundation/lino-document-markup-language',
        {
          en: 'A universal document markup language on links.',
          ru: 'Универсальный язык разметки документов на связях.',
        },
      ],
      [
        'link-foundation/grammar-expressions',
        {
          en: 'A hybrid of regular expressions and PEGs on the Links Notation tokenizer.',
          ru: 'Гибрид регулярных выражений и PEG на токенизаторе Links Notation.',
        },
      ],
      [
        'link-foundation/grammar-inference',
        {
          en: 'Infers a grammar from examples of text of one domain.',
          ru: 'Выводит грамматику из примеров текста одной предметной области.',
        },
      ],
      [
        'link-foundation/transformer',
        {
          en: 'A rule based, Turing complete transformer on Links Notation.',
          ru: 'Основанный на правилах тьюринг-полный преобразователь на Links Notation.',
        },
      ],
      [
        'link-foundation/universal-translator',
        { en: 'A universal translator between languages.', ru: 'Универсальный переводчик между языками.' },
      ],
      [
        'link-assistant/human-language',
        {
          en: 'A new kind of language for all people on Earth.',
          ru: 'Язык нового типа для всех людей на Земле.',
        },
      ],
      [
        'link-assistant/calculator',
        {
          en: 'A grammar based calculator with dates and currencies, in Rust WebAssembly.',
          ru: 'Калькулятор на грамматиках с датами и валютами, на Rust WebAssembly.',
        },
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
      en: 'Doublet and triplet stores on memory-mapped files with size-balanced trees, in C#, C++ and Rust, and a file system on them.',
      ru: 'Хранилища дуплетов и триплетов на отображаемых в память файлах с деревьями, сбалансированными по размеру, на C#, C++ и Rust, и файловая система на них.',
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
        'linksplatform/Data',
        {
          en: 'The common interfaces of links stores: constants, criteria and addresses.',
          ru: 'Общие интерфейсы хранилищ связей: константы, критерии и адреса.',
        },
      ],
      [
        'linksplatform/data-rs',
        { en: 'The core data types and traits in Rust.', ru: 'Базовые типы и трейты на Rust.' },
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
        'link-foundation/lfs',
        {
          en: 'The links file system: a file system driver whose metadata is a doublets store.',
          ru: 'Файловая система связей: драйвер файловой системы, метаданные которой — хранилище дуплетов.',
        },
      ],
      [
        'linksplatform/Data.Triplets',
        { en: 'The triplets engine: links with a type.', ru: 'Движок триплетов: связи с типом.' },
      ],
      [
        'linksplatform/Data.Triplets.Kernel',
        { en: 'The native triplets kernel in C.', ru: 'Нативное ядро триплетов на C.' },
      ],
      [
        'linksplatform/Data.Sequences',
        { en: 'Sequences of links: the common interfaces.', ru: 'Последовательности связей: общие интерфейсы.' },
      ],
      [
        'linksplatform/Data.Doublets.Sequences',
        { en: 'Strings and sequences as nested doublets.', ru: 'Строки и последовательности как вложенные дуплеты.' },
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
      [
        'linksplatform/Collections.Methods',
        {
          en: 'Generic methods of lists and trees, the size-balanced trees among them.',
          ru: 'Обобщённые методы списков и деревьев, в том числе деревьев, сбалансированных по размеру.',
        },
      ],
      [
        'linksplatform/platform-rs',
        {
          en: 'The first Rust workspace of the platform, later split into crates.',
          ru: 'Первое рабочее пространство платформы на Rust, позже разделённое на крейты.',
        },
      ],
      [
        'linksplatform/IdDistributorServer',
        {
          en: 'A server of identifiers, a prototype of the core service of a links cluster.',
          ru: 'Сервер идентификаторов — прототип основного сервиса кластера связей.',
        },
      ],
      [
        'linksplatform/IdClient',
        { en: 'The TCP/IP client of the identifier server.', ru: 'TCP/IP клиент сервера идентификаторов.' },
      ],
    ],
  },
  {
    id: 'libraries',
    title: { en: 'Platform libraries', ru: 'Библиотеки платформы' },
    glyph: '11 21 31',
    summary: {
      en: 'Small libraries the engines are built from; each one can be used on its own.',
      ru: 'Небольшие библиотеки, из которых собраны движки; каждую можно использовать отдельно.',
    },
    repos: [
      ['linksplatform/Interfaces', { en: 'The common interfaces of the platform.', ru: 'Общие интерфейсы платформы.' }],
      [
        'linksplatform/Delegates',
        { en: 'Delegates (function objects) for C++.', ru: 'Делегаты (функциональные объекты) для C++.' },
      ],
      [
        'linksplatform/Numbers',
        { en: 'Generic arithmetic and bit operations.', ru: 'Обобщённая арифметика и битовые операции.' },
      ],
      ['linksplatform/Ranges', { en: 'Ranges of values and their checks.', ru: 'Диапазоны значений и их проверки.' }],
      ['linksplatform/Hashing', { en: 'Hash functions for C and C++.', ru: 'Хэш-функции для C и C++.' }],
      ['linksplatform/Equality', { en: 'Equality of values in C++.', ru: 'Равенство значений в C++.' }],
      ['linksplatform/Comparers', { en: 'Comparers of values.', ru: 'Компараторы значений.' }],
      ['linksplatform/Converters', { en: 'Converters between types.', ru: 'Преобразователи между типами.' }],
      [
        'linksplatform/Incrementers',
        { en: 'Increment and decrement as objects.', ru: 'Увеличение и уменьшение как объекты.' },
      ],
      [
        'linksplatform/Setters',
        { en: 'Setters that remember a result.', ru: 'Сеттеры, которые запоминают результат.' },
      ],
      [
        'linksplatform/Exceptions',
        { en: 'Exceptions, ensures and requirements.', ru: 'Исключения, гарантии и требования.' },
      ],
      ['linksplatform/Disposables', { en: 'Safe disposal of resources.', ru: 'Безопасное освобождение ресурсов.' }],
      ['linksplatform/Scopes', { en: 'Dependency scopes.', ru: 'Области видимости зависимостей.' }],
      ['linksplatform/Singletons', { en: 'Singletons and defaults.', ru: 'Одиночки и значения по умолчанию.' }],
      ['linksplatform/Random', { en: 'Random values helpers.', ru: 'Помощники для случайных значений.' }],
      ['linksplatform/Reflection', { en: 'Reflection and code emitting.', ru: 'Рефлексия и генерация кода.' }],
      [
        'linksplatform/Reflection.Sigil',
        { en: 'Code emitting with Sigil (archived).', ru: 'Генерация кода с Sigil (в архиве).' },
      ],
      ['linksplatform/Threading', { en: 'Threads and synchronization.', ru: 'Потоки и синхронизация.' }],
      ['linksplatform/Timestamps', { en: 'Timestamps.', ru: 'Временные метки.' }],
      ['linksplatform/Unsafe', { en: 'Low-level memory access.', ru: 'Низкоуровневый доступ к памяти.' }],
      ['linksplatform/IO', { en: 'Console and file input and output.', ru: 'Ввод и вывод в консоли и файлах.' }],
      ['linksplatform/Protocols', { en: 'Communication protocols.', ru: 'Протоколы обмена данными.' }],
      ['linksplatform/Diagnostics', { en: 'Diagnostics and tracing.', ru: 'Диагностика и трассировка.' }],
      [
        'linksplatform/Helpers',
        { en: 'The first helpers library (archived).', ru: 'Первая библиотека помощников (в архиве).' },
      ],
    ],
  },
  {
    id: 'translators',
    title: { en: 'Code translators', ru: 'Трансляторы кода' },
    glyph: '12 22',
    summary: {
      en: 'The libraries are written once in C# and translated to C++, Python and other languages by rules.',
      ru: 'Библиотеки пишутся один раз на C# и переводятся по правилам на C++, Python и другие языки.',
    },
    repos: [
      [
        'linksplatform/RegularExpressions.Transformer',
        {
          en: 'Text transformation by a sequence of regular expressions.',
          ru: 'Преобразование текста последовательностью регулярных выражений.',
        },
      ],
      [
        'linksplatform/RegularExpressions.Transformer.CSharpToCpp',
        { en: 'C# to C++ translation rules.', ru: 'Правила перевода с C# на C++.' },
      ],
      [
        'linksplatform/RegularExpressions.Transformer.CSharpToPython',
        { en: 'C# to Python translation rules.', ru: 'Правила перевода с C# на Python.' },
      ],
      [
        'linksplatform/RegularExpressions.Transformer.CppToJava',
        { en: 'C++ to Java translation rules.', ru: 'Правила перевода с C++ на Java.' },
      ],
      [
        'linksplatform/RegularExpressions.Transformer.PythonToNim',
        { en: 'Python to Nim translation rules.', ru: 'Правила перевода с Python на Nim.' },
      ],
      [
        'linksplatform/RegularExpressions.Transformer.HasuraSQLSimplifier',
        {
          en: 'Simplifies the SQL generated by Hasura, with a command line tool.',
          ru: 'Упрощает SQL, сгенерированный Hasura, с инструментом командной строки.',
        },
      ],
      [
        'linksplatform/CSharpToCppTranslator',
        {
          en: 'The translator of the platform libraries from C# to C++.',
          ru: 'Транслятор библиотек платформы с C# на C++.',
        },
      ],
      [
        'linksplatform/CSharpToCppTranslatorTestSolution',
        { en: 'The test solution of the translator.', ru: 'Тестовое решение для транслятора.' },
      ],
    ],
  },
  {
    id: 'tools',
    title: { en: 'Query, formats & viewers', ru: 'Запросы, форматы и просмотр' },
    glyph: '11 12 33',
    summary: {
      en: 'Ways to read and change links: a CLI, SQL and GraphQL, JSON and XML, queues, logs and viewers.',
      ru: 'Способы читать и менять связи: CLI, SQL и GraphQL, JSON и XML, очереди, логи и средства просмотра.',
    },
    repos: [
      [
        'link-foundation/link-cli',
        { en: 'A CLI tool to manipulate links.', ru: 'Инструмент командной строки для работы со связями.' },
      ],
      [
        'link-foundation/links-client',
        {
          en: 'The JavaScript and Python client of link-cli.',
          ru: 'Клиент link-cli на JavaScript и Python.',
        },
      ],
      ['link-foundation/linksql', { en: 'A query language for links.', ru: 'Язык запросов для связей.' }],
      ['linksplatform/Data.Doublets.Sql', { en: 'An SQL interface to doublets.', ru: 'SQL-интерфейс к дуплетам.' }],
      [
        'linksplatform/Data.Doublets.Gql',
        { en: 'GraphQL access to a doublets store.', ru: 'Доступ к хранилищу дуплетов через GraphQL.' },
      ],
      [
        'linksplatform/Data.Doublets.Gql.Client',
        { en: 'GraphQL clients in C# and C++.', ru: 'Клиенты GraphQL на C# и C++.' },
      ],
      [
        'linksplatform/Data.Doublets.Json',
        { en: 'Import and export of JSON as doublets.', ru: 'Импорт и экспорт JSON в дуплеты.' },
      ],
      [
        'linksplatform/Data.Doublets.Xml',
        { en: 'Import and export of XML as doublets.', ru: 'Импорт и экспорт XML в дуплеты.' },
      ],
      ['link-foundation/links-queue', { en: 'A message queue made of links.', ru: 'Очередь сообщений из связей.' }],
      [
        'link-foundation/links-logs-vault',
        {
          en: 'Stores and searches logs as links with lossless deduplication.',
          ru: 'Хранит логи как связи и ищет по ним, с дедупликацией без потерь.',
        },
      ],
      [
        'link-foundation/dedup-log',
        {
          en: 'Logging in deduplicated Links Notation to shrink logs.',
          ru: 'Логирование в дедуплицированной Links Notation, чтобы уменьшить логи.',
        },
      ],
      [
        'linksplatform/doublets-web',
        {
          en: 'Doublets in the browser: WebAssembly bindings with a playground.',
          ru: 'Дуплеты в браузере: привязки WebAssembly с песочницей.',
        },
      ],
      [
        'linksplatform/RawDoubletsViewer',
        { en: 'A Windows viewer of raw doublets files.', ru: 'Просмотрщик сырых файлов дуплетов для Windows.' },
      ],
      [
        'linksplatform/InfiniteDepthTreeWebUIPrototype',
        {
          en: 'A web UI prototype to view and edit networks of any depth as trees.',
          ru: 'Прототип веб-интерфейса для просмотра и правки сетей любой глубины как деревьев.',
        },
      ],
      [
        'linksplatform/react-deep-tree',
        {
          en: 'A React component for trees of any depth.',
          ru: 'Компонент React для деревьев любой глубины.',
        },
      ],
      [
        'linksplatform/Examples.Doublets.CRUD',
        {
          en: 'A quick start: create, read, update and delete the first link.',
          ru: 'Быстрый старт: создать, прочитать, изменить и удалить первую связь.',
        },
      ],
      [
        'link-foundation/ideav-local-associative-js',
        {
          en: 'An example project migrated to associative storage and Links Notation.',
          ru: 'Пример проекта, перенесённого на ассоциативное хранилище и Links Notation.',
        },
      ],
    ],
  },
  {
    id: 'benchmarks',
    title: { en: 'Benchmarks', ru: 'Бенчмарки' },
    glyph: '12 21',
    summary: {
      en: 'Doublets compared with relational, graph, column and key-value databases on the same operations.',
      ru: 'Дуплеты в сравнении с реляционными, графовыми, колоночными и key-value базами данных на одних и тех же операциях.',
    },
    repos: [
      ['linksplatform/Comparisons.SQLiteVSDoublets', { en: 'Doublets against SQLite.', ru: 'Дуплеты против SQLite.' }],
      [
        'linksplatform/Comparisons.PostgreSQLVSDoublets',
        { en: 'Doublets against PostgreSQL.', ru: 'Дуплеты против PostgreSQL.' },
      ],
      ['linksplatform/Comparisons.Neo4jVSDoublets', { en: 'Doublets against Neo4j.', ru: 'Дуплеты против Neo4j.' }],
      ['linksplatform/Comparisons.RedisVSDoublets', { en: 'Doublets against Redis.', ru: 'Дуплеты против Redis.' }],
      [
        'linksplatform/Comparisons.SpacetimeDBVSDoublets',
        { en: 'Doublets against SpacetimeDB.', ru: 'Дуплеты против SpacetimeDB.' },
      ],
      [
        'linksplatform/DoubletsVsClickHouseBenchmarks',
        { en: 'Doublets against ClickHouse.', ru: 'Дуплеты против ClickHouse.' },
      ],
      [
        'linksplatform/Comparisons.DeepGqlStandard',
        {
          en: 'Deep (PostgreSQL and Hasura) against doublets in Rust and C#.',
          ru: 'Deep (PostgreSQL и Hasura) против дуплетов на Rust и C#.',
        },
      ],
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
      [
        'link-foundation/js-docker-isolation-provider',
        {
          en: 'Runs the JavaScript handlers of Deep in Docker.',
          ru: 'Запускает обработчики Deep на JavaScript в Docker.',
        },
      ],
      [
        'link-foundation/yachts',
        {
          en: 'A Next.js and Capacitor application on the Deep SDK.',
          ru: 'Приложение на Next.js и Capacitor на Deep SDK.',
        },
      ],
      [
        'link-foundation/cw-deep',
        { en: 'CosmWasm contracts of the DEEP protocol.', ru: 'Контракты CosmWasm протокола DEEP.' },
      ],
      [
        'link-foundation/deep-chain',
        {
          en: 'DEEPCHAIN from the Deep Cyber hackathon: a semantic consensus computer.',
          ru: 'DEEPCHAIN с хакатона Deep Cyber: семантический компьютер консенсуса.',
        },
      ],
      ['link-foundation/cyb-ts', { en: 'The cyb.ai robot for the Great Web.', ru: 'Робот cyb.ai для Великой сети.' }],
    ],
  },
  {
    id: 'devtools',
    title: { en: 'Developer tools', ru: 'Инструменты разработчика' },
    glyph: '11 22 33',
    summary: {
      en: 'Containers, commands, tests, logs, documentation and continuous integration the other layers are built with.',
      ru: 'Контейнеры, команды, тесты, логи, документация и непрерывная интеграция, с помощью которых собраны остальные слои.',
    },
    repos: [
      [
        'link-foundation/box',
        {
          en: 'A Docker image with the most popular language runtimes and tools.',
          ru: 'Docker-образ с самыми популярными средами выполнения языков и инструментами.',
        },
      ],
      [
        'link-foundation/command-stream',
        { en: 'A streamable commands executor.', ru: 'Потоковый исполнитель команд.' },
      ],
      [
        'link-foundation/use-m',
        {
          en: 'Dynamically download and import any JavaScript module.',
          ru: 'Динамическая загрузка и импорт любого модуля JavaScript.',
        },
      ],
      [
        'link-foundation/start',
        {
          en: 'Runs any command and reports its failures as GitHub issues.',
          ru: 'Запускает любую команду и сообщает о её сбоях в виде задач на GitHub.',
        },
      ],
      [
        'link-foundation/test-anywhere',
        {
          en: 'One testing framework on the built-in runners of Bun, Deno and Node.',
          ru: 'Один фреймворк тестирования на встроенных средствах Bun, Deno и Node.',
        },
      ],
      ['link-foundation/log-lazy', { en: 'Efficient lazy logging.', ru: 'Эффективное ленивое логирование.' }],
      [
        'link-foundation/set-process-name',
        { en: 'Sets the process name on every platform.', ru: 'Задаёт имя процесса на любой платформе.' },
      ],
      [
        'link-foundation/si-units',
        {
          en: 'The International System of Units in JavaScript.',
          ru: 'Международная система единиц на JavaScript.',
        },
      ],
      [
        'link-foundation/disk-space-saviour',
        { en: 'Safely frees disk space.', ru: 'Безопасно освобождает место на диске.' },
      ],
      [
        'link-foundation/browser-commander',
        {
          en: 'Controls local browsers for end-to-end tests.',
          ru: 'Управляет локальными браузерами для сквозных тестов.',
        },
      ],
      ['link-foundation/rust-web-box', { en: 'A Rust sandbox in the browser.', ru: 'Песочница Rust в браузере.' }],
      [
        'link-foundation/monaco-editor-auto-typings',
        {
          en: 'Loads type declarations while typing in the Monaco editor.',
          ru: 'Загружает объявления типов во время набора в редакторе Monaco.',
        },
      ],
      [
        'link-foundation/package-registry-manager',
        {
          en: 'Manages the package registries of many languages.',
          ru: 'Управляет реестрами пакетов многих языков.',
        },
      ],
      [
        'link-foundation/sync-auth',
        {
          en: 'Syncs the authentication of command line tools.',
          ru: 'Синхронизирует аутентификацию инструментов командной строки.',
        },
      ],
      [
        'link-foundation/code-changes-collector',
        {
          en: 'Collects the most frequent code changes from the git history.',
          ru: 'Собирает самые частые изменения кода из истории git.',
        },
      ],
      [
        'link-foundation/code-architecture-principles',
        { en: 'Architecture principles of code design.', ru: 'Архитектурные принципы проектирования кода.' },
      ],
      ['link-foundation/pdf-to-markdown', { en: 'Converts PDF to Markdown.', ru: 'Преобразует PDF в Markdown.' }],
      [
        'link-foundation/sensitive-data-sanitizer',
        { en: 'Removes sensitive data from texts.', ru: 'Удаляет конфиденциальные данные из текстов.' },
      ],
      [
        'link-foundation/wiki-referencify',
        {
          en: 'Links the terms of a Markdown document to Wikipedia.',
          ru: 'Связывает термины Markdown-документа со статьями Википедии.',
        },
      ],
      [
        'linksplatform/Documentation',
        {
          en: 'Documentation and support of all LinksPlatform projects.',
          ru: 'Документация и поддержка всех проектов LinksPlatform.',
        },
      ],
      [
        'linksplatform/linksplatform.github.io',
        { en: 'The website of the LinksPlatform organization.', ru: 'Сайт организации LinksPlatform.' },
      ],
      [
        'linksplatform/.github',
        {
          en: 'The organization profile: LinksPlatform [L ↦ L²].',
          ru: 'Профиль организации: LinksPlatform [L ↦ L²].',
        },
      ],
      [
        'linksplatform/Scripts',
        {
          en: 'Scripts for continuous integration, deployment and code changes.',
          ru: 'Скрипты непрерывной интеграции, развёртывания и изменений кода.',
        },
      ],
      [
        'linksplatform/Workflows',
        { en: 'Shared GitHub Actions workflows.', ru: 'Общие рабочие процессы GitHub Actions.' },
      ],
      ['linksplatform/Files', { en: 'Files the automation needs.', ru: 'Файлы, нужные для автоматизации.' }],
      ['linksplatform/Settings', { en: 'Shared solution settings.', ru: 'Общие настройки решений.' }],
    ],
  },
  {
    id: 'github',
    title: { en: 'GitHub & GitLab automation', ru: 'Автоматизация GitHub и GitLab' },
    glyph: '12 13 11',
    summary: {
      en: 'Command line tools that load issues, pull requests, gists and logs for people and AI.',
      ru: 'Инструменты командной строки, которые загружают задачи, пул-реквесты, гисты и логи для людей и ИИ.',
    },
    repos: [
      [
        'link-foundation/gh-load-issue',
        { en: 'Downloads a GitHub issue for AI to solve.', ru: 'Загружает задачу GitHub, чтобы ИИ её решил.' },
      ],
      [
        'link-foundation/gh-load-pull-request',
        {
          en: 'Downloads a pull request for AI to improve or review.',
          ru: 'Загружает пул-реквест, чтобы ИИ его улучшил или проверил.',
        },
      ],
      [
        'link-foundation/gh-pull-all',
        { en: 'Pulls all repositories from GitHub.', ru: 'Загружает все репозитории с GitHub.' },
      ],
      [
        'link-foundation/glab-pull-all',
        { en: 'Pulls all repositories from GitLab.', ru: 'Загружает все репозитории с GitLab.' },
      ],
      ['link-foundation/gh-manager', { en: 'Manages GitHub.', ru: 'Управляет GitHub.' }],
      [
        'link-foundation/gh-tree',
        { en: 'Shows the tree of files of a repository.', ru: 'Показывает дерево файлов репозитория.' },
      ],
      [
        'link-foundation/gh-uncommitted',
        {
          en: 'Copies, moves, archives or stashes all uncommitted changes.',
          ru: 'Копирует, переносит, архивирует или откладывает все незафиксированные изменения.',
        },
      ],
      [
        'link-foundation/gh-setup-git-identity',
        { en: 'Sets the git identity from the gh user.', ru: 'Настраивает git по пользователю gh.' },
      ],
      [
        'link-foundation/glab-setup-git-identity',
        { en: 'Sets the git identity from the glab user.', ru: 'Настраивает git по пользователю glab.' },
      ],
      ['link-foundation/gh-download-gist', { en: 'Downloads a gist.', ru: 'Загружает гист.' }],
      [
        'link-foundation/gh-upload-image',
        {
          en: 'Uploads an image to GitHub, for public and private repositories.',
          ru: 'Загружает изображение на GitHub для публичных и приватных репозиториев.',
        },
      ],
      ['link-foundation/gh-upload-log', { en: 'Uploads a log to GitHub.', ru: 'Загружает лог на GitHub.' }],
    ],
  },
  {
    id: 'pipelines',
    title: { en: 'AI-driven development', ru: 'Разработка с помощью ИИ' },
    glyph: '12 23 33',
    summary: {
      en: 'Repository templates where AI writes the code and the pipeline checks it, in eight languages.',
      ru: 'Шаблоны репозиториев, в которых код пишет ИИ, а конвейер его проверяет, на восьми языках.',
    },
    repos: [
      [
        'link-foundation/js-ai-driven-development-pipeline-template',
        { en: 'For JavaScript and TypeScript.', ru: 'Для JavaScript и TypeScript.' },
      ],
      ['link-foundation/rust-ai-driven-development-pipeline-template', { en: 'For Rust.', ru: 'Для Rust.' }],
      ['link-foundation/python-ai-driven-development-pipeline-template', { en: 'For Python.', ru: 'Для Python.' }],
      ['link-foundation/csharp-ai-driven-development-pipeline-template', { en: 'For C#.', ru: 'Для C#.' }],
      ['link-foundation/cpp-ai-driven-development-pipeline-template', { en: 'For C and C++.', ru: 'Для C и C++.' }],
      ['link-foundation/go-ai-driven-development-pipeline-template', { en: 'For Go.', ru: 'Для Go.' }],
      ['link-foundation/java-ai-driven-development-pipeline-template', { en: 'For Java.', ru: 'Для Java.' }],
      [
        'link-foundation/php-ai-driven-development-pipeline-template',
        { en: 'For Symfony PHP.', ru: 'Для Symfony PHP.' },
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
        'link-assistant/agent-commander',
        {
          en: 'Controls agents run as command line tools, such as Claude Code.',
          ru: 'Управляет агентами, запущенными как инструменты командной строки, например Claude Code.',
        },
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
      [
        'link-assistant/claude-profiles',
        { en: 'Manages several Claude Code profiles.', ru: 'Управляет несколькими профилями Claude Code.' },
      ],
      [
        'link-assistant/conversation',
        { en: 'Migrates and manages AI conversations.', ru: 'Переносит и упорядочивает разговоры с ИИ.' },
      ],
      [
        'link-assistant/operator',
        { en: 'The UI for efficient AI operations.', ru: 'Интерфейс для эффективной работы с ИИ.' },
      ],
      [
        'link-assistant/react-chat-ui',
        {
          en: 'Research of the best chat UI to talk with agents.',
          ru: 'Исследование лучшего интерфейса чата для общения с агентами.',
        },
      ],
      ['link-assistant/router', { en: 'An AI API router.', ru: 'Маршрутизатор API для ИИ.' }],
      [
        'link-assistant/api-tester',
        {
          en: 'Examples of the OpenAI-compatible API gateway in several languages.',
          ru: 'Примеры работы с OpenAI-совместимым шлюзом API на нескольких языках.',
        },
      ],
      ['link-assistant/models', { en: 'The page of AI models.', ru: 'Страница моделей ИИ.' }],
      [
        'link-assistant/model-in-browser',
        { en: 'An experiment to run a model in the browser.', ru: 'Эксперимент по запуску модели в браузере.' },
      ],
      [
        'link-assistant/speech-to-text',
        { en: 'A speech to text microservice.', ru: 'Микросервис распознавания речи.' },
      ],
      ['link-assistant/web-search', { en: 'A web search microservice.', ru: 'Микросервис веб-поиска.' }],
      [
        'link-assistant/web-capture',
        {
          en: 'Captures web pages in the required format.',
          ru: 'Сохраняет веб-страницы в нужном формате.',
        },
      ],
      [
        'link-assistant/image-to-number',
        {
          en: 'Reads numbers from images with Claude Code.',
          ru: 'Считывает числа с изображений с помощью Claude Code.',
        },
      ],
      [
        'link-foundation/watermarks-remover',
        { en: 'Removes AI watermarks in CI/CD.', ru: 'Удаляет водяные знаки ИИ в CI/CD.' },
      ],
      [
        'link-assistant/control-center',
        { en: 'Scripts to control the infrastructure.', ru: 'Скрипты управления инфраструктурой.' },
      ],
      [
        'link-foundation/deep-gpt',
        { en: 'A GPT bot for Telegram with payments.', ru: 'GPT-бот для Telegram с оплатой.' },
      ],
    ],
  },
  {
    id: 'apps',
    title: { en: 'Applications & community', ru: 'Приложения и сообщество' },
    glyph: '12 21 34 43',
    summary: {
      en: 'Bots, assistants and plans of the community that grows around links.',
      ru: 'Боты, ассистенты и планы сообщества, которое растёт вокруг связей.',
    },
    repos: [
      [
        'link-assistant/master-plan',
        {
          en: 'The issues and discussions of the whole community.',
          ru: 'Задачи и обсуждения всего сообщества.',
        },
      ],
      [
        'link-foundation/meta-sovereign',
        {
          en: 'A local-first inbox, CRM and automation that the user owns.',
          ru: 'Локальные входящие, CRM и автоматизация, которыми владеет сам пользователь.',
        },
      ],
      [
        'link-foundation/people-and-projects',
        {
          en: 'People and projects that are associative in nature.',
          ru: 'Люди и проекты, ассоциативные по своей природе.',
        },
      ],
      [
        'linksplatform/Bot',
        {
          en: 'VK, GitHub, Discord and trading bots of the community.',
          ru: 'Боты сообщества для VK, GitHub, Discord и торговли.',
        },
      ],
      [
        'link-foundation/bridge',
        {
          en: 'A bridge between group chats in VK, Telegram and Discord.',
          ru: 'Мост между групповыми чатами в VK, Telegram и Discord.',
        },
      ],
      [
        'link-foundation/anygram',
        { en: 'A library of best practices for Telegram bots.', ru: 'Библиотека лучших практик для Telegram-ботов.' },
      ],
      [
        'link-assistant/fact-checker-bot',
        {
          en: 'A group bot that checks facts and corrects mistakes.',
          ru: 'Бот для групп, который проверяет факты и исправляет ошибки.',
        },
      ],
      ['link-assistant/legal', { en: 'A legal assistant.', ru: 'Юридический ассистент.' }],
      [
        'link-assistant/market-research',
        { en: 'A look at what is out there in the market.', ru: 'Обзор того, что есть на рынке.' },
      ],
      [
        'link-assistant/money-making-machines',
        { en: 'Machines to make money.', ru: 'Машины для зарабатывания денег.' },
      ],
      [
        'link-assistant/trader-bot',
        {
          en: 'A trading bot with a portfolio balancing strategy.',
          ru: 'Торговый бот со стратегией балансировки портфеля.',
        },
      ],
      [
        'link-assistant/scalper-trader-bot',
        {
          en: 'A trading bot with a scalping strategy (archived).',
          ru: 'Торговый бот со скальпинговой стратегией (в архиве).',
        },
      ],
      [
        'linksplatform/resourse-cooperation',
        {
          en: 'A page about resource cooperation for startups and investors.',
          ru: 'Страница о кооперации ресурсов для стартапов и инвесторов.',
        },
      ],
    ],
  },
];

/** Whether a repository belongs to an organization the stack covers in full. */
export const inStackOrganization = (fullName) => ORGANIZATIONS.includes(fullName.split('/')[0]);

export const STACK_ORGANIZATIONS = ORGANIZATIONS;
