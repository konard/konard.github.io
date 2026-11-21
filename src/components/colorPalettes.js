import { localized } from '../i18n/localizer.js';
// Ready colours for every colour setting (issue #45: "for color settings we
// should have palettes of the best neon and pastel colors, not only sliders").
// The colour chooser of ColorInput shows them under its red, green and blue
// sliders. Every value is a named colour of a public list, see "Colour
// palettes" in docs/case-studies/issue-45/README.md: W is Wikipedia's "List of
// colors", H is htmlcolorcodes.com and C is the CSS named colour. The matrix
// group holds the greens of the default look (issue #45) and the usual greens
// of the "digital rain" of design palettes.
export const COLOR_PALETTES = [
  {
    id: 'neon',
    name: localized('m72eb18448c49'),
    colors: [
      ['#39ff14', localized('m2d8e513ff8bc')], // W
      ['#ccff00', localized('m4e77ad14f237')], // W
      ['#ffea00', localized('m469738b78213')], // H
      ['#ff5f1f', localized('mf9045bcd126e')], // H
      ['#ff3131', localized('m06eccf66e85d')], // H
      ['#ff10f0', localized('mda8d95d988c3')], // H
      ['#bf00ff', localized('m0bd6fe81d037')], // W
      ['#1f51ff', localized('m8e10ad7fbe70')], // H
      ['#7df9ff', localized('mb65fb69972ba')], // H
      ['#00ffff', localized('m606a9f2a74f0')], // C, H
    ],
  },
  {
    id: 'pastel',
    name: localized('m74d90791d491'),
    colors: [
      ['#c1e1c1', localized('m68e3a017aca4')], // H
      ['#98fb98', localized('m1c5c5d263d95')], // H, C palegreen
      ['#fffaa0', localized('m019e2a25e4e7')], // H
      ['#fac898', localized('m668358dbcbcb')], // H
      ['#faa0a0', localized('m1a79ac147193')], // H
      ['#f8c8dc', localized('m69136f799e37')], // H
      ['#c3b1e1', localized('m04a2c8e63cc8')], // H
      ['#ccccff', localized('mdaa36d7aeaee')], // W, H
      ['#a7c7e7', localized('mbdea095a80dd')], // H
      ['#b2ffff', localized('m1a9ae8b0804d')], // W
    ],
  },
  {
    id: 'matrix',
    name: localized('m79cc5e4768aa'),
    colors: [
      ['#00ff41', localized('m53741baa6eef')],
      ['#00ff66', localized('m8a83f5fc73aa')],
      ['#17de1d', localized('m2e3cb380939b')],
      ['#1d873f', localized('m69b1fc5a68bc')],
      ['#008f11', localized('m26b33cca1670')],
      ['#003b00', localized('mb4a13d594b02')],
      ['#0d0208', localized('m1c1dcc0662b1')],
      ['#d1ffd6', localized('m444bd8200c5d')],
    ],
  },
];
