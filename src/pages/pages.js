// Pages of the site. Each one is a separate Vite entry (see vite.config.js),
// so it is a real URL that works without JavaScript routing on GitHub Pages.
export const PAGES = [
  { id: 'home', href: '/', label: 'CV', title: 'Biography & CV', glyph: '00', summary: 'The one-page CV.' },
  {
    id: 'repositories',
    href: '/repositories/',
    label: 'Repositories',
    title: 'All repositories',
    glyph: '01 10',
    summary: 'Every original repository, how it is useful in each field, and the best examples per IT profession.',
  },
  {
    id: 'experience',
    href: '/experience/',
    label: 'Experience',
    title: 'Experience by role',
    glyph: '00 01 22',
    summary: 'Only the relevant experience: ML / AI, DevOps, CEO / team lead, developer or researcher.',
  },
  {
    id: 'research',
    href: '/research/',
    label: 'Research',
    title: 'Research & theory',
    glyph: '00 11 01',
    summary: 'The links meta-theory, the problem solving algorithm, P vs NP, TSP, physics and data science on laws.',
  },
  {
    id: 'associative',
    href: '/associative/',
    label: 'Associative stack',
    title: 'Associative technologies',
    glyph: '01 12 20',
    summary: 'The associative stack in development since 2010: theory, notation, storage, platform and AI on top.',
  },
  {
    id: 'art',
    href: '/art/',
    label: 'Art & other',
    title: 'Art & other projects',
    glyph: '00 10 20 30',
    summary: 'Visual, audio and game experiments, projects that do not fit other categories, and all link symbols.',
  },
  {
    id: 'blog',
    href: '/blog/',
    label: 'Blog',
    title: 'Blog',
    glyph: '01 12 23 30',
    summary: 'One deduplicated feed of X, VK and Telegram posts, archived with full formatting.',
  },
];

export const pageById = (id) => PAGES.find((p) => p.id === id);
