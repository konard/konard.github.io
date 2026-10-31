// Everything on the site that can be configured (issue #13): the background
// animation, the skin of the interface, the sound (issue #15) and the
// notation of the links theory.
// The defaults were the look of the site before settings existed; issue #15
// replaced some of them with the settings its author chose (the universe, the
// grid, the rain and the glass). The settings page is built
// from this list, and RULES (defaults, limits and choices) also checks values
// read from localStorage, both here and in the script that applies the skin
// before the first paint (see SETTINGS_SCRIPT in vite.config.js).
//
// Numbers become CSS variables (`liquid.blur` → `--liquid-blur: 18px`),
// choices and switches become attributes of <html> (`skin.name` →
// `data-skin-name="liquid"`), colours become CSS variables; see apply.js.

import { option, select } from './fields.js';
import { BACKGROUND_SECTIONS } from './schema.background.js';
import { LAYER_SECTIONS } from './schema.layers.js';
import { SKIN_SECTIONS } from './schema.skins.js';
import { UI_SECTIONS } from './schema.ui.js';
import { SOUND_SECTION } from './schema.sound.js';
import { DEFAULT_LOOK } from './schema.defaults.js';

export { PALETTES, SKINS } from './schema.skins.js';

/**
 * Sections of the settings page; `when(settings)` hides a section that does not
 * apply, and `column` (1 by default) is the column of the page it is shown in.
 */
const [motion, nebula, grid, rain] = BACKGROUND_SECTIONS;
const [stars, beams] = LAYER_SECTIONS;

const SECTION_LIST = [
  // The background sections in the order of the layers, bottom to top.
  motion,
  nebula,
  stars,
  grid,
  beams,
  rain,
  SOUND_SECTION,
  ...SKIN_SECTIONS,
  ...UI_SECTIONS,
  {
    id: 'theory',
    column: 2,
    title: { en: 'Links theory notation', ru: 'Нотация теории связей' },
    lead: {
      en: 'The English draft 0.0.2 of the links meta-theory writes links as L → L²; the latest draft 0.0.3 renames links to references and writes R → R².',
      ru: 'Английский черновик 0.0.2 метатеории связей записывает связи как L → L²; последний черновик 0.0.3 называет их ссылками и пишет R → R².',
    },
    fields: [
      select(
        'theory.notation',
        'L',
        [
          option('L', 'L → L² (draft 0.0.2, links)', 'L → L² (черновик 0.0.2, связи)'),
          option('R', 'R → R² (draft 0.0.3, references)', 'R → R² (черновик 0.0.3, ссылки)'),
        ],
        { en: 'Notation', ru: 'Нотация' },
      ),
    ],
  },
];

/**
 * The sections with the default look of issue #45 (./schema.defaults.js) put
 * over the defaults of the fields.
 */
export const SECTIONS = SECTION_LIST.map((section) => ({
  ...section,
  fields: section.fields.map((field) => (field.key in DEFAULT_LOOK ? { ...field, d: DEFAULT_LOOK[field.key] } : field)),
}));

export const FIELDS = SECTIONS.flatMap((section) => section.fields);

/** What the settings of the default look were before issue #45: the look of issue #39. */
export const PREVIOUS_DEFAULTS = Object.fromEntries(
  SECTION_LIST.flatMap((section) => section.fields)
    .filter((field) => field.key in DEFAULT_LOOK)
    .map((field) => [field.key, field.d]),
);

/**
 * Settings that only scripts read (`css: false`, issue #15) are not put on
 * <html> as CSS variables or attributes: there are hundreds of them.
 */
const forCss = (rules) => Object.fromEntries(FIELDS.filter((f) => f.css !== false).map((f) => [f.key, rules[f.key]]));

/** Every key with its default, limits or choices; also embedded in the before-paint script. */
export const RULES = Object.fromEntries(
  FIELDS.map(({ key, type, d, min, max, options, unit }) => {
    const rule = { d };
    if (type === 'range') Object.assign(rule, { min, max, ...(unit && !'%×'.includes(unit) ? { u: unit } : {}) });
    if (type === 'select') rule.o = options.map((o) => o.value);
    if (type === 'color') rule.c = 1;
    return [key, rule];
  }),
);

/** The rules of the settings that reach the stylesheets; see apply.js. */
export const CSS_RULES = forCss(RULES);

export const DEFAULTS = Object.fromEntries(FIELDS.map(({ key, d }) => [key, d]));
