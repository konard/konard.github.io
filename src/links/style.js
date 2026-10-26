// Every option of the picture of a network in the editor of /network/
// (issue #17): the shape of the links (the angle at which a link leaves its
// source and enters its target, its start, end and middle), the lines, the
// colours, the background, the card around the symbol, a caption, the size of
// the exported image and the experimental solver of overlaps.
//
// The fields reuse the helpers of the settings page (src/settings/fields.js).
// A style is a flat object; `normalizeStyle` checks every value (it may come
// from a shared link), and `styleToParams` / `styleFromParams` keep only the
// values that differ from the defaults in the query string, so a shared link
// opens exactly the picture that was shared.
import { color, option, range, select, toggle } from '../settings/fields';
import { COLORS, SHAPE } from './glyph';
import { GEOMETRY_SECTIONS } from './style-geometry';
import { linkGaps, normalizeGaps } from './gaps';

/** Link colours: the site's, and a few more sets of nine. */
export const PALETTES = {
  site: COLORS,
  neon: ['#00f0ff', '#ff00e6', '#faff00', '#00ff85', '#ff6b00', '#8a5cff', '#ff2d55', '#00b3ff', '#c6ff00'],
  pastel: ['#93c5fd', '#c4b5fd', '#f9a8d4', '#fde68a', '#a7f3d0', '#fed7aa', '#bae6fd', '#fecaca', '#d9f99d'],
  warm: ['#f97316', '#ef4444', '#eab308', '#f43f5e', '#fb923c', '#facc15', '#dc2626', '#fbbf24', '#e11d48'],
  cold: ['#06b6d4', '#3b82f6', '#8b5cf6', '#14b8a6', '#0ea5e9', '#6366f1', '#22d3ee', '#a78bfa', '#2dd4bf'],
  // The light-theme link colours of src/index.css, for light backgrounds.
  print: ['#0e7490', '#9333ea', '#db2777', '#b45309', '#047857', '#c2410c', '#1d4ed8', '#b91c1c', '#4d7c0f'],
};

/** Sections of the editor; each field is one option of the style. */
export const STYLE_SECTIONS = [
  ...GEOMETRY_SECTIONS,
  {
    id: 'lines',
    title: { en: 'Lines and colours', ru: 'Линии и цвета' },
    fields: [
      range('strokeWidth', 1.3, 0.5, 10, 0.1, { en: 'Line width', ru: 'Толщина линий' }),
      select(
        'dash',
        'solid',
        [
          option('solid', 'Solid', 'Сплошная'),
          option('dashed', 'Dashed', 'Штрихи'),
          option('dotted', 'Dotted', 'Точки'),
          option('dashdot', 'Dash and dot', 'Штрих-пунктир'),
          option('long', 'Long dashes', 'Длинные штрихи'),
        ],
        { en: 'Line style', ru: 'Стиль линий' },
      ),
      select(
        'linecap',
        'round',
        [
          option('round', 'Round', 'Круглые'),
          option('butt', 'Flat', 'Плоские'),
          option('square', 'Square', 'Квадратные'),
        ],
        { en: 'Line ends', ru: 'Концы линий' },
      ),
      select(
        'linejoin',
        'miter',
        [
          option('round', 'Round', 'Скруглённые'),
          option('miter', 'Sharp', 'Острые'),
          option('bevel', 'Bevelled', 'Срезанные'),
        ],
        { en: 'Corners', ru: 'Углы' },
      ),
      range('opacity', 1, 0.1, 1, 0.05, { en: 'Opacity', ru: 'Непрозрачность' }, { unit: '%' }),
      range('glow', 0, 0, 12, 0.5, { en: 'Glow', ru: 'Свечение' }),
      select(
        'palette',
        'site',
        [
          option('site', 'Site', 'Как на сайте'),
          option('neon', 'Neon', 'Неон'),
          option('pastel', 'Pastel', 'Пастель'),
          option('warm', 'Warm', 'Тёплые'),
          option('cold', 'Cold', 'Холодные'),
          option('print', 'For light backgrounds', 'Для светлого фона'),
          option('mono', 'One colour', 'Один цвет'),
          option('custom', 'Own colour of each link', 'Свой цвет каждой связи'),
        ],
        { en: 'Colours of the links', ru: 'Цвета связей' },
      ),
      color(
        'monoColor',
        '#e6edf7',
        { en: 'Colour of the links', ru: 'Цвет связей' },
        {
          when: (s) => s.palette === 'mono',
        },
      ),
    ],
  },
  {
    id: 'background',
    title: { en: 'Background and card', ru: 'Фон и карточка' },
    fields: [
      select(
        'background',
        'solid',
        [
          option('transparent', 'Transparent', 'Прозрачный'),
          option('solid', 'One colour', 'Один цвет'),
          option('linear', 'Linear gradient', 'Линейный градиент'),
          option('radial', 'Radial gradient', 'Радиальный градиент'),
        ],
        { en: 'Background', ru: 'Фон' },
      ),
      color(
        'bgColor',
        '#000000',
        { en: 'Background colour', ru: 'Цвет фона' },
        {
          when: (s) => s.background !== 'transparent',
        },
      ),
      color(
        'bgColor2',
        '#1e1b4b',
        { en: 'Second colour', ru: 'Второй цвет' },
        {
          when: (s) => s.background === 'linear' || s.background === 'radial',
        },
      ),
      range(
        'bgAngle',
        135,
        0,
        359,
        1,
        { en: 'Gradient angle', ru: 'Угол градиента' },
        {
          unit: '°',
          when: (s) => s.background === 'linear',
        },
      ),
      toggle('card', false, { en: 'Card around the symbol', ru: 'Карточка вокруг символа' }),
      color('cardColor', '#0d1220', { en: 'Card colour', ru: 'Цвет карточки' }, { when: (s) => s.card }),
      range(
        'cardOpacity',
        0.8,
        0,
        1,
        0.05,
        { en: 'Card opacity', ru: 'Непрозрачность карточки' },
        {
          unit: '%',
          when: (s) => s.card,
        },
      ),
      select(
        'borderStyle',
        'solid',
        [
          option('solid', 'Solid', 'Сплошная'),
          option('dashed', 'Dashed', 'Штрихи'),
          option('dotted', 'Dotted', 'Точки'),
          option('double', 'Double', 'Двойная'),
          option('none', 'No border', 'Без рамки'),
        ],
        { en: 'Border', ru: 'Рамка' },
        { when: (s) => s.card },
      ),
      range(
        'border',
        0.6,
        0.1,
        6,
        0.1,
        { en: 'Border width', ru: 'Толщина рамки' },
        {
          when: (s) => s.card && s.borderStyle !== 'none',
        },
      ),
      color(
        'borderColor',
        '#2b3b57',
        { en: 'Border colour', ru: 'Цвет рамки' },
        {
          when: (s) => s.card && s.borderStyle !== 'none',
        },
      ),
      range(
        'radius',
        10,
        0,
        50,
        1,
        { en: 'Corner radius', ru: 'Скругление углов' },
        { unit: '%', when: (s) => s.card },
      ),
      range(
        'inset',
        3,
        0,
        30,
        0.5,
        { en: 'Space around the card', ru: 'Отступ вокруг карточки' },
        {
          unit: '%',
          when: (s) => s.card,
        },
      ),
    ],
  },
  {
    id: 'caption',
    title: { en: 'Caption', ru: 'Подпись' },
    fields: [
      select('notation', 'L', [option('L', 'L → L²'), option('R', 'R → R²')], {
        en: 'Theory notation',
        ru: 'Нотация теории',
      }),
      select(
        'caption',
        'none',
        [
          option('none', 'None', 'Нет'),
          option('theory', 'Math notation', 'Математическая нотация'),
          option('pairs', 'Pairs with the base', 'Пары с основанием'),
          option('number', 'N-ary number', 'N-ричное число'),
          option('links', 'Links notation', 'Нотация связей'),
          option('custom', 'Own text', 'Свой текст'),
        ],
        { en: 'Caption', ru: 'Подпись' },
      ),
      {
        key: 'captionText',
        type: 'text',
        d: '',
        max: 80,
        label: { en: 'Text', ru: 'Текст' },
        when: (s) => s.caption === 'custom',
      },
      color(
        'captionColor',
        '#7d8aa3',
        { en: 'Caption colour', ru: 'Цвет подписи' },
        { when: (s) => s.caption !== 'none' },
      ),
      range(
        'captionSize',
        6,
        3,
        14,
        0.5,
        { en: 'Caption size', ru: 'Размер подписи' },
        { when: (s) => s.caption !== 'none' },
      ),
      select(
        'captionFont',
        'mono',
        [
          option('mono', 'Monospace', 'Моноширинный'),
          option('sans', 'Sans serif', 'Без засечек'),
          option('serif', 'Serif', 'С засечками'),
        ],
        { en: 'Font', ru: 'Шрифт' },
        { when: (s) => s.caption !== 'none' },
      ),
    ],
  },
  {
    id: 'image',
    title: { en: 'Image size', ru: 'Размер изображения' },
    fields: [
      range('width', 2048, 64, 4096, 1, { en: 'Width', ru: 'Ширина' }, { unit: 'px' }),
      range('height', 2048, 64, 4096, 1, { en: 'Height', ru: 'Высота' }, { unit: 'px' }),
      range('quality', 0.92, 0.5, 1, 0.01, { en: 'JPEG and WebP quality', ru: 'Качество JPEG и WebP' }, { unit: '%' }),
    ],
  },
  {
    id: 'experimental',
    title: { en: 'Experimental: fewer overlaps', ru: 'Эксперимент: меньше наложений' },
    lead: {
      en: 'Turns the ends and optionally adjusts individual reference gaps and middle cuts to reduce crossings. Small cuts are preferred; manual values are the starting point. Apply the result to keep editing it.',
      ru: 'Поворачивает концы и при желании меняет зазоры ссылок и разрывы середины отдельных связей. Предпочитает небольшие разрывы и начинает с ручных значений. Примените результат, чтобы продолжить редактирование.',
    },
    fields: [
      toggle('solve', false, { en: 'Reduce overlaps automatically', ru: 'Уменьшать наложения автоматически' }),
      toggle('solveGaps', true, { en: 'Adjust individual gaps', ru: 'Менять отдельные зазоры' }),
      range('solveGapRange', 0.2, 0, 1, 0.05, { en: 'Largest reference gap change', ru: 'Изменение зазора ссылки' }),
      range('solveMiddleRange', 4, 0, 15, 0.5, { en: 'Largest middle cut change', ru: 'Изменение разрыва середины' }),
      range('solveRange', 60, 0, 180, 5, { en: 'Largest turn', ru: 'Наибольший поворот' }, { unit: '°' }),
      range('solveStep', 15, 5, 30, 5, { en: 'Turn step', ru: 'Шаг поворота' }, { unit: '°' }),
    ],
  },
];

/** The options kept per link: its colour (with the own colours) and the turns of its ends. */
const PER_LINK = [
  { key: 'colors', type: 'list', d: COLORS.join(',') },
  { key: 'gap', type: 'range', d: 0.08, min: 0, max: 0.4 },
  { key: 'turns', type: 'list', d: '' },
  { key: 'gaps', type: 'list', d: '' },
];

export const STYLE_FIELDS = [...STYLE_SECTIONS.flatMap((section) => section.fields), ...PER_LINK];
export const STYLE_DEFAULTS = Object.fromEntries(STYLE_FIELDS.map((field) => [field.key, field.d]));

const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** A per-link list "a,b,c" of colours, or of turns "source target". */
function normalizeList(key, value) {
  if (key === 'gaps') return normalizeGaps(value);
  const items = String(value ?? '').split(',');
  if (key === 'colors')
    return items.every((c) => HEX.test(c.trim())) ? items.map((c) => c.trim().toLowerCase()).join(',') : '';
  const turns = items.map((item) =>
    item
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((a) => clamp(Math.round(Number(a)) || 0, -180, 180)),
  );
  // Links after the last turned one need no entry: they are not turned.
  while (turns.length && turns[turns.length - 1].every((a) => a === 0)) turns.pop();
  return turns.map((pair) => `${pair[0]} ${pair[1] ?? 0}`).join(',');
}

/** One value of a style checked against its field: the default if it is not valid. */
function normalizeValue(field, value) {
  if (value === undefined) return field.d;
  switch (field.type) {
    case 'range': {
      const number = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(number) && value !== '' && value !== null ? clamp(number, field.min, field.max) : field.d;
    }
    case 'toggle':
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === '1' ? true : value === 'false' || value === '0' ? false : field.d;
    case 'select':
      return field.options.some((o) => o.value === value) ? value : field.d;
    case 'color':
      return HEX.test(value) ? value.toLowerCase() : field.d;
    case 'text':
      return typeof value === 'string' ? value.slice(0, field.max) : field.d;
    default:
      return normalizeList(field.key, value);
  }
}

/** A complete, valid style: every option of `raw` checked, the rest the defaults. */
export function normalizeStyle(raw = {}) {
  // Bookmarks from issue #17 used one gap for both references.
  // Older shared links omitted palette=custom because it was the default.
  if (raw?.colors !== undefined && raw?.palette === undefined) raw = { ...raw, palette: 'custom' };
  if (raw?.gap !== undefined) raw = { startGap: raw.gap, endGap: raw.gap, ...raw };
  return Object.fromEntries(STYLE_FIELDS.map((field) => [field.key, normalizeValue(field, raw?.[field.key])]));
}

/** The options that differ from the defaults as query parameters. */
export function styleToParams(style) {
  const params = new URLSearchParams();
  STYLE_FIELDS.forEach(({ key }) => {
    if (style[key] !== STYLE_DEFAULTS[key]) params.set(key, String(style[key]));
  });
  return params;
}

/** A style read from query parameters (unknown or invalid values are left out). */
export function styleFromParams(params) {
  const raw = {};
  STYLE_FIELDS.forEach(({ key }) => {
    if (params.has(key)) raw[key] = params.get(key);
  });
  return normalizeStyle(raw);
}

/** The colour of each of `n` links in a style. */
export function linkColors(style, n) {
  const own = style.colors ? style.colors.split(',') : [];
  return Array.from({ length: n }, (_, i) => {
    if (style.palette === 'mono') return style.monoColor;
    if (style.palette === 'custom') return own[i] || COLORS[i % COLORS.length];
    const palette = PALETTES[style.palette] || COLORS;
    return palette[i % palette.length];
  });
}

/** The [source, target] turns of each of `n` links, in degrees. */
export function linkTurns(style, n) {
  const turns = style.turns ? style.turns.split(',').map((pair) => pair.split(' ').map(Number)) : [];
  return Array.from({ length: n }, (_, i) => turns[i] || [0, 0]);
}

/** A style with the turns of each link set to `turns` ([[source, target], …]). */
export const withTurns = (style, turns) =>
  normalizeStyle({ ...style, turns: turns.map((pair) => pair.join(' ')).join(',') });

/** A style where link `i` has its own colour `value` (the other links keep the colours they had). */
export function withColor(style, n, i, value) {
  const colors = linkColors(style, Math.max(n, COLORS.length));
  colors[i] = value;
  return normalizeStyle({ ...style, palette: 'custom', colors: colors.join(',') });
}

/** The shape options of glyph.js taken from a style. */
export function shapeOfStyle(style, n, extraTurns = null, extraGaps = null) {
  const turns = linkTurns(style, n).map((pair, i) =>
    extraTurns ? [pair[0] + extraTurns[i][0], pair[1] + extraTurns[i][1]] : pair,
  );
  return Object.fromEntries([
    ...Object.keys(SHAPE)
      .filter((key) => !['turns', 'linkGaps'].includes(key))
      .map((key) => [key, style[key]]),
    ['turns', turns],
    ['linkGaps', extraGaps || linkGaps(style, n)],
    ['strokeWidth', style.strokeWidth],
  ]);
}

/**
 * Looks to start from. A look changes only the options it names and keeps the
 * per-link turns, so a picture can be restyled without losing its hand work.
 * "Do we need a card at all?" (issue #17): both are here, the card of the
 * gallery and a plain black background with only the links.
 */
export const LOOKS = [
  {
    id: 'card',
    label: { en: 'Card (as in the gallery)', ru: 'Карточка (как в галерее)' },
    values: {
      ...SHAPE,
      startGap: SHAPE.gap,
      endGap: SHAPE.gap,
      gap: SHAPE.gap,
      strokeWidth: 2.4,
      linejoin: 'round',
      palette: 'site',
      colors: '',
      card: true,
      bgColor: '#070b14',
      placement: 'circle',
    },
  },
  {
    id: 'black',
    label: { en: 'Plain black', ru: 'Просто чёрный' },
    values: { card: false, background: 'solid', bgColor: '#000000' },
  },
  {
    id: 'transparent',
    label: { en: 'Transparent', ru: 'Прозрачный' },
    values: { card: false, background: 'transparent' },
  },
  {
    id: 'paper',
    label: { en: 'Paper', ru: 'Бумага' },
    values: { card: false, background: 'solid', bgColor: '#f8fafc', palette: 'print', captionColor: '#334155' },
  },
  {
    id: 'blueprint',
    label: { en: 'Blueprint', ru: 'Чертёж' },
    values: {
      background: 'solid',
      bgColor: '#0b3d91',
      card: true,
      cardColor: '#0b3d91',
      cardOpacity: 1,
      borderStyle: 'dashed',
      borderColor: '#93c5fd',
      radius: 0,
      palette: 'mono',
      monoColor: '#e0f2fe',
      strokeWidth: 1.6,
      middle: 'dot',
      captionColor: '#bfdbfe',
    },
  },
  {
    id: 'neon',
    label: { en: 'Neon', ru: 'Неон' },
    values: {
      background: 'radial',
      bgColor: '#1a0533',
      bgColor2: '#020008',
      card: true,
      cardColor: '#05010d',
      cardOpacity: 0.6,
      borderColor: '#ff00e6',
      border: 0.8,
      palette: 'neon',
      glow: 3,
      strokeWidth: 2.8,
    },
  },
  {
    id: 'social',
    label: { en: 'Social card 1200 × 630', ru: 'Карточка для соцсетей 1200 × 630' },
    values: { width: 1200, height: 630, caption: 'theory', captionSize: 5 },
  },
];

/** `style` with look `id` applied. */
export function applyLook(style, id) {
  const look = LOOKS.find((l) => l.id === id);
  if (!look) return style;
  const keep = {
    notation: style.notation,
    turns: style.turns,
    gaps: style.gaps,
    solve: style.solve,
    solveRange: style.solveRange,
    solveStep: style.solveStep,
    solveGaps: style.solveGaps,
    solveGapRange: style.solveGapRange,
    solveMiddleRange: style.solveMiddleRange,
  };
  const size = look.values.width ? {} : { width: style.width, height: style.height, quality: style.quality };
  return normalizeStyle({ ...STYLE_DEFAULTS, ...size, ...look.values, ...keep });
}

/** Image sizes for the usual places a picture is shared to. */
export const SIZES = [
  { label: '512 × 512', width: 512, height: 512 },
  { label: '1024 × 1024', width: 1024, height: 1024 },
  { label: '2048 × 2048', width: 2048, height: 2048 },
  { label: 'Instagram 1080 × 1080', width: 1080, height: 1080 },
  { label: 'Open Graph 1200 × 630', width: 1200, height: 630 },
  { label: 'X 1600 × 900', width: 1600, height: 900 },
  { label: 'Stories 1080 × 1920', width: 1080, height: 1920 },
];
