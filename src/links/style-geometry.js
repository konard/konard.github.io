import { option, range, select, toggle } from '../settings/fields';
import { MARKERS, SHAPE } from './glyph';

const names = {
  bar: ['Bar', 'Черта'],
  arrow: ['Arrow', 'Стрелка'],
  triangle: ['Triangle', 'Треугольник'],
  tail: ['Tail (reversed arrow)', 'Хвост (обратная стрелка)'],
  dot: ['Dot', 'Точка'],
  circle: ['Ring', 'Кольцо'],
  square: ['Square', 'Квадрат'],
  diamond: ['Diamond', 'Ромб'],
  none: ['None', 'Нет'],
};
export const EDITOR_SHAPE = {
  ...SHAPE,
  angles: 'fixed',
  targetAngle: 47,
  tension: 0.33,
  bulge: 45,
  startGap: 0.08,
  endGap: 0.08,
  startSize: 2.5,
  startAngle: 70,
  endSize: 3.5,
  endAngle: 45,
  middle: 'dot',
  middleSize: 2,
  placement: 'auto',
};
const field = (key, min, max, step, en, ru, extra = {}) =>
  range(key, EDITOR_SHAPE[key], min, max, step, { en, ru }, extra);
const degrees = { unit: '°' };

export const GEOMETRY_SECTIONS = [
  {
    id: 'placement',
    title: { en: 'Placement in space', ru: 'Размещение в пространстве' },
    fields: [
      select(
        'placement',
        'auto',
        [
          option('auto', 'Automatic (circle for 1–4, hexagonal after)', 'Авто (круг для 1–4, далее шестиугольники)'),
          option('circle', 'Circle', 'Круг'),
          option('square', 'Square grid', 'Квадратная сетка'),
          option('hex', 'Hexagonal grid', 'Шестиугольная сетка'),
          option('dice', 'Dice', 'Игральные кости'),
          option('cards', 'Playing cards', 'Игральные карты'),
          option('spiral', 'Sunflower spiral', 'Спираль подсолнуха'),
          option('force', 'Physical forces', 'Физические силы'),
        ],
        { en: 'Placement', ru: 'Размещение' },
      ),
      field('layoutAspect', 0.3, 3, 0.05, 'Horizontal layout scale', 'Масштаб размещения по горизонтали'),
      field('columns', 0, 30, 1, 'Grid columns (0 = automatic)', 'Столбцы сетки (0 = авто)', {
        when: (s) => s.placement === 'square',
      }),
      ...[
        ['forceDistance', 'Spring length', 'Длина пружины'],
        ['forceCharge', 'Repulsion', 'Отталкивание'],
        ['forceCollision', 'Space for links and loops', 'Пространство связей и петель'],
      ].map(([key, en, ru]) =>
        range(key, SHAPE[key], 0.2, 3, 0.05, { en, ru }, { when: (s) => s.placement === 'force' }),
      ),
    ],
  },
  {
    id: 'shape',
    title: { en: 'Shape of the links', ru: 'Форма связей' },
    fields: [
      select(
        'angles',
        EDITOR_SHAPE.angles,
        [
          option('mirror', 'Mirror the middle (as in the gallery)', 'Отражение середины (как в галерее)'),
          option('fixed', 'Fixed angles', 'Заданные углы'),
        ],
        { en: 'Angles of the ends', ru: 'Углы концов' },
      ),
      field('sourceAngle', -90, 90, 1, 'Leaving angle', 'Угол выхода', {
        ...degrees,
        when: (s) => s.angles === 'fixed',
      }),
      field('targetAngle', -90, 90, 1, 'Entering angle', 'Угол входа', {
        ...degrees,
        when: (s) => s.angles === 'fixed',
      }),
      toggle('lens', SHAPE.lens, {
        en: 'Two references to one link make a lens',
        ru: 'Две ссылки на одну связь образуют линзу',
      }),
      field('tension', 0, 1, 0.01, 'Curvature', 'Изгиб', { unit: '%' }),
      field('bulge', 0, 90, 1, 'Bend of a single reference', 'Отклонение одиночной ссылки', {
        ...degrees,
        hint: {
          en: 'Also turns the middle tangent of free links and self-reference loops.',
          ru: 'Также поворачивает касательную середины свободных связей и петель.',
        },
      }),
      field('startGap', 0, 0.4, 0.01, 'Gap at the source reference', 'Зазор у начальной ссылки'),
      field('endGap', 0, 0.4, 0.01, 'Gap at the target reference', 'Зазор у конечной ссылки'),
      field('free', 0.2, 3, 0.05, 'Length of a free end', 'Длина свободного конца', { unit: '×' }),
      field('loop', 0.3, 2.5, 0.05, 'Size of a loop', 'Размер петли', { unit: '×' }),
      field('spread', 0.5, 2.5, 0.05, 'Distance between links', 'Расстояние между связями', { unit: '×' }),
      field('rotation', 0, 359, 1, 'Rotation', 'Поворот', degrees),
      field('padding', 0, 40, 1, 'Margin', 'Поля', { unit: '%' }),
    ],
  },
  {
    id: 'ends',
    title: { en: 'Start, end and middle', ru: 'Начало, конец и середина' },
    fields: [
      ...['start', 'end', 'middle'].flatMap((key, i) => {
        const en = ['start', 'end', 'middle'][i];
        const ru = ['начала', 'конца', 'середины'][i];
        const shown = (s) => s[key] !== 'none';
        return [
          select(
            key,
            EDITOR_SHAPE[key],
            MARKERS.map((m) => option(m, ...names[m])),
            {
              en: `${['Start', 'End', 'Middle'][i]} of a link`,
              ru: ['Начало связи', 'Конец связи', 'Середина связи'][i],
            },
          ),
          field(`${key}Size`, 0.5, 15, 0.1, `Size of the ${en}`, `Размер ${ru}`, { when: shown }),
          field(`${key}Angle`, 5, 85, 1, `Angle of the ${en}`, `Угол ${ru}`, {
            ...degrees,
            when: (s) => ['arrow', 'triangle', 'tail'].includes(s[key]),
          }),
          field(`${key}Offset`, -20, 20, 0.1, `Offset of the ${en}`, `Сдвиг ${ru}`, {
            when: shown,
            hint: {
              en: 'Along the tangent; positive moves an endpoint marker into the line. Units: 1/100 of the symbol.',
              ru: 'Вдоль касательной; положительное значение смещает концевой маркер внутрь линии. Единица — 1/100 символа.',
            },
          }),
          field(`${key}Across`, -20, 20, 0.1, `Sideways offset of the ${en}`, `Поперечный сдвиг ${ru}`, {
            when: shown,
          }),
          field(`${key}Rotation`, -180, 180, 1, `Rotation of the ${en}`, `Поворот ${ru}`, {
            ...degrees,
            when: (s) => !['none', 'circle', 'dot'].includes(s[key]),
          }),
        ];
      }),
      field('middleGapStart', 0, 15, 0.1, 'Cut before the middle', 'Разрыв перед серединой', {
        hint: {
          en: 'Optional: for a ring, try half its size on each side. Zero keeps the line continuous.',
          ru: 'Необязательно: для кольца попробуйте половину его размера с каждой стороны. Ноль оставляет линию непрерывной.',
        },
      }),
      field('middleGapEnd', 0, 15, 0.1, 'Cut after the middle', 'Разрыв после середины'),
    ],
  },
];

/** Whether a geometry option can affect this network. Field-specific style conditions are separate. */
export function geometryAvailable(key, style, links) {
  if (!links) return true;
  const other = (ref, i) => ref !== 0 && ref !== i + 1;
  const any = (predicate) => links.some(predicate);
  switch (key) {
    case 'angles':
    case 'tension':
      return any(([s, t]) => s || t);
    case 'sourceAngle':
    case 'startGap':
      return any(([s]) => s !== 0);
    case 'targetAngle':
    case 'endGap':
      return any(([, t]) => t !== 0);
    case 'lens':
      return style.angles === 'mirror' && any(([s, t], i) => s === t && other(s, i));
    case 'bulge':
      return any(([s, t], i) => !(other(s, i) && other(t, i)));
    case 'free':
      return any(([s, t]) => s === 0 || t === 0);
    case 'loop':
      return any(([s, t], i) => s === i + 1 || t === i + 1);
    case 'forceDistance':
      return any(([s, t], i) => other(s, i) || other(t, i));
    case 'spread':
    case 'placement':
    case 'layoutAspect':
    case 'columns':
    case 'forceCharge':
    case 'forceCollision':
      return links.length > 1;
    default:
      return true;
  }
}
