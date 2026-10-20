// Fields of study or business and how konard's repositories are useful in them.
// Repositories are assigned to fields by scripts/repositories.cjs (keyword and
// language rules), so every id here must exist in its FIELDS list.
export const fields = [
  {
    id: 'associative',
    name: 'Associative technologies',
    summary:
      'Links/doublets storage engines, Links Notation, the Deep platform and links theory: a single data model for any meaning, useful for knowledge graphs, semantic search and data integration.',
  },
  {
    id: 'data',
    name: 'Data & databases',
    summary:
      'Storage engines, benchmarks against PostgreSQL, SQLite, Neo4j and Redis, GraphQL over Hasura, import/export and serialization: reusable for data engineering and database research.',
  },
  {
    id: 'ai',
    name: 'AI agents & LLM apps',
    summary:
      'Autonomous coding agents, chat bots on top of GPT/Claude, AI review and research assistants: ready-made building blocks for products that use large language models.',
  },
  {
    id: 'ml',
    name: 'Machine learning & data science',
    summary:
      'Vector search, inference of laws from data, Markov chains, medical and retail ML research plans, offline AI tools: starting points for experiments with models and datasets.',
  },
  {
    id: 'mlops',
    name: 'MLOps & AI infrastructure',
    summary:
      'Model routers and API gateways, AI-driven CI/CD pipeline templates, sandboxes and orchestration of many AI agents: how to run AI reliably in production and in CI.',
  },
  {
    id: 'devops',
    name: 'DevOps & automation',
    summary:
      'Docker images with every language runtime, GitHub Actions workflows, release automation, git and GitHub CLI tools, server scripts: automation of automation for any team.',
  },
  {
    id: 'web',
    name: 'Web & mobile',
    summary:
      'React, Next.js and Capacitor apps, GitHub Pages mini apps for Telegram and VK, browser extensions and editors: examples of shipping UI to the web and to phones.',
  },
  {
    id: 'backend',
    name: 'Backend & APIs',
    summary:
      'REST and GraphQL services, WebSocket servers, payment integrations and microservices for web capture, search and speech: backend patterns in many languages.',
  },
  {
    id: 'bots',
    name: 'Bots & social networks',
    summary:
      'Telegram, VK and Discord bots, cross-platform chat bridges and social automation: useful for communities, support desks and marketing.',
  },
  {
    id: 'languages',
    name: 'Languages, parsers & translators',
    summary:
      'Code translators (C# → C++, Python → JavaScript, JavaScript → Rust), PEG and ANTLR examples, grammar inference and meta languages: compiler and DSL engineering.',
  },
  {
    id: 'systems',
    name: 'Systems & performance',
    summary:
      'Memory-mapped storage, size-balanced trees, unsafe and low-level .NET/C++/Rust libraries, GPU sorting and bare-metal ports: high-performance and systems programming.',
  },
  {
    id: 'research',
    name: 'Math, logic & science research',
    summary:
      'Formal proofs in Rocq/Lean, P vs NP, travelling salesman and subset sum experiments, physics theories, meta-theory of links and the universal problem solving algorithm.',
  },
  {
    id: 'legal',
    name: 'Law & legal tech',
    summary:
      'Machine-readable collections of Russian and Indian laws, court verdicts, legal assistants and tax document generation: a base for legal search and compliance tools.',
  },
  {
    id: 'finance',
    name: 'Finance, trading & commerce',
    summary:
      'Trading bots, net worth and key-rate monitors, payment gateways, marketplace bidders and price-law inference: tools for personal finance and e-commerce.',
  },
  {
    id: 'education',
    name: 'Education & documentation',
    summary:
      'Worked examples for .NET, C++/CLI, T4 and parsers, a Moodle plugin, tutoring sites, documentation and Q&A collections: learning material for students and teams.',
  },
  {
    id: 'art',
    name: 'Art, games & simulation',
    summary:
      'Matrix digital rain, link visuals, anime avatar, gravity and wave simulations, Gaussian splatting, audio decomposition and game universes: creative coding.',
  },
  {
    id: 'productivity',
    name: 'Productivity & developer tools',
    summary:
      'CLI tools for GitHub issues, gists and pull requests, task tracker integrations (Kaiten, Trello, YouGile), PDF to Markdown, uploaders and search tools.',
  },
  {
    id: 'other',
    name: 'Other experiments',
    summary: 'Small experiments, placeholders and personal repositories that do not fit a specific field yet.',
  },
];

// Best example repositories for different IT professions, picked by hand.
// Each entry is [full repository name, why it is a good example for the profession].
export const professions = [
  {
    id: 'mlops',
    name: 'MLOps & AI platform engineer',
    summary: 'Running, routing and orchestrating AI models and agents in CI and production.',
    repos: [
      ['link-assistant/hive-mind', 'Orchestrates many AI coding agents that solve GitHub issues end to end.'],
      ['link-assistant/agent', 'Thin headless agent runtime based on OpenCode CLI.'],
      ['link-assistant/router', 'API router that switches between AI providers.'],
      ['deep-assistant/api-gateway', 'OpenAI-compatible gateway behind the Deep.GPT bot.'],
      ['link-foundation/box', 'Docker image with the most popular language runtimes for AI sandboxes.'],
      ['link-foundation/js-ai-driven-development-pipeline-template', 'CI/CD template for AI-driven development.'],
      ['link-foundation/rust-ai-driven-development-pipeline-template', 'Same pipeline template for Rust.'],
      ['link-assistant/model-in-browser', 'Runs a language model fully in the browser.'],
      ['Svetozar-Technologies/LocalCode', 'Privacy-first AI code editor on local LLMs via llama.cpp.'],
      ['link-assistant/claude-profiles', 'Manages multiple Claude Code profiles.'],
    ],
  },
  {
    id: 'devops',
    name: 'DevOps & SRE',
    summary: 'Automation of builds, releases, servers and developer machines.',
    repos: [
      ['link-foundation/command-stream', 'Streamable shell command executor for JavaScript.'],
      ['link-foundation/start', 'Runs any command and auto-reports failures as issues.'],
      ['link-foundation/gh-pull-all', 'Clones and pulls every repository of a user or organization.'],
      ['deep-foundation/workflows', 'Reusable GitHub Actions workflows for npm packages.'],
      ['deep-foundation/rust-docker-isolation-provider', 'Runs user code in isolated Docker containers.'],
      ['linksplatform/Scripts', 'CI/CD automation scripts for dozens of .NET and C++ libraries.'],
      ['link-foundation/package-registry-manager', 'Manages packages across language registries.'],
      ['link-foundation/links-logs-vault', 'Microservice to accumulate and search logs.'],
      ['link-foundation/disk-space-saviour', 'Safely frees disk space.'],
      ['konard/macos-ram-volume', 'Creates RAM volumes on macOS for fast builds.'],
    ],
  },
  {
    id: 'ml-ai',
    name: 'ML / AI engineer',
    summary: 'Products and research built on machine learning and large language models.',
    repos: [
      ['deep-assistant/telegram-bot', 'Deep.GPT bot: answers, image and music generation, payments.'],
      ['deep-assistant/GPTutor', 'GPT tutor as a VK mini app.'],
      ['link-assistant/formal-ai', 'Formal AI: know just enough to get to know anything.'],
      ['link-assistant/fact-checker-bot', 'Fact checks statements in Telegram and VK groups.'],
      ['konard/universal-vector-search', 'Vector search experiments.'],
      ['konard/medical-neural-network-ml', 'Research plan for a medical neural network.'],
      ['konard/marketplace-retail-ai-control', 'AI-assisted business management for a marketplace seller.'],
      ['Svetozar-Technologies/LocalMedScan', 'Offline AI medical image screening assistant.'],
      ['Svetozar-Technologies/LocalMind', 'Offline AI transcription and quality auditing.'],
      ['konard/high-performance-gaussian-splatting', 'High performance Gaussian splatting with dynamic scenes.'],
    ],
  },
  {
    id: 'data',
    name: 'Data engineer & DBA',
    summary: 'Storage engines, query languages and honest benchmarks.',
    repos: [
      ['linksplatform/Data.Doublets', 'Doublets associative storage engine in C#.'],
      ['linksplatform/doublets-rs', 'Doublets storage engine in Rust.'],
      ['link-foundation/link-cli', 'CLI to create, query and update links.'],
      ['link-foundation/links-notation', 'Links Notation: data as references and links.'],
      ['linksplatform/Comparisons.PostgreSQLVSDoublets', 'Benchmark: PostgreSQL vs Doublets.'],
      ['linksplatform/Comparisons.SQLiteVSDoublets', 'Benchmark: SQLite vs Doublets.'],
      ['linksplatform/Comparisons.Neo4jVSDoublets', 'Benchmark: Neo4j vs Doublets.'],
      ['linksplatform/Data.Doublets.Gql', 'GraphQL server over doublets.'],
      ['deep-foundation/hasura', 'Hasura GraphQL engine integration for Deep.'],
      ['link-foundation/linksql', 'A query language for links.'],
    ],
  },
  {
    id: 'backend',
    name: 'Backend developer',
    summary: 'Services, APIs and integrations.',
    repos: [
      ['deep-foundation/deeplinks', 'Core of Deep: links storage with GraphQL API and handlers.'],
      ['deep-foundation/sdk', 'SDK and application shell for Deep.'],
      ['konard/ASP.NET-Core-WebSocket-Example', 'ASP.NET Core WebSocket echo server and JS client.'],
      ['link-foundation/lino-rest-api', 'REST framework that uses Links Notation instead of JSON.'],
      ['link-assistant/web-capture', 'Library, CLI and microservice to capture web pages.'],
      ['link-assistant/web-search', 'Web search microservice.'],
      ['link-foundation/links-queue', 'Message queue built on links.'],
      ['deep-foundation/payments-tinkoff-c2b', 'Tinkoff payments integration.'],
      ['linksplatform/IdDistributorServer', 'TCP/IP identifier distribution server.'],
    ],
  },
  {
    id: 'frontend',
    name: 'Frontend & mobile developer',
    summary: 'Web, mobile and browser UI.',
    repos: [
      ['deep-foundation/deepcase-app', 'Visual IDE for links of Deep.'],
      ['deep-foundation/store', 'useState-style React data layers synced to storage.'],
      ['deep-foundation/capacitor-camera', 'Capacitor camera integration for mobile apps.'],
      ['linksplatform/react-deep-tree', 'React component for infinitely deep trees.'],
      ['open-online-tools/js-playground', 'JavaScript playground that runs fully in the browser.'],
      ['open-online-tools/file-converter', 'GitHub Pages site to convert files.'],
      ['link-foundation/monaco-editor-auto-typings', 'Auto-loads typings in the Monaco editor.'],
      ['konard/github-pages-telegram-mini-app', 'Telegram Mini App hosted on GitHub Pages.'],
      ['styleschool/uniforms-masked-phone-field', 'Masked phone input for uniforms-material.'],
    ],
  },
  {
    id: 'systems',
    name: 'Systems & performance engineer',
    summary: 'Memory, data structures and low-level code.',
    repos: [
      ['linksplatform/Memory', 'Memory-mapped and heap memory abstractions for .NET.'],
      ['linksplatform/mem-rs', 'Memory abstractions in Rust.'],
      ['linksplatform/trees-rs', 'Size-balanced trees in Rust.'],
      ['konard/sbt', 'Size-Balanced Trees library in C.'],
      ['linksplatform/Collections', 'High-performance collections for .NET.'],
      ['linksplatform/Unsafe', 'Unsafe helpers for zero-copy .NET code.'],
      ['linksplatform/Data.Triplets.Kernel', 'Native triplets kernel in C.'],
      ['konard/gpu-sorting', 'The simplest possible GPU sorting in Rust.'],
      ['linksplatform/BareNET', 'Port of .NET Core to the BareMetal OS.'],
    ],
  },
  {
    id: 'languages',
    name: 'Compiler & language engineer',
    summary: 'Parsers, translators and notations.',
    repos: [
      ['linksplatform/RegularExpressions.Transformer.CSharpToCpp', 'Translates C# libraries to C++ with regex rules.'],
      ['linksplatform/RegularExpressions.Transformer', 'Rule-based text transformation engine.'],
      ['link-foundation/grammar-expressions', 'Hybrid of regular expressions and PEGs over Links Notation tokens.'],
      ['link-foundation/grammar-inference', 'Infers a grammar from examples.'],
      ['link-foundation/transformer', 'Rule-based Turing complete transformer on Links Notation.'],
      ['link-foundation/meta-language', 'A language about languages.'],
      ['konard/metalanguage', 'The meta programming language.'],
      ['konard/PegasusExample', 'Pegasus PEG parser generator on .NET Core.'],
      ['konard/AntlrExample', 'ANTLR parsing of C# code.'],
    ],
  },
  {
    id: 'qa',
    name: 'QA & test automation',
    summary: 'Testing frameworks, e2e and security checks.',
    repos: [
      ['link-foundation/test-anywhere', 'One test API for Node.js, Bun and Deno built-in runners.'],
      ['link-foundation/browser-commander', 'Simplified control of local browsers for e2e tests.'],
      ['konard/jest-template', 'Jest template for both CJS and ESM.'],
      ['link-assistant/api-tester', 'API testing tool.'],
      ['konard/knex-sql-injection-detector', 'Detects potential SQL injections in knex code.'],
      ['link-foundation/sensitive-data-sanitizer', 'Removes secrets from logs and data.'],
      ['konard/recurscan', 'Finds recursive functions in JavaScript files.'],
    ],
  },
  {
    id: 'bots',
    name: 'Bot developer',
    summary: 'Chat bots for Telegram, VK, Discord and GitHub.',
    repos: [
      ['linksplatform/Bot', 'VK, GitHub, Discord and trader bots.'],
      ['deep-assistant/telegram-bot', 'Deep.GPT Telegram bot.'],
      ['link-foundation/anygram', 'Telegram library with best practices for bots.'],
      ['link-foundation/bridge', 'Bridge between group chats on different platforms.'],
      ['link-assistant/support-bot', 'Collects user feedback and creates issues.'],
      ['konard/vk-bot', 'VK user bot on vk-io.'],
      ['konard/telegram-terminal-bot', 'Terminal access through a Telegram bot.'],
      ['deep-foundation/russian-laws-bot', 'Search in Russian laws via a bot.'],
    ],
  },
  {
    id: 'research',
    name: 'Researcher & scientist',
    summary: 'Mathematics, logic, physics and theory of links.',
    repos: [
      ['link-foundation/meta-theory', 'The links meta-theory.'],
      ['deep-foundation/deep-theory', 'Links theory formalized in Coq.'],
      ['konard/problem-solving', 'Universal problem solving algorithm.'],
      ['konard/p-vs-np', 'Experiment to prove or disprove P = NP in Rocq.'],
      ['konard/tsp', 'Travelling salesman problem solutions.'],
      ['konard/subset-sum', 'The simplest NP-hard problem.'],
      ['konard/physical-unified-theory', 'Grand unified theory of everything for physics.'],
      ['link-foundation/relative-meta-logic', 'Logic framework that reasons relatively.'],
      ['link-foundation/network-isomorphism-solver', 'Network isomorphism solver.'],
      ['link-assistant/semantic-primes', 'Formal universal ontology from semantic primes.'],
    ],
  },
  {
    id: 'lead',
    name: 'CEO, CTO & team lead',
    summary: 'Organizing people, plans, architecture and processes.',
    repos: [
      ['link-assistant/hive-mind', 'Automation of automation: AI agents as a development team.'],
      ['deep-foundation/dev', 'Monorepository that onboards a whole team in one command.'],
      ['link-foundation/code-architecture-principles', 'Architecture principles for code design.'],
      ['link-assistant/master-plan', 'Issues and community hub of Link.Assistant.'],
      ['deep-foundation/roadmap', 'Public roadmap of Deep.Foundation.'],
      ['linksplatform/Documentation', 'Documentation root for all LinksPlatform projects.'],
      ['konard/cv-consistency-check', 'Keeps all CVs/resumes of an employee in sync.'],
      ['konard/kaiten-api-tools', 'Kaiten API tools for project management.'],
      ['konard/yougile-to-gh', 'Converts YouGile tasks to GitHub issues.'],
    ],
  },
  {
    id: 'finance',
    name: 'FinTech & e-commerce',
    summary: 'Trading, payments and personal finance.',
    repos: [
      ['link-assistant/trader-bot', 'Portfolio balancing trading bot in Rust.'],
      ['link-assistant/scalper-trader-bot', 'Scalping strategy trading bot.'],
      ['konard/networth-calculator', 'Speed of net worth growth or decline.'],
      ['konard/cbr-key-rate-monitor', 'Monitors the Bank of Russia key rate.'],
      ['konard/price-power-law-inference', 'Infers a power law from historical prices.'],
      ['konard/payplay-api', 'PayPlay payments API via PHP.'],
      ['konard/3-ndfl', '3-NDFL tax document generation for dividends.'],
    ],
  },
];
