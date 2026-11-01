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
  tl: { en: 'Top left', ru: 'Левый верхний' },
  tr: { en: 'Top right', ru: 'Правый верхний' },
  br: { en: 'Bottom right', ru: 'Правый нижний' },
  bl: { en: 'Bottom left', ru: 'Левый нижний' },
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
  hint: {
    en: '−1 keeps the line width of the skin (bright lines twice as wide).',
    ru: '−1 — толщина линий оформления (яркие линии вдвое толще).',
  },
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
  panel: { en: 'Outer panels', ru: 'Внешние панели' },
  block: { en: 'Inner blocks', ru: 'Внутренние блоки' },
  button: { en: 'Buttons', ru: 'Кнопки' },
  field: { en: 'Fields', ru: 'Поля' },
  tab: { en: 'Tabs', ru: 'Вкладки' },
  chip: { en: 'Chips and tags', ru: 'Метки и теги' },
  menu: { en: 'Menus', ru: 'Меню' },
  table: { en: 'Tables', ru: 'Таблицы' },
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
  hint: {
    en: '−1 is the size of the outer panels in the scale of this level.',
    ru: '−1 — размер внешних панелей в масштабе этого уровня.',
  },
};

/** Shape, line, size and width of one corner of a level: `corner.tlShape`, `corner.buttonTlShape` and so on. */
const corner = (level) => (c) => {
  const [shape, line, size] = level === 'panel' ? CORNER_LOOKS[c] : [...LEVEL_LOOKS[c], -1];
  const at = { tab: c, level, corner: c, when: (s) => ownsCorners(level, s) };
  return [
    select(cornerKey(level, c, 'Shape'), shape, CORNER_SHAPES, { en: 'Shape', ru: 'Форма' }, { ...at, tiles: 'shape' }),
    select(cornerKey(level, c, 'Line'), line, CORNER_LINES, { en: 'Line', ru: 'Линия' }, { ...at, tiles: 'line' }),
    level === 'panel'
      ? range(cornerKey(level, c, 'Size'), size, 0, 128, 1, { en: 'Size', ru: 'Размер' }, { ...at, unit: 'px' })
      : range(cornerKey(level, c, 'Size'), size, -1, 128, 1, { en: 'Size', ru: 'Размер' }, { ...at, ...AUTO_SIZE }),
    range(
      cornerKey(level, c, 'Width'),
      -1,
      -1,
      12,
      0.5,
      { en: 'Line width', ru: 'Толщина линии' },
      { ...at, ...AUTO_WIDTH },
    ),
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
      { en: 'Edges between the corners', ru: 'Края между углами' },
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
      { en: 'Style of the edges', ru: 'Стиль краёв' },
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
          hint: { en: '−1 is the width of the outer panels.', ru: '−1 — толщина внешних панелей.' },
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
            hint: {
              en: 'An element of this level smaller than a minimum or larger than a maximum draws the corners below; 0 is no limit.',
              ru: 'Элемент этого уровня меньше минимума или больше максимума рисует углы, заданные ниже; 0 — без ограничения.',
            },
          }),
        },
      ),
    ),
    range(
      levelKey(level, 'FitScale'),
      0.5,
      0,
      1,
      0.05,
      { en: 'Corners outside the limits', ru: 'Углы вне ограничений' },
      {
        level,
        unit: '×',
        when: (s) => drawsFrame(level, s) && hasFitLimits(level, s),
        hint: {
          en: 'The size of the corners of an element outside the limits; 0 draws no corners, a plain rectangle.',
          ru: 'Размер углов элемента вне ограничений; 0 — без углов, простой прямоугольник.',
        },
      },
    ),
  ];
};

/** How a type of control is drawn: like all controls, with its own corners, or with its own border. */
const controlMode = (level) =>
  select(
    levelKey(level, 'Corners'),
    // Tables kept their border before issue #47.
    level === 'table' ? 'border' : 'same',
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
    column: 2,
    title: { en: 'Skin', ru: 'Оформление' },
    lead: {
      en: 'The look of panels, cards, buttons and headings. Every skin works in the light and the dark theme.',
      ru: 'Вид панелей, карточек, кнопок и заголовков. Каждое оформление работает в светлой и тёмной теме.',
    },
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
        { en: 'Skin', ru: 'Оформление' },
      ),
    ],
  },
  {
    id: 'glass',
    column: 2,
    title: { en: 'Glass', ru: 'Стекло' },
    when: (s) => s['skin.name'] === 'glass',
    fields: [
      range('glass.level', 0.4, 0, 1.25, 0.05, { en: 'Panel opacity', ru: 'Непрозрачность панелей' }, { unit: '%' }),
      range('glass.blur', 3, 0, 30, 1, { en: 'Blur behind panels', ru: 'Размытие за панелями' }, { unit: 'px' }),
      range(
        'glass.bar',
        14,
        0,
        40,
        1,
        { en: 'Blur behind the top bar', ru: 'Размытие за верхней панелью' },
        { unit: 'px' },
      ),
      range('glass.radius', 10, 0, 32, 1, { en: 'Corner radius', ru: 'Скругление углов' }, { unit: 'px' }),
      range(
        'glass.saturation',
        100,
        100,
        250,
        5,
        { en: 'Colour behind panels', ru: 'Насыщенность за панелями' },
        {
          unit: '%',
          hint: { en: 'More makes the background behind the glass more vivid.', ru: 'Больше — фон за стеклом ярче.' },
        },
      ),
      range('glass.edge', 0.14, 0, 0.6, 0.02, { en: 'Borders and lines', ru: 'Рамки и линии' }, { unit: '%' }),
      select(
        'glass.shadow',
        'none',
        [option('none', 'None', 'Нет'), option('soft', 'Soft', 'Мягкая'), option('deep', 'Deep', 'Глубокая')],
        { en: 'Shadow under panels', ru: 'Тень под панелями' },
      ),
      toggle('glass.highlight', false, { en: 'Light on the upper edge', ru: 'Свет на верхней кромке' }),
    ],
  },
  {
    id: 'liquid',
    column: 2,
    title: { en: 'Liquid glass', ru: 'Жидкое стекло' },
    lead: {
      en: 'Thick, bright glass after Apple’s Liquid Glass: strong blur and saturation, light catching the edges, floating capsules.',
      ru: 'Толстое яркое стекло в духе Liquid Glass от Apple: сильное размытие и насыщенность, свет на кромках, парящие капсулы.',
    },
    when: (s) => s['skin.name'] === 'liquid',
    fields: [
      ...MATERIAL_FIELDS,
      range('liquid.blur', 18, 0, 48, 1, { en: 'Blur', ru: 'Размытие' }, { unit: 'px' }),
      range('liquid.saturation', 180, 100, 300, 5, { en: 'Saturation', ru: 'Насыщенность' }, { unit: '%' }),
      range('liquid.brightness', 108, 70, 150, 1, { en: 'Brightness', ru: 'Яркость' }, { unit: '%' }),
      select(
        'liquid.tint',
        'theme',
        [
          option('theme', 'Theme colour', 'Цвет темы'),
          option('clear', 'Clear (white)', 'Прозрачное (белое)'),
          option('accent', 'Accent', 'Акцент'),
          option('smoke', 'Smoke (black)', 'Дымчатое (чёрное)'),
        ],
        { en: 'Tint', ru: 'Оттенок' },
      ),
      range('liquid.tintLevel', 0.22, 0, 1, 0.01, { en: 'Tint strength', ru: 'Сила оттенка' }, { unit: '%' }),
      range('liquid.radius', 24, 0, 48, 1, { en: 'Corner radius', ru: 'Скругление углов' }, { unit: 'px' }),
      range('liquid.highlight', 0.55, 0, 1, 0.05, { en: 'Edge highlight', ru: 'Блик на кромке' }, { unit: '%' }),
      range('liquid.edge', 0.22, 0, 1, 0.02, { en: 'Border', ru: 'Рамка' }, { unit: '%' }),
      range(
        'liquid.depth',
        0.35,
        0,
        1,
        0.05,
        { en: 'Inner glow (thickness)', ru: 'Внутреннее свечение (толщина)' },
        { unit: '%' },
      ),
      range('liquid.shadow', 0.5, 0, 1, 0.05, { en: 'Shadow', ru: 'Тень' }, { unit: '%' }),
      toggle('liquid.sheen', true, {
        en: 'Light sweeps over a panel on hover',
        ru: 'Блик пробегает по панели при наведении',
      }),
      toggle('liquid.float', true, { en: 'Floating capsule top bar', ru: 'Парящая верхняя панель-капсула' }),
      toggle('liquid.pills', true, { en: 'Capsule buttons', ru: 'Кнопки-капсулы' }),
      toggle('liquid.refraction', false, {
        en: 'Refraction (bends the background; Chrome and Edge only)',
        ru: 'Преломление (искривляет фон; только Chrome и Edge)',
      }),
      range('liquid.refractionScale', 40, 0, 150, 5, { en: 'Refraction strength', ru: 'Сила преломления' }),
      range('liquid.refractionDetail', 12, 2, 60, 1, { en: 'Refraction ripples', ru: 'Рябь преломления' }),
    ],
  },
  {
    id: 'futuristic',
    column: 2,
    title: { en: 'Futuristic', ru: 'Футуристичное' },
    lead: {
      en: 'Angular HUD panels in the style of konard/immortality: thin neon frames with cut corners, glowing accents, technical fonts.',
      ru: 'Угловатые HUD-панели в стиле konard/immortality: тонкие неоновые рамки со срезанными углами, светящиеся акценты, технические шрифты.',
    },
    when: (s) => s['skin.name'] === 'futuristic',
    fields: [
      select(
        'future.palette',
        'mission',
        PALETTES.map(([value, en, ru]) => option(value, en, ru)),
        { en: 'Palette', ru: 'Палитра' },
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
        { en: 'Frame', ru: 'Рамка' },
      ),
      range('future.cut', 14, 0, 128, 1, { en: 'Cut of the corners', ru: 'Срез углов' }, { unit: 'px' }),
      range('future.corner', 16, 0, 128, 1, { en: 'Length of brackets', ru: 'Длина уголков' }, { unit: 'px' }),
      range('future.border', 1, 0, 12, 0.5, { en: 'Line width', ru: 'Толщина линий' }, { unit: 'px' }),
      toggle('future.accentBar', true, { en: 'Accent bar on panels', ru: 'Акцентная планка на панелях' }),
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
        { en: 'Surface', ru: 'Поверхность' },
      ),
      range(
        'future.opacity',
        0.82,
        0,
        1,
        0.02,
        { en: 'Surface opacity', ru: 'Непрозрачность поверхности' },
        { unit: '%' },
      ),
      range('future.blur', 6, 0, 24, 1, { en: 'Blur behind panels', ru: 'Размытие за панелями' }, { unit: 'px' }),
      range('future.glow', 0.5, 0, 4, 0.05, { en: 'Glow', ru: 'Свечение' }, { unit: '×' }),
      range('future.frameOpacity', 0.95, 0, 1, 0.01, { en: 'Frame intensity', ru: 'Яркость рамки' }, { unit: '%' }),
      range('future.accentLength', 112, 0, 480, 4, { en: 'Accent length', ru: 'Длина акцента' }, { unit: 'px' }),
      range('future.accentOffset', 0, 0, 128, 1, { en: 'Accent offset', ru: 'Отступ акцента' }, { unit: 'px' }),
      range(
        'future.accentWidth',
        -1,
        -1,
        12,
        0.5,
        { en: 'Accent width (thickness)', ru: 'Толщина акцента' },
        {
          unit: 'px',
          hint: {
            en: '−1 follows the accent strip width of the borders section.',
            ru: '−1 — как толщина акцентной полосы в разделе рамок.',
          },
        },
      ),
      range(
        'future.accentMax',
        0.8,
        0.05,
        1,
        0.05,
        { en: 'Longest accent (share of the panel)', ru: 'Наибольшая длина акцента (доля панели)' },
        { unit: '%' },
      ),
      select(
        'future.accentStyle',
        'fade',
        [
          option('fade', 'Fades out', 'Угасает'),
          option('solid', 'Solid', 'Сплошной'),
          option('center', 'Bright in the middle', 'Яркий в середине'),
          option('glow', 'Glowing', 'Светящийся'),
        ],
        { en: 'Accent style', ru: 'Вид акцента' },
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
        { en: 'Font of headings', ru: 'Шрифт заголовков' },
        {
          hint: {
            en: 'These fonts have Latin letters only; Russian text keeps the system font.',
            ru: 'В этих шрифтах только латиница; русский текст остаётся системным шрифтом.',
          },
        },
      ),
      toggle('future.bodyFont', false, { en: 'Use it for all text', ru: 'Использовать для всего текста' }),
      select(
        'future.case',
        'upper',
        [option('upper', 'UPPERCASE', 'ПРОПИСНЫЕ'), option('normal', 'As written', 'Как написано')],
        { en: 'Headings', ru: 'Заголовки' },
      ),
      range(
        'future.spacing',
        0.08,
        0,
        0.4,
        0.01,
        { en: 'Letter spacing of headings', ru: 'Разрядка заголовков' },
        { unit: 'em' },
      ),
      select(
        'future.title',
        'bar',
        [
          option('plain', 'Plain', 'Простые'),
          option('bar', 'Accent bar', 'Акцентная планка'),
          option('rule', 'Rule after the title', 'Линия после заголовка'),
          option('slash', '// Slashes', '// Слэши'),
        ],
        { en: 'Section titles', ru: 'Заголовки разделов' },
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
        { en: 'Panels on hover', ru: 'Панели при наведении' },
      ),
      range('future.scanlines', 0, 0, 0.6, 0.02, { en: 'Scanlines', ru: 'Линии развёртки' }, { unit: '%' }),
    ],
  },
  {
    id: 'corners',
    column: 2,
    title: { en: 'Corners of the frame', ru: 'Углы рамки' },
    lead: {
      en: 'Every corner of the panels has its own shape, size and line; the tiles show how the corner will look. The bracket length and the line width are the ones of the futuristic skin. Inner blocks and every type of control draw the corners of the outer panels in their scale, or corners of their own.',
      ru: 'У каждого угла панелей свои форма, размер и линия; плитки показывают, как будет выглядеть угол. Длина уголков и толщина линий берутся из футуристичного оформления. Внутренние блоки и каждый тип элементов рисуют углы внешних панелей в своём масштабе или свои углы.',
    },
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
        { en: 'Edges between the corners', ru: 'Края между углами' },
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
        { en: 'Style of the edges', ru: 'Стиль краёв' },
        {
          level: 'panel',
          hint: {
            en: 'Controls follow the border style of the controls, or the style of their own corners.',
            ru: 'Элементы следуют стилю рамки элементов или стилю своих углов.',
          },
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
        { en: 'Corners and edges', ru: 'Углы и края' },
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
        { en: 'Inner blocks', ru: 'Внутренние блоки' },
        { level: 'block' },
      ),
      range(
        'corner.blockScale',
        0.6,
        0.1,
        1,
        0.05,
        { en: 'Corners of inner blocks', ru: 'Углы внутренних блоков' },
        {
          level: 'block',
          unit: '×',
          when: (s) => s['corner.blocks'] !== 'line',
          hint: {
            en: 'The size of the corners of the outer panels in inner blocks.',
            ru: 'Размер углов внешних панелей во внутренних блоках.',
          },
        },
      ),
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
        { en: 'All controls', ru: 'Все элементы' },
        { level: CONTROL_LEVELS, when: (s, level) => s[levelKey(level, 'Corners')] === 'same' },
      ),
      range(
        'corner.controlScale',
        0.35,
        0.1,
        1,
        0.05,
        { en: 'Corners of controls', ru: 'Углы элементов' },
        {
          level: CONTROL_LEVELS,
          unit: '×',
          when: (s, level) =>
            s[levelKey(level, 'Corners')] === 'own' ||
            (s[levelKey(level, 'Corners')] === 'same' && s['corner.controls'] === 'frame'),
          hint: {
            en: 'The size of the corners of the outer panels in every control.',
            ru: 'Размер углов внешних панелей во всех элементах.',
          },
        },
      ),
      ...CONTROL_LEVELS.flatMap((level) => [...levelEdges(level), ...CORNERS.flatMap(corner(level))]),
      ...LEVEL_IDS.flatMap(fitFields),
    ],
  },
];
