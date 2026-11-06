import { localized } from '../i18n/localizer.js';
// Sections of the skins (issues #13 and #15): the choice of a skin and the
// options of glass, liquid glass and the futuristic HUD; see schema.js.
import { MATERIAL_FIELDS } from './schema.materials.js';
import { CONTROL_TYPES, CORNERS } from '../skins.frames.js';
import { option, range, select, toggle } from './fields.js';

/** Futuristic palettes of konard/immortality: [id, English name, Russian name, neon colour]. */
export const PALETTES = [
  ['mission', 'Mission teal', 'Бирюза миссии', '#7efcf6'],
  ['tron', 'Tron', 'Трон', '#00cfd1'],
  ['ares', 'Ares', 'Арес', '#ff2f45'],
  ['clu', 'Clu', 'Клу', '#ff8300'],
  ['athena', 'Athena', 'Афина', '#fbc600'],
  ['aphrodite', 'Aphrodite', 'Афродита', '#f259c8'],
  ['poseidon', 'Poseidon', 'Посейдон', '#59aaf8'],
  ['soulextract', 'Soul extract', 'Экстракт души', '#27e1fa'],
  ['glitchy', 'Glitchy violet', 'Глитч-фиолетовый', '#e2aeeb'],
  ['amber', 'Amber', 'Янтарь', '#ffd273'],
  ['matrix', 'Matrix', 'Матрица', '#3dff7a'],
  ['monochrome', 'Monochrome', 'Монохром', '#ffffff'],
];

export const SKINS = ['glass', 'liquid', 'futuristic'];

export const CORNER_SHAPES = [
  option('square', 'Square', 'Прямой'),
  option('cut', 'Cut', 'Срез'),
  option('tall', 'Long cut down', 'Длинный срез вниз'),
  option('wide', 'Long cut along', 'Длинный срез вдоль'),
  option('round', 'Round', 'Скруглённый'),
  option('scoop', 'Scoop (round inwards)', 'Выемка (скругление внутрь)'),
  option('notch', 'Notch (a step)', 'Ступенька'),
];

export const CORNER_LINES = [
  option('none', 'No line at the corner', 'Без линии на углу'),
  option('gap', 'Missing border near the corner', 'Разрыв рамки у угла'),
  option('line', 'The line of the edges', 'Как края'),
  option('accent', 'Bright line', 'Яркая линия'),
  option('bracket', 'Bright bracket', 'Яркий уголок'),
];

const CORNER_NAMES = {
  tl: localized('m10b3eef0935e'),
  tr: localized('maabcfc345296'),
  br: localized('m606e33989e72'),
  bl: localized('m21bb1e7d2b05'),
};

/** The default custom frame: a bracket and a bright cut on one diagonal, open corners on the other. */
const CORNER_LOOKS = {
  tl: ['cut', 'bracket', 14],
  tr: ['square', 'gap', 14],
  br: ['cut', 'accent', 14],
  bl: ['square', 'gap', 14],
};

/** A width where −1 keeps the width of the line (applied by apply.js only when it is 0 or more). */
const AUTO_WIDTH = {
  unit: 'px',
  hint: localized('m30071bccccf4'),
};

const SIDE_NAMES = [
  ['top', 'Top edge', 'Верхний край'],
  ['right', 'Right edge', 'Правый край'],
  ['bottom', 'Bottom edge', 'Нижний край'],
  ['left', 'Left edge', 'Левый край'],
];

/**
 * The levels of the frame (issue #47: "each type of INTERFACE CONTROLS must
 * have separate CORNERS OF THE FRAME, so on each level I should be able to
 * configure it fully"): outer panels, inner blocks and every type of control
 * (src/skins.frames.js). Each one is a tab of the corners section.
 */
export const LEVEL_NAMES = {
  panel: localized('mf2b14375bd9b'),
  block: localized('md141e78cac1e'),
  button: localized('m7a80f5e43922'),
  field: localized('mac60426e51d2'),
  tab: localized('m41e2c5acb472'),
  chip: localized('m93f7daadcbdb'),
  menu: localized('m1cf0c528ef6f'),
  nav: localized('m3bb24bab3271'),
  subnav: localized('m60f384b92348'),
  table: localized('md5ce05235a41'),
};
export const LEVEL_IDS = ['panel', 'block', ...Object.keys(CONTROL_TYPES)];
export const CONTROL_LEVELS = Object.keys(CONTROL_TYPES);

/** The key of a setting of a corner: `corner.tlShape` for outer panels, `corner.buttonTlShape` for a level. */
export const cornerKey = (level, c, name) =>
  level === 'panel' ? `corner.${c}${name}` : `corner.${level}${c[0].toUpperCase()}${c[1]}${name}`;

/** The key of a setting of a whole level: `corner.edges` for outer panels, `corner.buttonEdges` for a level. */
export const levelKey = (level, name) =>
  level === 'panel' ? `corner.${name[0].toLowerCase()}${name.slice(1)}` : `corner.${level}${name}`;

/** Whether a level draws corners of its own (outer panels always do). */
export const ownsCorners = (level, s) =>
  level === 'panel' || (level === 'block' ? s['corner.blocks'] === 'own' : s[levelKey(level, 'Corners')] === 'own');

/**
 * The look of the outer panels by default (the corners of DEFAULT_LOOK): a level
 * given its own corners starts from it.
 */
const LEVEL_LOOKS = {
  tl: ['cut', 'bracket'],
  tr: ['square', 'accent'],
  br: ['cut', 'accent'],
  bl: ['square', 'bracket'],
};

/** A size where −1 is the size of the outer panels in the scale of the level. */
const AUTO_SIZE = {
  unit: 'px',
  hint: localized('m5bc08aeb81cd'),
};

/** Shape, line, size and width of one corner of a level: `corner.tlShape`, `corner.buttonTlShape` and so on. */
const corner = (level) => (c) => {
  const [shape, line, size] = level === 'panel' ? CORNER_LOOKS[c] : [...LEVEL_LOOKS[c], -1];
  const at = { tab: c, level, corner: c, when: (s) => ownsCorners(level, s) };
  return [
    select(cornerKey(level, c, 'Shape'), shape, CORNER_SHAPES, localized('m3ed59e8dd46d'), { ...at, tiles: 'shape' }),
    select(cornerKey(level, c, 'Line'), line, CORNER_LINES, localized('m548568809d0e'), { ...at, tiles: 'line' }),
    level === 'panel'
      ? range(cornerKey(level, c, 'Size'), size, 0, 128, 1, localized('m7c201b4a9144'), { ...at, unit: 'px' })
      : range(cornerKey(level, c, 'Size'), size, -1, 128, 1, localized('m7c201b4a9144'), { ...at, ...AUTO_SIZE }),
    range(cornerKey(level, c, 'Width'), -1, -1, 12, 0.5, localized('ma63bfc63d133'), { ...at, ...AUTO_WIDTH }),
  ];
};

const SAME = (en, ru) => option('same', en, ru);

/**
 * The edges of a level with corners of its own: their colour, style and the
 * width of every side, each of them the one of the outer panels until it is set.
 */
const levelEdges = (level) => {
  const at = { level, when: (s) => ownsCorners(level, s) };
  const follow =
    level === 'block'
      ? SAME('As outer panels', 'Как у внешних панелей')
      : SAME('The border style of the controls', 'Стиль рамки элементов');
  return [
    select(
      levelKey(level, 'Edges'),
      'same',
      [
        SAME('As outer panels', 'Как у внешних панелей'),
        option('none', 'None', 'Нет'),
        option('faint', 'Faint line', 'Тонкая линия'),
        option('line', 'Bright line', 'Яркая линия'),
      ],
      localized('mff20b6449bb2'),
      at,
    ),
    select(
      levelKey(level, 'EdgeStyle'),
      'same',
      [
        follow,
        option('solid', 'Solid', 'Сплошные'),
        option('dashed', 'Dashed', 'Штриховые'),
        option('dotted', 'Dotted', 'Пунктирные'),
        option('double', 'Double', 'Двойные'),
      ],
      localized('m4b25549b64db'),
      at,
    ),
    ...SIDE_NAMES.map(([side, en, ru]) =>
      range(
        levelKey(level, `${side[0].toUpperCase()}${side.slice(1)}Width`),
        -1,
        -1,
        12,
        0.5,
        { en: `${en}: width`, ru: `${ru}: толщина` },
        {
          ...at,
          unit: 'px',
          hint: localized('ma31397dd88ea'),
        },
      ),
    ),
  ];
};

/**
 * Whether the elements of a level draw the custom frame: outer panels always,
 * inner blocks unless they are a plain line, controls unless they have a border.
 */
export const drawsFrame = (level, s) =>
  level === 'panel' ||
  (level === 'block'
    ? s['corner.blocks'] !== 'line'
    : s[levelKey(level, 'Corners')] === 'own' ||
      (s[levelKey(level, 'Corners')] === 'same' && s['corner.controls'] === 'frame'));

/** The limits of the size of an element of a level: [key name, English, Russian]. */
export const FIT_LIMITS = [
  ['FitMinWidth', 'Minimum width', 'Минимальная ширина'],
  ['FitMaxWidth', 'Maximum width', 'Максимальная ширина'],
  ['FitMinHeight', 'Minimum height', 'Минимальная высота'],
  ['FitMaxHeight', 'Maximum height', 'Максимальная высота'],
];

/** Whether a level has a limit of the size of its elements. */
export const hasFitLimits = (level, s) => FIT_LIMITS.some(([name]) => s[levelKey(level, name)] > 0);

/**
 * Corners by the size of the element (issue #47: "configure CORNERS OF THE
 * FRAME based on conditions like minimum/maximum height/width of the UI
 * element"): the limits of a level, and the size of the corners of its elements
 * outside them. The limits are read by src/frameFit.js only, so they are not
 * put on <html>; the scale is a variable of src/skins.frames.fit.css.
 */
const fitFields = (level) => {
  const at = { level, when: (s) => drawsFrame(level, s) };
  return [
    ...FIT_LIMITS.map(([name, en, ru], i) =>
      range(
        levelKey(level, name),
        0,
        0,
        1600,
        1,
        { en: `Full corners: ${en.toLowerCase()}`, ru: `Полные углы: ${ru.toLowerCase()}` },
        {
          ...at,
          css: false,
          unit: 'px',
          ...(i === 0 && {
            hint: localized('m17540d27f27f'),
          }),
        },
      ),
    ),
    range(levelKey(level, 'FitScale'), 0.5, 0, 1, 0.05, localized('m6fc7283748e6'), {
      level,
      unit: '×',
      when: (s) => drawsFrame(level, s) && hasFitLimits(level, s),
      hint: localized('m380be1e910b4'),
    }),
  ];
};

/** How a type of control is drawn: like all controls, with its own corners, or with its own border. */
const controlMode = (level) =>
  select(
    levelKey(level, 'Corners'),
    // Tables kept their border before issue #47, the second-level menu its plain
    // links before issue #49.
    level === 'table' || level === 'subnav' ? 'border' : 'same',
    [
      SAME('As all controls', 'Как у всех элементов'),
      option('own', 'Corners of their own', 'Свои углы'),
      option('border', 'Their own border', 'Своя рамка'),
    ],
    { en: `${LEVEL_NAMES[level].en}: frame`, ru: `${LEVEL_NAMES[level].ru}: рамка` },
    { level },
  );

export const SKIN_SECTIONS = [
  {
    id: 'skin',
    title: localized('m278b031cb2cc'),
    lead: localized('m04a65e0609d0'),
    fields: [
      select(
        'skin.name',
        'glass',
        [
          option('glass', 'Glass (Apple-like)', 'Стекло (как у Apple)'),
          option('liquid', 'Liquid glass', 'Жидкое стекло'),
          option(
            'futuristic',
            'Futuristic (HUD, after konard/immortality)',
            'Футуристичное (HUD, как в konard/immortality)',
          ),
        ],
        localized('m278b031cb2cc'),
      ),
    ],
  },
  {
    id: 'glass',
    title: localized('m4acc98d57d11'),
    when: (s) => s['skin.name'] === 'glass',
    fields: [
      range('glass.level', 0.4, 0, 1.25, 0.05, localized('mce50cba36abd'), { unit: '%' }),
      range('glass.blur', 3, 0, 30, 1, localized('m228fb2e05897'), { unit: 'px' }),
      range('glass.bar', 14, 0, 40, 1, localized('m41714d934cab'), { unit: 'px' }),
      range('glass.radius', 10, 0, 32, 1, localized('mf52ae7917e4c'), { unit: 'px' }),
      range('glass.saturation', 100, 100, 250, 5, localized('m00286f9934ec'), {
        unit: '%',
        hint: localized('m187f8000e216'),
      }),
      range('glass.edge', 0.14, 0, 0.6, 0.02, localized('m3d8dc4c27854'), { unit: '%' }),
      select(
        'glass.shadow',
        'none',
        [option('none', 'None', 'Нет'), option('soft', 'Soft', 'Мягкая'), option('deep', 'Deep', 'Глубокая')],
        localized('m6f14fa052a8c'),
      ),
      toggle('glass.highlight', false, localized('m85a1cef78f1a')),
    ],
  },
  {
    id: 'liquid',
    title: localized('mde4f06b59e3d'),
    lead: localized('m7c425fdd2d65'),
    when: (s) => s['skin.name'] === 'liquid',
    fields: [
      ...MATERIAL_FIELDS,
      range('liquid.blur', 18, 0, 48, 1, localized('mb68a5398d21f'), { unit: 'px' }),
      range('liquid.saturation', 180, 100, 300, 5, localized('m9e3e087499dc'), { unit: '%' }),
      range('liquid.brightness', 108, 70, 150, 1, localized('mcc4388b6594d'), { unit: '%' }),
      select(
        'liquid.tint',
        'theme',
        [
          option('theme', 'Theme colour', 'Цвет темы'),
          option('clear', 'Clear (white)', 'Прозрачное (белое)'),
          option('accent', 'Accent', 'Акцент'),
          option('smoke', 'Smoke (black)', 'Дымчатое (чёрное)'),
        ],
        localized('m99a5ddee4e29'),
      ),
      range('liquid.tintLevel', 0.22, 0, 1, 0.01, localized('m169959a5160a'), { unit: '%' }),
      range('liquid.radius', 24, 0, 48, 1, localized('mf52ae7917e4c'), { unit: 'px' }),
      range('liquid.highlight', 0.55, 0, 1, 0.05, localized('mdee92e8c5f0a'), { unit: '%' }),
      range('liquid.edge', 0.22, 0, 1, 0.02, localized('mfeb2a7088c8f'), { unit: '%' }),
      range('liquid.depth', 0.35, 0, 1, 0.05, localized('maf682a8ae38e'), { unit: '%' }),
      range('liquid.shadow', 0.5, 0, 1, 0.05, localized('m7bb3e1610c98'), { unit: '%' }),
      toggle('liquid.sheen', true, localized('md9bad9cb5842')),
      toggle('liquid.float', true, localized('mc0fdcf60b218')),
      toggle('liquid.pills', true, localized('mb6ce6e5cadbf')),
      toggle('liquid.refraction', false, localized('mc71c68fecd07')),
      range('liquid.refractionScale', 40, 0, 150, 5, localized('ma54b183724a4')),
      range('liquid.refractionDetail', 12, 2, 60, 1, localized('m79e32bfa2037')),
    ],
  },
  {
    id: 'futuristic',
    title: localized('m2a556c6a931e'),
    lead: localized('m8e7764edee79'),
    when: (s) => s['skin.name'] === 'futuristic',
    fields: [
      select(
        'future.palette',
        'mission',
        PALETTES.map(([value, en, ru]) => option(value, en, ru)),
        localized('mf4be9796b745'),
      ),
      select(
        'future.frame',
        'corners',
        [
          option('corners', 'Corner brackets', 'Уголки'),
          option('chamfer', 'Chamfer', 'Скос'),
          option('octagon', 'Octagon', 'Восьмиугольник'),
          option('kranox', 'Kranox (asymmetric chamfer)', 'Kranox (асимметричный скос)'),
          option('bracket', 'Side brackets', 'Скобки по бокам'),
          option('lines', 'Top and bottom lines', 'Линии сверху и снизу'),
          option('underline', 'Underline', 'Подчёркивание'),
          option('plain', 'Plain frame', 'Простая рамка'),
          option('custom', 'Each corner on its own', 'Каждый угол по-своему'),
        ],
        localized('ma9d3e70f491f'),
      ),
      range('future.cut', 14, 0, 128, 1, localized('mc7e38e0c8e27'), { unit: 'px' }),
      range('future.corner', 16, 0, 128, 1, localized('m4681c9e2125e'), { unit: 'px' }),
      range('future.border', 1, 0, 12, 0.5, localized('m19156ba5b253'), { unit: 'px' }),
      toggle('future.accentBar', true, localized('m42b43ba1c934')),
      select(
        'future.surface',
        'gradient',
        [
          option('gradient', 'Gradient', 'Градиент'),
          option('glass', 'Glass', 'Стекло'),
          option('frosted', 'Frosted', 'Матовое стекло'),
          option('solid', 'Solid', 'Сплошная'),
          option('steel', 'Brushed steel', 'Шлифованная сталь'),
          option('carbon', 'Carbon fibre', 'Карбон'),
          option('holographic', 'Holographic', 'Голографическая'),
          option('blueprint', 'Blueprint', 'Чертёж'),
        ],
        localized('m2c406035b15f'),
      ),
      range('future.opacity', 0.82, 0, 1, 0.02, localized('mccca7d75c724'), { unit: '%' }),
      range('future.blur', 6, 0, 24, 1, localized('m228fb2e05897'), { unit: 'px' }),
      range('future.glow', 0.5, 0, 4, 0.05, localized('m3c94e643fd27'), { unit: '×' }),
      range('future.frameOpacity', 0.95, 0, 1, 0.01, localized('mab0929e6d50c'), { unit: '%' }),
      range('future.accentLength', 112, 0, 480, 4, localized('m3328d1829d8b'), { unit: 'px' }),
      range('future.accentOffset', 0, 0, 128, 1, localized('me51334ad9dcb'), { unit: 'px' }),
      range('future.accentWidth', -1, -1, 12, 0.5, localized('m838c63ed5f65'), {
        unit: 'px',
        hint: localized('m6cff56a0779a'),
      }),
      range('future.accentMax', 0.8, 0.05, 1, 0.05, localized('md62b4a51121d'), { unit: '%' }),
      select(
        'future.accentStyle',
        'fade',
        [
          option('fade', 'Fades out', 'Угасает'),
          option('solid', 'Solid', 'Сплошной'),
          option('center', 'Bright in the middle', 'Яркий в середине'),
          option('glow', 'Glowing', 'Светящийся'),
        ],
        localized('m14bb55d26a26'),
      ),
      select(
        'future.font',
        'orbitron',
        [
          option('orbitron', 'Orbitron + Electrolize'),
          option('chakra', 'Chakra Petch'),
          option('electrolize', 'Electrolize'),
          option('terminal', 'Share Tech Mono (terminal)', 'Share Tech Mono (терминал)'),
          option('mono', 'Site monospace', 'Моноширинный сайта'),
          option('site', 'Site font', 'Шрифт сайта'),
        ],
        localized('m53687435176a'),
        {
          hint: localized('m9f6015ca463c'),
        },
      ),
      toggle('future.bodyFont', false, localized('mdb23931af84a')),
      select(
        'future.case',
        'upper',
        [option('upper', 'UPPERCASE', 'ПРОПИСНЫЕ'), option('normal', 'As written', 'Как написано')],
        localized('medf384a1ff79'),
      ),
      range('future.spacing', 0.08, 0, 0.4, 0.01, localized('m170ac5ce8200'), { unit: 'em' }),
      select(
        'future.title',
        'bar',
        [
          option('plain', 'Plain', 'Простые'),
          option('bar', 'Accent bar', 'Акцентная планка'),
          option('rule', 'Rule after the title', 'Линия после заголовка'),
          option('slash', '// Slashes', '// Слэши'),
        ],
        localized('m8584ba51b446'),
      ),
      select(
        'future.hover',
        'glow',
        [
          option('glow', 'Glow', 'Свечение'),
          option('lift', 'Lift', 'Подъём'),
          option('sweep', 'Light sweep', 'Пробегающий свет'),
          option('none', 'Nothing', 'Ничего'),
        ],
        localized('m3e3640a0a6cc'),
      ),
      range('future.scanlines', 0, 0, 0.6, 0.02, localized('me346658f17b3'), { unit: '%' }),
    ],
  },
  {
    id: 'corners',
    title: localized('mfd37553d8f9b'),
    lead: localized('me2b80ff7c894'),
    when: (s) => s['skin.name'] === 'futuristic' && s['future.frame'] === 'custom',
    // Levels (issue #47), and the corners of the chosen level.
    levels: LEVEL_IDS.map((id) => ({ id, label: LEVEL_NAMES[id] })),
    tabs: CORNERS.map((c) => ({ id: c, label: CORNER_NAMES[c] })),
    fields: [
      select(
        'corner.edges',
        'faint',
        [
          option('none', 'None', 'Нет'),
          option('faint', 'Faint line', 'Тонкая линия'),
          option('line', 'Bright line', 'Яркая линия'),
        ],
        localized('mff20b6449bb2'),
        { level: 'panel' },
      ),
      select(
        'corner.edgeStyle',
        'solid',
        [
          option('solid', 'Solid', 'Сплошные'),
          option('dashed', 'Dashed', 'Штриховые'),
          option('dotted', 'Dotted', 'Пунктирные'),
        ],
        localized('m4b25549b64db'),
        {
          level: 'panel',
          hint: localized('mc712f6a8699f'),
        },
      ),
      ...SIDE_NAMES.map(([side, en, ru]) =>
        range(
          `corner.${side}Width`,
          -1,
          -1,
          12,
          0.5,
          { en: `${en}: width`, ru: `${ru}: толщина` },
          {
            level: 'panel',
            ...AUTO_WIDTH,
          },
        ),
      ),
      select(
        'corner.layer',
        'top',
        [
          option(
            'top',
            'Above the content (covers the bars of positions)',
            'Над содержимым (закрывает полосы должностей)',
          ),
          option('below', 'Below the content', 'Под содержимым'),
        ],
        localized('m6cbad53a3570'),
        { level: 'panel' },
      ),
      ...CORNERS.flatMap(corner('panel')),
      select(
        'corner.blocks',
        'frame',
        [
          option('frame', 'The corners of the outer panels, smaller', 'Углы внешних панелей, меньше'),
          option('own', 'Corners of their own', 'Свои углы'),
          option('line', 'A plain line', 'Простая линия'),
        ],
        localized('md141e78cac1e'),
        { level: 'block' },
      ),
      range('corner.blockScale', 0.6, 0.1, 1, 0.05, localized('m1b81e8959c3f'), {
        level: 'block',
        unit: '×',
        when: (s) => s['corner.blocks'] !== 'line',
        hint: localized('m6e87e81cb682'),
      }),
      ...levelEdges('block'),
      ...CORNERS.flatMap(corner('block')),
      ...CONTROL_LEVELS.map(controlMode),
      select(
        'corner.controls',
        'frame',
        [
          option('frame', 'The corners of the outer panels, smaller', 'Углы внешних панелей, меньше'),
          option('border', 'Their own border', 'Своя рамка'),
        ],
        localized('m1ae6fafa5d14'),
        { level: CONTROL_LEVELS, when: (s, level) => s[levelKey(level, 'Corners')] === 'same' },
      ),
      range('corner.controlScale', 0.35, 0.1, 1, 0.05, localized('m35f43b9f0714'), {
        level: CONTROL_LEVELS,
        unit: '×',
        when: (s, level) =>
          s[levelKey(level, 'Corners')] === 'own' ||
          (s[levelKey(level, 'Corners')] === 'same' && s['corner.controls'] === 'frame'),
        hint: localized('md8f9fced8a56'),
      }),
      ...CONTROL_LEVELS.flatMap((level) => [...levelEdges(level), ...CORNERS.flatMap(corner(level))]),
      ...LEVEL_IDS.flatMap(fitFields),
    ],
  },
];
