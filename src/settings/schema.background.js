// Sections of the background (issues #13 and #15): motion, the universe, the
// grid and the rain of link networks; see schema.js.
import { color, option, range, select, toggle } from './fields';

export const BACKGROUND_SECTIONS = [
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
      range('nebula.level', 0.5, 0, 1, 0.05, { en: 'Strength', ru: 'Яркость слоя' }, { unit: '%' }),
      range('nebula.speed', 0.5, 0, 8, 0.1, { en: 'Speed', ru: 'Скорость' }, { unit: '×' }),
      range('nebula.gas', 0.35, 0, 2.5, 0.05, { en: 'Nebula brightness', ru: 'Яркость туманности' }, { unit: '×' }),
      range('nebula.hue', 25, -180, 180, 5, { en: 'Hue shift', ru: 'Сдвиг оттенка' }, { unit: '°' }),
      range('nebula.stars', 1.2, 0, 4, 0.1, { en: 'Number of stars', ru: 'Количество звёзд' }, { unit: '×' }),
      range('nebula.starBrightness', 0.8, 0, 2.5, 0.05, { en: 'Star brightness', ru: 'Яркость звёзд' }, { unit: '×' }),
      range('nebula.twinkle', 0.3, 0, 5, 0.1, { en: 'Twinkling speed', ru: 'Скорость мерцания' }, { unit: '×' }),
      range('nebula.vignette', 0.3, 0, 1, 0.05, { en: 'Darker edges', ru: 'Затемнение краёв' }, { unit: '%' }),
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
        48,
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
        109,
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
      range('rain.level', 0.75, 0, 2, 0.05, { en: 'Strength', ru: 'Яркость' }, { unit: '×' }),
      toggle('rain.dim', true, {
        en: 'Quieter behind the text',
        ru: 'Тише за текстом',
      }),
      range(
        'rain.step',
        105,
        20,
        400,
        5,
        { en: 'Step', ru: 'Шаг' },
        { unit: 'ms', hint: { en: 'Less is faster.', ru: 'Меньше — быстрее.' } },
      ),
      range('rain.speeds', 2, 1, 8, 1, { en: 'Slowest column, in steps', ru: 'Самая медленная колонка, шагов' }),
      range('rain.density', 0.5, 0.05, 1, 0.05, { en: 'Columns with rain', ru: 'Колонки с дождём' }, { unit: '%' }),
      range('rain.restart', 0.05, 0.005, 0.5, 0.005, {
        en: 'Chance to start again after leaving the screen',
        ru: 'Вероятность начать снова за краем экрана',
      }),
      range(
        'rain.fade',
        0.075,
        0.01,
        0.5,
        0.005,
        { en: 'Trail fading per step', ru: 'Угасание следа за шаг' },
        { hint: { en: 'Less leaves longer trails.', ru: 'Меньше — длиннее след.' } },
      ),
      range(
        'rain.lineWidth',
        1,
        0.25,
        12,
        0.25,
        { en: 'Line width', ru: 'Толщина линий' },
        { hint: { en: 'In hundredths of a symbol.', ru: 'В сотых долях символа.' } },
      ),
      range(
        'rain.padding',
        0,
        0,
        16,
        0.5,
        { en: 'Space around a symbol', ru: 'Отступ вокруг символа' },
        {
          unit: 'px',
          hint: {
            en: 'Free space inside the cell on every side; more makes the symbols smaller and sparser.',
            ru: 'Свободное место в клетке с каждой стороны; больше — символы мельче и реже.',
          },
        },
      ),
      range(
        'rain.glow',
        4,
        0,
        40,
        1,
        { en: 'Glow of the falling symbol', ru: 'Свечение падающего символа' },
        { unit: 'px' },
      ),
      color('rain.glowColor', '#00a3d7', { en: 'Glow colour', ru: 'Цвет свечения' }),
      range('rain.minLinks', 1, 1, 4, 1, { en: 'Fewest links in a symbol', ru: 'Меньше всего связей в символе' }),
      range('rain.maxLinks', 4, 1, 4, 1, { en: 'Most links in a symbol', ru: 'Больше всего связей в символе' }),
      toggle('rain.real', false, {
        en: 'Only real references (no references to 0)',
        ru: 'Только настоящие ссылки (без ссылок на 0)',
      }),
    ],
  },
];
