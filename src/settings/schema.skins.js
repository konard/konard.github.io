// Sections of the skins (issues #13 and #15): the choice of a skin and the
// options of glass, liquid glass and the futuristic HUD; see schema.js.
import { CORNERS } from '../skins.frames.js';
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

/** Shape, line and size of one corner of the custom frame: `corner.tlShape` and so on. */
const corner = (c) => {
  const [shape, line, size] = CORNER_LOOKS[c];
  return [
    select(`corner.${c}Shape`, shape, CORNER_SHAPES, { en: 'Shape', ru: 'Форма' }, { tab: c, tiles: 'shape' }),
    select(`corner.${c}Line`, line, CORNER_LINES, { en: 'Line', ru: 'Линия' }, { tab: c, tiles: 'line', corner: c }),
    range(`corner.${c}Size`, size, 2, 64, 1, { en: 'Size', ru: 'Размер' }, { tab: c, unit: 'px' }),
  ];
};

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
      range('liquid.tintLevel', 0.22, 0, 0.9, 0.01, { en: 'Tint strength', ru: 'Сила оттенка' }, { unit: '%' }),
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
      range('future.cut', 14, 0, 40, 1, { en: 'Cut of the corners', ru: 'Срез углов' }, { unit: 'px' }),
      range('future.corner', 16, 4, 48, 1, { en: 'Length of brackets', ru: 'Длина уголков' }, { unit: 'px' }),
      range('future.border', 1, 0, 4, 0.5, { en: 'Line width', ru: 'Толщина линий' }, { unit: 'px' }),
      toggle('future.accentBar', true, { en: 'Accent bar on panels', ru: 'Акцентная планка на панелях' }),
      select(
        'future.surface',
        'gradient',
        [
          option('gradient', 'Gradient', 'Градиент'),
          option('glass', 'Glass', 'Стекло'),
          option('frosted', 'Frosted', 'Матовое стекло'),
          option('solid', 'Solid', 'Сплошная'),
          option('transparent', 'Transparent', 'Прозрачная'),
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
      range('future.glow', 0.5, 0, 1.5, 0.05, { en: 'Glow', ru: 'Свечение' }, { unit: '%' }),
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
      range('future.scanlines', 0.12, 0, 0.6, 0.02, { en: 'Scanlines', ru: 'Линии развёртки' }, { unit: '%' }),
    ],
  },
  {
    id: 'corners',
    column: 2,
    title: { en: 'Corners of the frame', ru: 'Углы рамки' },
    lead: {
      en: 'Every corner of the panels has its own shape, size and line; the tiles show how the corner will look. The bracket length and the line width are the ones of the futuristic skin.',
      ru: 'У каждого угла панелей свои форма, размер и линия; плитки показывают, как будет выглядеть угол. Длина уголков и толщина линий берутся из футуристичного оформления.',
    },
    when: (s) => s['skin.name'] === 'futuristic' && s['future.frame'] === 'custom',
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
      ),
      ...CORNERS.flatMap(corner),
    ],
  },
];
