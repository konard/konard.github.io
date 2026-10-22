// Pages of the site. Each one is a separate Vite entry (see vite.config.js),
// so it is a real URL that works without JavaScript routing on GitHub Pages.
// Texts are `{ en, ru }` objects, translated with useLang().t.
export const PAGES = [
  {
    id: 'home',
    href: '/',
    label: { en: 'CV', ru: 'Резюме' },
    title: { en: 'Biography & CV', ru: 'Биография и резюме' },
    glyph: '11',
    summary: { en: 'The one-page CV.', ru: 'Резюме на одной странице.' },
  },
  {
    id: 'experience',
    href: '/experience/',
    label: { en: 'Experience', ru: 'Опыт' },
    title: { en: 'Experience by role', ru: 'Опыт по должностям' },
    glyph: '11 12 33',
    summary: {
      en: 'Only the experience relevant to a position: ML / AI, DevOps, lead, CTO, backend, full-stack, Rust, .NET and more.',
      ru: 'Только опыт, нужный для выбранной должности: ML / AI, DevOps, руководитель, CTO, бэкенд, фулстек, Rust, .NET и другие.',
    },
  },
  {
    id: 'repositories',
    href: '/repositories/',
    label: { en: 'Repositories', ru: 'Репозитории' },
    title: { en: 'All repositories', ru: 'Все репозитории' },
    glyph: '12 21',
    summary: {
      en: 'Every original repository, how it is useful in each field, and the best examples per IT profession.',
      ru: 'Все собственные репозитории, их польза в каждой области и лучшие примеры для каждой ИТ-профессии.',
    },
  },
  {
    id: 'research',
    href: '/research/',
    label: { en: 'Research', ru: 'Исследования' },
    title: { en: 'Research & theory', ru: 'Исследования и теория' },
    glyph: '11 22 12',
    summary: {
      en: 'The links meta-theory, the problem solving algorithm, P vs NP, TSP, physics and data science on laws.',
      ru: 'Метатеория связей, алгоритм решения задач, P vs NP, задача коммивояжёра, физика и анализ данных законов.',
    },
  },
  {
    id: 'associative',
    href: '/associative/',
    label: { en: 'Associative stack', ru: 'Ассоциативный стек' },
    title: { en: 'Associative technologies', ru: 'Ассоциативные технологии' },
    glyph: '12 23 31',
    summary: {
      en: 'The associative stack in development since 2010: theory, notation, storage, platform and AI on top.',
      ru: 'Ассоциативный стек, который развивается с 2010 года: теория, нотация, хранилище, платформа и ИИ поверх них.',
    },
  },
  {
    id: 'art',
    href: '/art/',
    label: { en: 'Art & other', ru: 'Искусство и др.' },
    title: { en: 'Art & other projects', ru: 'Искусство и другие проекты' },
    glyph: '11 21 31 41',
    summary: {
      en: 'Visual, audio and game experiments, projects that do not fit other categories, and all link symbols.',
      ru: 'Визуальные, звуковые и игровые эксперименты, проекты вне других категорий и все символы связей.',
    },
  },
  {
    id: 'blog',
    href: '/blog/',
    label: { en: 'Blog', ru: 'Блог' },
    title: { en: 'Blog', ru: 'Блог' },
    glyph: '12 23 34 41',
    summary: {
      en: 'One deduplicated feed of X, VK and Telegram posts, archived with full formatting.',
      ru: 'Единая лента постов из X, VK и Telegram без дублей, сохранённая с полным форматированием.',
    },
  },
];

export const pageById = (id) => PAGES.find((p) => p.id === id);
