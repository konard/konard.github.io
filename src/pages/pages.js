import { localized } from '../i18n/localizer.js';
// Pages of the site. Each one is a separate Vite entry (see vite.config.js),
// so it is a real URL that works without JavaScript routing on GitHub Pages.
// Texts are `{ en, ru }` objects, translated with useLang().t.
export const PAGES = [
  {
    id: 'home',
    href: '/',
    label: localized('m4d522dda41b0'),
    title: localized('md318497ecc56'),
    glyph: '11',
    summary: localized('m5951a88db037'),
  },
  {
    id: 'experience',
    href: '/experience/',
    label: localized('m59ce29a188ea'),
    title: localized('mfd826b96cd04'),
    glyph: '11 12 33',
    summary: localized('m64e8ebaa5cc5'),
  },
  {
    id: 'repositories',
    href: '/repositories/',
    label: localized('m05caedaaca06'),
    title: localized('m485413b55422'),
    glyph: '12 21',
    summary: localized('md4bf13fcf484'),
  },
  {
    id: 'research',
    href: '/research/',
    label: localized('mb5571de8acf7'),
    title: localized('mca86c130f6a8'),
    glyph: '11 22 12',
    summary: localized('m52996aeb6f51'),
  },
  {
    id: 'associative',
    href: '/associative/',
    label: localized('m304361f2a9f7'),
    title: localized('me4e2ce610593'),
    glyph: '12 23 31',
    summary: localized('m32852ec1c6a8'),
  },
  {
    id: 'art',
    href: '/art/',
    label: localized('m754db1e4bcf0'),
    title: localized('m6121c19b6228'),
    glyph: '11 21 31 41',
    summary: localized('md7355f2f4a2f'),
  },
  {
    id: 'blog',
    href: '/blog/',
    label: localized('m3a5d870e1ef3'),
    title: localized('m3a5d870e1ef3'),
    glyph: '12 23 34 41',
    summary: localized('m7b931fa9ed35'),
  },
];

export const pageById = (id) => PAGES.find((p) => p.id === id);
