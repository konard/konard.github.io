// Everything on the site that can be configured (issue #13): the background
// animation, the skin of the interface and the notation of the links theory.
// The defaults are the look of the site before settings existed, so a visitor
// who never opens /settings/ sees exactly that. The settings page is built
// from this list, and RULES (defaults, limits and choices) also checks values
// read from localStorage, both here and in the script that applies the skin
// before the first paint (see SETTINGS_SCRIPT in vite.config.js).
//
// Numbers become CSS variables (`liquid.blur` → `--liquid-blur: 18px`),
// choices and switches become attributes of <html> (`skin.name` →
// `data-skin-name="liquid"`), colours become CSS variables; see apply.js.

const range = (key, d, min, max, step, label, extra = {}) => ({
  key,
  type: 'range',
  d,
  min,
  max,
  step,
  label,
  ...extra,
});
const toggle = (key, d, label, extra = {}) => ({ key, type: 'toggle', d, label, ...extra });
const select = (key, d, options, label, extra = {}) => ({ key, type: 'select', d, options, label, ...extra });
const color = (key, d, label, extra = {}) => ({ key, type: 'color', d, label, ...extra });
const option = (value, en, ru = en) => ({ value, label: { en, ru } });

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

/** Sections of the settings page; `when(settings)` hides a section that does not apply. */
export const SECTIONS = [
  {
    id: 'motion',
    title: { en: 'Background animation', ru: 'Анимация фона' },
    lead: {
      en: 'The background has three layers: the universe (a nebula with stars), the grid and the rain of link networks. Every change is applied at once, behind this page.',
      ru: 'У фона три слоя: вселенная (туманность со звёздами), сетка и дождь из сетей связей. Каждое изменение применяется сразу, за этой страницей.',
    },
    fields: [
      select(
        'motion.mode',
        'auto',
        [
          option('auto', 'As the system prefers', 'Как в настройках системы'),
          option('on', 'Always move', 'Всегда двигать'),
          option('off', 'Never move', 'Никогда не двигать'),
        ],
        { en: 'Motion', ru: 'Движение' },
        {
          hint: {
            en: 'By default the background stands still when the system asks for reduced motion.',
            ru: 'По умолчанию фон не двигается, если система просит уменьшить движение.',
          },
        },
      ),
    ],
  },
  {
    id: 'nebula',
    title: { en: 'Universe', ru: 'Вселенная' },
    fields: [
      toggle('nebula.on', true, { en: 'Show the universe', ru: 'Показывать вселенную' }),
      range('nebula.level', 1, 0, 1, 0.05, { en: 'Strength', ru: 'Яркость слоя' }, { unit: '%' }),
      range('nebula.speed', 1, 0, 8, 0.1, { en: 'Speed', ru: 'Скорость' }, { unit: '×' }),
      range('nebula.gas', 1, 0, 2.5, 0.05, { en: 'Nebula brightness', ru: 'Яркость туманности' }, { unit: '×' }),
      range('nebula.hue', 0, -180, 180, 5, { en: 'Hue shift', ru: 'Сдвиг оттенка' }, { unit: '°' }),
      range('nebula.stars', 1, 0, 4, 0.1, { en: 'Number of stars', ru: 'Количество звёзд' }, { unit: '×' }),
      range('nebula.starBrightness', 1, 0, 2.5, 0.05, { en: 'Star brightness', ru: 'Яркость звёзд' }, { unit: '×' }),
      range('nebula.twinkle', 1, 0, 5, 0.1, { en: 'Twinkling speed', ru: 'Скорость мерцания' }, { unit: '×' }),
      range('nebula.vignette', 0.5, 0, 1, 0.05, { en: 'Darker edges', ru: 'Затемнение краёв' }, { unit: '%' }),
      range(
        'nebula.resolution',
        0.6,
        0.2,
        1,
        0.05,
        { en: 'Resolution', ru: 'Разрешение' },
        {
          unit: '%',
          hint: {
            en: 'Lower is softer and lighter for the graphics card.',
            ru: 'Ниже — мягче и легче для видеокарты.',
          },
        },
      ),
      range('nebula.fps', 24, 5, 60, 1, { en: 'Frames per second', ru: 'Кадров в секунду' }),
    ],
  },
  {
    id: 'grid',
    title: { en: 'Grid', ru: 'Сетка' },
    fields: [
      toggle('grid.on', true, { en: 'Show the grid', ru: 'Показывать сетку' }),
      range('grid.level', 1, 0, 4, 0.1, { en: 'Strength', ru: 'Яркость' }, { unit: '×' }),
      range(
        'grid.size',
        64,
        32,
        128,
        8,
        { en: 'Cell size', ru: 'Размер клетки' },
        {
          unit: 'px',
          hint: {
            en: 'The rain puts two symbols into every cell, so this is also the size of the symbols.',
            ru: 'Дождь кладёт в каждую клетку два символа, так что это ещё и размер символов.',
          },
        },
      ),
      range(
        'grid.period',
        24,
        0,
        120,
        1,
        { en: 'One cell down every', ru: 'Сдвиг на клетку каждые' },
        { unit: 's', hint: { en: '0 stops the drift.', ru: '0 останавливает сдвиг.' } },
      ),
      toggle('grid.fade', true, { en: 'Fade towards the edges', ru: 'Растворять к краям' }),
    ],
  },
  {
    id: 'rain',
    title: { en: 'Rain of link networks', ru: 'Дождь из сетей связей' },
    fields: [
      toggle('rain.on', true, { en: 'Show the rain', ru: 'Показывать дождь' }),
      range('rain.level', 1, 0, 2, 0.05, { en: 'Strength', ru: 'Яркость' }, { unit: '×' }),
      toggle('rain.dim', true, {
        en: 'Quieter behind the text',
        ru: 'Тише за текстом',
      }),
      range(
        'rain.step',
        75,
        20,
        400,
        5,
        { en: 'Step', ru: 'Шаг' },
        { unit: 'ms', hint: { en: 'Less is faster.', ru: 'Меньше — быстрее.' } },
      ),
      range('rain.speeds', 3, 1, 8, 1, { en: 'Slowest column, in steps', ru: 'Самая медленная колонка, шагов' }),
      range('rain.density', 1, 0.05, 1, 0.05, { en: 'Columns with rain', ru: 'Колонки с дождём' }, { unit: '%' }),
      range('rain.restart', 0.05, 0.005, 0.5, 0.005, {
        en: 'Chance to start again after leaving the screen',
        ru: 'Вероятность начать снова за краем экрана',
      }),
      range(
        'rain.fade',
        0.085,
        0.01,
        0.5,
        0.005,
        { en: 'Trail fading per step', ru: 'Угасание следа за шаг' },
        { hint: { en: 'Less leaves longer trails.', ru: 'Меньше — длиннее след.' } },
      ),
      range('rain.lineWidth', 5.5, 1, 12, 0.5, { en: 'Line width', ru: 'Толщина линий' }),
      range(
        'rain.glow',
        8,
        0,
        40,
        1,
        { en: 'Glow of the falling symbol', ru: 'Свечение падающего символа' },
        { unit: 'px' },
      ),
      color('rain.glowColor', '#f0fffb', { en: 'Glow colour', ru: 'Цвет свечения' }),
      range('rain.minLinks', 1, 1, 4, 1, { en: 'Fewest links in a symbol', ru: 'Меньше всего связей в символе' }),
      range('rain.maxLinks', 4, 1, 4, 1, { en: 'Most links in a symbol', ru: 'Больше всего связей в символе' }),
      toggle('rain.real', false, {
        en: 'Only real references (no references to 0)',
        ru: 'Только настоящие ссылки (без ссылок на 0)',
      }),
    ],
  },
  {
    id: 'skin',
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
    title: { en: 'Glass', ru: 'Стекло' },
    when: (s) => s['skin.name'] === 'glass',
    fields: [
      range('glass.level', 1, 0, 1.25, 0.05, { en: 'Panel opacity', ru: 'Непрозрачность панелей' }, { unit: '%' }),
      range('glass.blur', 6, 0, 30, 1, { en: 'Blur behind panels', ru: 'Размытие за панелями' }, { unit: 'px' }),
      range(
        'glass.bar',
        14,
        0,
        40,
        1,
        { en: 'Blur behind the top bar', ru: 'Размытие за верхней панелью' },
        { unit: 'px' },
      ),
      range('glass.radius', 14, 0, 32, 1, { en: 'Corner radius', ru: 'Скругление углов' }, { unit: 'px' }),
    ],
  },
  {
    id: 'liquid',
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
    id: 'theory',
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
