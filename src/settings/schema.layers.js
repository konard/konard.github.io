import { localized } from '../i18n/localizer.js';
// More background layers (issue #15): up to four layers of stars drawn on top
// of each other, each with its own shape, size, colours, glow, twinkling and
// motion, and beams of light that run along the grid lines. All of them are
// drawn by scripts (src/visuals/stars.js and beams.js), so apart from their
// strength they do not become CSS variables (`css: false`). They are off by
// default and their code is loaded only when one of them is switched on, so
// the default page stays as light as before.
import { color, option, range, select, toggle } from './fields.js';

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
    toggle(key('on'), false, localized('mf2aa829ca799'), extra()),
    range(
      key('count'),
      look.count,
      0,
      3000,
      10,
      localized('mfbc753d141b3'),
      extra({
        hint: localized('m280d5c47a817'),
      }),
    ),
    select(key('shape'), look.shape, STAR_SHAPES, localized('m3ed59e8dd46d'), extra()),
    range(key('size'), look.size, 0.5, 24, 0.5, localized('m7c201b4a9144'), extra({ unit: 'px' })),
    range(key('sizeSpread'), look.sizeSpread, 0, 1, 0.05, localized('m35ff4549a2bf'), extra({ unit: '%' })),
    color(key('color'), look.color, localized('m9ffc82435487'), extra()),
    range(key('hueSpread'), 0, 0, 180, 5, localized('m8791e7457c69'), extra({ unit: '°' })),
    range(key('brightness'), 0.9, 0, 1, 0.05, localized('mcc4388b6594d'), extra({ unit: '%' })),
    range(key('glow'), look.glow, 0, 40, 1, localized('m3c94e643fd27'), extra({ unit: 'px' })),
    color(key('glowColor'), '#7efcf6', localized('m505c84894a50'), extra()),
    range(key('twinkle'), 1, 0, 5, 0.1, localized('m9f39f90e5f65'), extra({ unit: '×' })),
    range(key('twinkleDepth'), 0.5, 0, 1, 0.05, localized('mb6a0360ac702'), extra({ unit: '%' })),
    range(key('rotation'), 0, 0, 180, 5, localized('m03ef23723db1'), extra({ unit: '°' })),
    range(key('spin'), 0, -180, 180, 5, localized('m4a701fc91bb3'), extra({ unit: '°/s' })),
    select(
      key('motion'),
      look.motion,
      [
        option('still', 'Still', 'Неподвижно'),
        option('drift', 'Drift in one direction', 'Плыть в одну сторону'),
        option('warp', 'Fly towards you (warp)', 'Лететь навстречу (варп)'),
        option('orbit', 'Turn round the centre', 'Вращаться вокруг центра'),
      ],
      localized('m8c0340b2770e'),
      extra(),
    ),
    range(
      key('direction'),
      90,
      0,
      360,
      15,
      localized('mc190e21c579f'),
      extra({
        unit: '°',
        when: (s) => s[key('motion')] === 'drift',
        hint: localized('m4f34bb23793b'),
      }),
    ),
    range(key('speed'), look.speed, 0, 400, 1, localized('mc594ab112f3e'), extra({ unit: 'px/s', when: moving })),
    range(key('streak'), 0, 0, 20, 0.5, localized('m132b154c625d'), extra({ unit: '×', when: moving })),
    select(
      key('blend'),
      'add',
      [
        option('normal', 'Normal', 'Обычное'),
        option('add', 'Add light', 'Сложение света'),
        option('screen', 'Screen', 'Осветление'),
      ],
      localized('m75a1814b48c2'),
      extra(),
    ),
  ];
}

/** Names of the settings of a star layer: `on`, `count`, `shape`… */
export const STAR_KEYS = starLayer(1).map((field) => field.key.split('.')[1]);

export const LAYER_SECTIONS = [
  {
    id: 'stars',
    title: localized('m455f9f00bc61'),
    lead: localized('m1f59a8fa49d4'),
    tabs: STAR_LAYERS.map((n) => ({
      id: `stars${n}`,
      on: `stars${n}.on`,
      label: { en: `Layer ${n}`, ru: `Слой ${n}` },
    })),
    fields: [
      range('stars.level', 1, 0, 2, 0.05, localized('me15fabf2c566'), { unit: '×' }),
      range('stars.fps', 30, 5, 60, 1, localized('m572d019babef'), { css: false }),
      ...STAR_LAYERS.flatMap(starLayer),
    ],
  },
  {
    id: 'beams',
    title: localized('me526861c64c2'),
    lead: localized('m31eb3347fb1d'),
    fields: [
      toggle('beams.on', false, localized('m22bb6d128aa4')),
      range('beams.level', 1, 0, 2, 0.05, localized('mde792cabc72d'), { unit: '×' }),
      select(
        'beams.direction',
        'both',
        [
          option('horizontal', 'Across (horizontal)', 'Поперёк (горизонтально)'),
          option('vertical', 'Down (vertical)', 'Вдоль (вертикально)'),
          option('both', 'Both', 'Оба'),
        ],
        localized('mc190e21c579f'),
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
        localized('m693e4d861656'),
        { css: false },
      ),
      range('beams.count', 6, 1, 40, 1, localized('mc6dda8e59b4b'), { css: false }),
      range('beams.speed', 240, 20, 1500, 10, localized('mc594ab112f3e'), { unit: 'px/s', css: false }),
      range('beams.length', 160, 10, 800, 10, localized('ma2ce12ec5b7b'), { unit: 'px', css: false }),
      range('beams.width', 1.5, 0.5, 8, 0.5, localized('md735863cf7e5'), { unit: 'px', css: false }),
      color('beams.color', '#7efcf6', localized('m9ffc82435487'), { css: false }),
      range('beams.glow', 8, 0, 40, 1, localized('m3c94e643fd27'), { unit: 'px', css: false }),
      range('beams.pause', 1.5, 0, 10, 0.5, localized('m966b064cb474'), { unit: 's', css: false }),
      toggle('beams.snap', true, localized('m6b994d713152'), { css: false }),
      toggle('beams.both', true, localized('mb87e547d1ff1'), { css: false }),
    ],
  },
];
