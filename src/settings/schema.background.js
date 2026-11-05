import { localized } from '../i18n/localizer.js';
// Sections of the background (issues #13 and #15): motion, the universe, the
// grid and the rain of link networks; see schema.js.
import { color, option, range, select, toggle } from './fields.js';

export const BACKGROUND_SECTIONS = [
  {
    id: 'motion',
    title: localized('m98a69d34fa94'),
    lead: localized('m2b013867c6a1'),
    fields: [
      select(
        'motion.mode',
        'auto',
        [
          option('auto', 'As the system prefers', 'Как в настройках системы'),
          option('on', 'Always move', 'Всегда двигать'),
          option('off', 'Never move', 'Никогда не двигать'),
        ],
        localized('m8c0340b2770e'),
        {
          hint: localized('m9a9d073a09e5'),
        },
      ),
    ],
  },
  {
    id: 'nebula',
    title: localized('m0e3390a5468a'),
    fields: [
      toggle('nebula.on', true, localized('mc96bf801cc52')),
      range('nebula.level', 0.5, 0, 1, 0.05, localized('m7919224a8d04'), { unit: '%' }),
      range('nebula.speed', 0.5, 0, 8, 0.1, localized('mc594ab112f3e'), { unit: '×' }),
      range('nebula.gas', 0.35, 0, 2.5, 0.05, localized('m197ae3d42852'), { unit: '×' }),
      range('nebula.hue', 25, -180, 180, 5, localized('mee5999a1fb69'), { unit: '°' }),
      range('nebula.stars', 1.2, 0, 4, 0.1, localized('mfbc753d141b3'), { unit: '×' }),
      range('nebula.starBrightness', 0.8, 0, 2.5, 0.05, localized('mf6a384824257'), { unit: '×' }),
      range('nebula.twinkle', 1.9, 0, 5, 0.1, localized('m9f39f90e5f65'), { unit: '×' }),
      range('nebula.vignette', 0.3, 0, 1, 0.05, localized('m80131847a1b4'), { unit: '%' }),
      range('nebula.zoom', 0.55, 0.3, 3, 0.05, localized('mc2365751a690'), { unit: '×', css: false }),
      color('nebula.color1', '#210f52', localized('m2875534a6c58'), { css: false }),
      color('nebula.color2', '#086b85', localized('mb4a70175993e'), { css: false }),
      color('nebula.color3', '#a63380', localized('m1a9d5b47dca3'), { css: false }),
      color('nebula.color4', '#e6d9ff', localized('m66378dcee9c8'), { css: false }),
      range('nebula.starSize', 0.5, 0.5, 3, 0.1, localized('m1ec9f7d91d14'), { unit: '×', css: false }),
      color('nebula.starColor', '#00c7fc', localized('m242e5ea2cdcc'), { css: false }),
      range('nebula.resolution', 0.6, 0.2, 1, 0.05, localized('me54027e3f066'), {
        unit: '%',
        hint: localized('m7d4a8ed7125b'),
      }),
      range('nebula.fps', 24, 5, 60, 1, localized('m572d019babef')),
    ],
  },
  {
    id: 'grid',
    title: localized('m5f3b8636f214'),
    fields: [
      toggle('grid.on', true, localized('mb364f1413216')),
      range('grid.level', 1, 0, 4, 0.1, localized('mde792cabc72d'), { unit: '×' }),
      range('grid.size', 48, 32, 128, 8, localized('m4a71f9ff7f75'), {
        unit: 'px',
        hint: localized('m00c4ce8b4872'),
      }),
      range('grid.period', 109, 0, 120, 1, localized('m2289ee32279c'), { unit: 's', hint: localized('m62aa7ae958cb') }),
      toggle('grid.fade', true, localized('m6bd61452cf13')),
      select(
        'grid.style',
        'lines',
        [
          option('lines', 'Lines', 'Линии'),
          option('dashed', 'Dashed lines', 'Пунктир'),
          option('crosses', 'Crosses at the corners', 'Крестики в углах'),
          option('dots', 'Dots at the corners', 'Точки в углах'),
        ],
        localized('mc68baf538759'),
      ),
      range('grid.width', 1, 0.5, 4, 0.5, localized('m19156ba5b253'), { unit: 'px' }),
      range('grid.mark', 0.3, 0.05, 1, 0.05, localized('m939d623ad4e6'), {
        unit: '%',
        when: (s) => s['grid.style'] === 'dashed' || s['grid.style'] === 'crosses',
      }),
      select(
        'grid.tint',
        'theme',
        [
          option('theme', 'Theme lines', 'Линии темы'),
          option('accent', 'Accent', 'Акцент'),
          option('accent2', 'Second accent', 'Второй акцент'),
          option('custom', 'My colour', 'Свой цвет'),
        ],
        localized('m9ffc82435487'),
      ),
      color('grid.color', '#7efcf6', localized('mfcb9f6072095'), { when: (s) => s['grid.tint'] === 'custom' }),
    ],
  },
  {
    id: 'rain',
    title: localized('m5aeffb9a4f46'),
    fields: [
      toggle('rain.on', true, localized('m2a70b8b38297')),
      range('rain.level', 0.75, 0, 2, 0.05, localized('mde792cabc72d'), { unit: '×' }),
      toggle('rain.dim', true, localized('m80320c336235')),
      range('rain.step', 105, 20, 400, 5, localized('ma9c028ab7395'), { unit: 'ms', hint: localized('m3907f9bdf558') }),
      range('rain.speeds', 2, 1, 8, 1, localized('m639cfd82d004')),
      range('rain.density', 0.5, 0.05, 1, 0.05, localized('mc6229be60958'), { unit: '%' }),
      range('rain.restart', 0.05, 0.005, 0.5, 0.005, localized('m8621a50922a5')),
      range('rain.fade', 0.075, 0.01, 0.5, 0.005, localized('mf483ccba9bc2'), { hint: localized('m158d4bd0549b') }),
      range('rain.lineWidth', 1, 0.25, 12, 0.25, localized('m19156ba5b253'), { hint: localized('me5ae46d9cba6') }),
      range('rain.padding', 0, 0, 16, 0.5, localized('m0b8b7a3879d1'), {
        unit: 'px',
        hint: localized('m1189f473e074'),
      }),
      range('rain.glow', 4, 0, 40, 1, localized('mf6139604e31d'), { unit: 'px' }),
      color('rain.glowColor', '#00a3d7', localized('m505c84894a50')),
      range('rain.minLinks', 1, 1, 4, 1, localized('md3e852d9d0d6')),
      range('rain.maxLinks', 4, 1, 4, 1, localized('mab69b624dc15')),
      toggle('rain.real', false, localized('m59513a4fc060')),
    ],
  },
];
