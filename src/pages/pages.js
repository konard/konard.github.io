// Pages of the site. Each one is a separate Vite entry (see vite.config.js),
// so it is a real URL that works without JavaScript routing on GitHub Pages.
export const PAGES = [
  { id: 'home', href: '/', label: 'CV', title: 'Biography & CV', glyph: '11', summary: 'The one-page CV.' },
  {
    id: 'experience',
    href: '/experience/',
    label: 'Experience',
    title: 'Experience by role',
    glyph: '11 12 33',
    summary: 'Only the relevant experience: ML / AI, DevOps, CEO / team lead, developer or scientist.',
  },
  {
    id: 'repositories',
    href: '/repositories/',
    label: 'Repositories',
    title: 'All repositories',
    glyph: '12 21',
    summary: 'Every original repository, how it is useful in each field, and the best examples per IT profession.',
  },
  {
    id: 'research',
    href: '/research/',
    label: 'Research',
    title: 'Research & theory',
    glyph: '11 22 12',
    summary: 'The links meta-theory, the problem solving algorithm, P vs NP, TSP, physics and data science on laws.',
  },
  {
    id: 'associative',
    href: '/associative/',
    label: 'Associative stack',
    title: 'Associative technologies',
    glyph: '12 23 31',
    summary: 'The associative stack in development since 2010: theory, notation, storage, platform and AI on top.',
  },
  {
    id: 'art',
    href: '/art/',
    label: 'Art & other',
    title: 'Art & other projects',
    glyph: '11 21 31 41',
    summary: 'Visual, audio and game experiments, projects that do not fit other categories, and all link symbols.',
  },
  {
    id: 'blog',
    href: '/blog/',
    label: 'Blog',
    title: 'Blog',
    glyph: '12 23 34 41',
    summary: 'One deduplicated feed of X, VK and Telegram posts, archived with full formatting.',
  },
];

export const pageById = (id) => PAGES.find((p) => p.id === id);
