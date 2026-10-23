// More background layers (issue #15): up to four layers of stars drawn on top
// of each other, each with its own shape, size, colours, glow, twinkling and
// motion, and beams of light that run along the grid lines. All of them are
// drawn by scripts (src/visuals/stars.js and beams.js), so apart from their
// strength they do not become CSS variables (`css: false`). They are off by
// default and their code is loaded only when one of them is switched on, so
// the default page stays as light as before.
import { color, option, range, select, toggle } from './fields';

export const STAR_LAYERS = [1, 2, 3, 4];

export const STAR_SHAPES = [
  option('dot', 'Dot', 'Точка'),
  option('soft', 'Soft dot', 'Мягкая точка'),
  option('ring', 'Ring', 'Кольцо'),
  option('square', 'Square', 'Квадрат'),
  option('diamond', 'Diamond', 'Ромб'),
  option('cross', 'Cross +', 'Крест +'),
  option('x', 'Cross ×', 'Крест ×'),
  option('star4', 'Four-pointed star', 'Четырёхлучевая звезда'),
  option('star5', 'Five-pointed star', 'Пятиконечная звезда'),
  option('star6', 'Six-pointed star', 'Шестиконечная звезда'),
  option('sparkle', 'Sparkle', 'Искра'),
  option('flare', 'Flare (telescope spikes)', 'Блик (лучи телескопа)'),
];

/**
 * The defaults of the four layers: fine dust, bright sparkles, a warp tunnel
 * and slowly falling crosses. Every layer is off until switched on.
 */
const LOOKS = {
  1: { count: 500, shape: 'dot', size: 1, sizeSpread: 0.6, color: '#cfe3ff', glow: 0, motion: 'drift', speed: 4 },
  2: { count: 40, shape: 'sparkle', size: 6, sizeSpread: 0.5, color: '#ffffff', glow: 8, motion: 'still', speed: 0 },
  3: { count: 300, shape: 'soft', size: 2, sizeSpread: 0.3, color: '#bfe9ff', glow: 4, motion: 'warp', speed: 80 },
  4: { count: 60, shape: 'cross', size: 4, sizeSpread: 0.4, color: '#7efcf6', glow: 6, motion: 'drift', speed: 12 },
};

/** The settings of one star layer, `stars1.count` and so on; `n` is 1…4. */
function starLayer(n) {
  const look = LOOKS[n];
  const key = (name) => `stars${n}.${name}`;
  const tab = `stars${n}`;
  const extra = (more = {}) => ({ tab, css: false, ...more });
  const moving = (s) => s[key('motion')] !== 'still';
  return [
    toggle(key('on'), false, { en: 'Show this layer', ru: 'Показывать этот слой' }, extra()),
    range(
      key('count'),
      look.count,
      0,
      3000,
      10,
      { en: 'Number of stars', ru: 'Количество звёзд' },
      extra({
        hint: {
          en: 'On a 1920 × 1080 screen; smaller screens get fewer.',
          ru: 'На экране 1920 × 1080; на меньших экранах — меньше.',
        },
      }),
    ),
    select(key('shape'), look.shape, STAR_SHAPES, { en: 'Shape', ru: 'Форма' }, extra()),
    range(key('size'), look.size, 0.5, 24, 0.5, { en: 'Size', ru: 'Размер' }, extra({ unit: 'px' })),
    range(
      key('sizeSpread'),
      look.sizeSpread,
      0,
      1,
      0.05,
      { en: 'Size variety', ru: 'Разброс размера' },
      extra({ unit: '%' }),
    ),
    color(key('color'), look.color, { en: 'Colour', ru: 'Цвет' }, extra()),
    range(key('hueSpread'), 0, 0, 180, 5, { en: 'Colour variety', ru: 'Разброс цвета' }, extra({ unit: '°' })),
    range(key('brightness'), 0.9, 0, 1, 0.05, { en: 'Brightness', ru: 'Яркость' }, extra({ unit: '%' })),
    range(key('glow'), look.glow, 0, 40, 1, { en: 'Glow', ru: 'Свечение' }, extra({ unit: 'px' })),
    color(key('glowColor'), '#7efcf6', { en: 'Glow colour', ru: 'Цвет свечения' }, extra()),
    range(key('twinkle'), 1, 0, 5, 0.1, { en: 'Twinkling speed', ru: 'Скорость мерцания' }, extra({ unit: '×' })),
    range(
      key('twinkleDepth'),
      0.5,
      0,
      1,
      0.05,
      { en: 'Twinkling depth', ru: 'Глубина мерцания' },
      extra({ unit: '%' }),
    ),
    range(key('rotation'), 0, 0, 180, 5, { en: 'Rotation', ru: 'Поворот' }, extra({ unit: '°' })),
    range(key('spin'), 0, -180, 180, 5, { en: 'Spin', ru: 'Вращение' }, extra({ unit: '°/s' })),
    select(
      key('motion'),
      look.motion,
      [
        option('still', 'Still', 'Неподвижно'),
        option('drift', 'Drift in one direction', 'Плыть в одну сторону'),
        option('warp', 'Fly towards you (warp)', 'Лететь навстречу (варп)'),
        option('orbit', 'Turn round the centre', 'Вращаться вокруг центра'),
      ],
      { en: 'Motion', ru: 'Движение' },
      extra(),
    ),
    range(
      key('direction'),
      90,
      0,
      360,
      15,
      { en: 'Direction', ru: 'Направление' },
      extra({
        unit: '°',
        when: (s) => s[key('motion')] === 'drift',
        hint: { en: '0° is to the right, 90° down.', ru: '0° — вправо, 90° — вниз.' },
      }),
    ),
    range(key('speed'), look.speed, 0, 400, 1, { en: 'Speed', ru: 'Скорость' }, extra({ unit: 'px/s', when: moving })),
    range(
      key('streak'),
      0,
      0,
      20,
      0.5,
      { en: 'Trails along the motion', ru: 'Шлейф по движению' },
      extra({ unit: '×', when: moving }),
    ),
    select(
      key('blend'),
      'add',
      [
        option('normal', 'Normal', 'Обычное'),
        option('add', 'Add light', 'Сложение света'),
        option('screen', 'Screen', 'Осветление'),
      ],
      { en: 'Blending', ru: 'Смешивание' },
      extra(),
    ),
  ];
}

/** Names of the settings of a star layer: `on`, `count`, `shape`… */
export const STAR_KEYS = starLayer(1).map((field) => field.key.split('.')[1]);

export const LAYER_SECTIONS = [
  {
    id: 'stars',
    title: { en: 'Star layers', ru: 'Слои звёзд' },
    lead: {
      en: 'Up to four layers of stars on top of the universe and below the grid. Each layer has its own shape, colours, glow and motion; together they can draw dust, sparkles, a warp tunnel or a slowly turning sky.',
      ru: 'До четырёх слоёв звёзд поверх вселенной и под сеткой. У каждого слоя свои форма, цвета, свечение и движение; вместе они рисуют пыль, искры, варп-туннель или медленно вращающееся небо.',
    },
    tabs: STAR_LAYERS.map((n) => ({
      id: `stars${n}`,
      on: `stars${n}.on`,
      label: { en: `Layer ${n}`, ru: `Слой ${n}` },
    })),
    fields: [
      range('stars.level', 1, 0, 2, 0.05, { en: 'Strength of all layers', ru: 'Яркость всех слоёв' }, { unit: '×' }),
      range('stars.fps', 30, 5, 60, 1, { en: 'Frames per second', ru: 'Кадров в секунду' }, { css: false }),
      ...STAR_LAYERS.flatMap(starLayer),
    ],
  },
  {
    id: 'beams',
    column: 2,
    title: { en: 'Beams', ru: 'Лучи' },
    lead: {
      en: 'Light running along the grid lines, across or down the screen.',
      ru: 'Свет, бегущий по линиям сетки поперёк или вдоль экрана.',
    },
    fields: [
      toggle('beams.on', false, { en: 'Show beams', ru: 'Показывать лучи' }),
      range('beams.level', 1, 0, 2, 0.05, { en: 'Strength', ru: 'Яркость' }, { unit: '×' }),
      select(
        'beams.direction',
        'both',
        [
          option('horizontal', 'Across (horizontal)', 'Поперёк (горизонтально)'),
          option('vertical', 'Down (vertical)', 'Вдоль (вертикально)'),
          option('both', 'Both', 'Оба'),
        ],
        { en: 'Direction', ru: 'Направление' },
        { css: false },
      ),
      select(
        'beams.style',
        'comet',
        [
          option('comet', 'Comet with a tail', 'Комета с хвостом'),
          option('line', 'Segment', 'Отрезок'),
          option('pulse', 'Pulse (a bright dot)', 'Импульс (яркая точка)'),
          option('scan', 'Scan line over the screen', 'Линия развёртки через экран'),
        ],
        { en: 'Look', ru: 'Вид' },
        { css: false },
      ),
      range('beams.count', 6, 1, 40, 1, { en: 'Beams at a time', ru: 'Лучей одновременно' }, { css: false }),
      range('beams.speed', 240, 20, 1500, 10, { en: 'Speed', ru: 'Скорость' }, { unit: 'px/s', css: false }),
      range('beams.length', 160, 10, 800, 10, { en: 'Length', ru: 'Длина' }, { unit: 'px', css: false }),
      range('beams.width', 1.5, 0.5, 8, 0.5, { en: 'Width', ru: 'Толщина' }, { unit: 'px', css: false }),
      color('beams.color', '#7efcf6', { en: 'Colour', ru: 'Цвет' }, { css: false }),
      range('beams.glow', 8, 0, 40, 1, { en: 'Glow', ru: 'Свечение' }, { unit: 'px', css: false }),
      range(
        'beams.pause',
        1.5,
        0,
        10,
        0.5,
        { en: 'Pause before a beam runs again', ru: 'Пауза перед новым запуском луча' },
        { unit: 's', css: false },
      ),
      toggle('beams.snap', true, { en: 'Run along the grid lines', ru: 'Бежать по линиям сетки' }, { css: false }),
      toggle('beams.both', true, { en: 'Both ways', ru: 'В обе стороны' }, { css: false }),
    ],
  },
];
