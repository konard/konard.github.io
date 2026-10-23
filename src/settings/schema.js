// Everything on the site that can be configured (issue #13): the background
// animation, the skin of the interface and the notation of the links theory.
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

import { option, select } from './fields';
import { BACKGROUND_SECTIONS } from './schema.background';
import { SKIN_SECTIONS } from './schema.skins';

export { PALETTES, SKINS } from './schema.skins';

/**
 * Sections of the settings page; `when(settings)` hides a section that does not
 * apply, and `column` (1 by default) is the column of the page it is shown in.
 */
export const SECTIONS = [
  ...BACKGROUND_SECTIONS,
  ...SKIN_SECTIONS,
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

export const FIELDS = SECTIONS.flatMap((section) => section.fields);

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

export const DEFAULTS = Object.fromEntries(FIELDS.map(({ key, d }) => [key, d]));
