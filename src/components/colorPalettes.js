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
    name: { en: 'Neon', ru: 'Неон' },
    colors: [
      ['#39ff14', { en: 'Neon green', ru: 'Неоновый зелёный' }], // W
      ['#ccff00', { en: 'Electric lime', ru: 'Электрический лайм' }], // W
      ['#ffea00', { en: 'Bright yellow', ru: 'Ярко-жёлтый' }], // H
      ['#ff5f1f', { en: 'Neon orange', ru: 'Неоновый оранжевый' }], // H
      ['#ff3131', { en: 'Neon red', ru: 'Неоновый красный' }], // H
      ['#ff10f0', { en: 'Neon pink', ru: 'Неоновый розовый' }], // H
      ['#bf00ff', { en: 'Electric purple', ru: 'Электрический фиолетовый' }], // W
      ['#1f51ff', { en: 'Neon blue', ru: 'Неоновый синий' }], // H
      ['#7df9ff', { en: 'Electric blue', ru: 'Электрический синий' }], // H
      ['#00ffff', { en: 'Cyan', ru: 'Циан' }], // C, H
    ],
  },
  {
    id: 'pastel',
    name: { en: 'Pastel', ru: 'Пастель' },
    colors: [
      ['#c1e1c1', { en: 'Pastel green', ru: 'Пастельный зелёный' }], // H
      ['#98fb98', { en: 'Mint green', ru: 'Мятный' }], // H, C palegreen
      ['#fffaa0', { en: 'Pastel yellow', ru: 'Пастельный жёлтый' }], // H
      ['#fac898', { en: 'Pastel orange', ru: 'Пастельный оранжевый' }], // H
      ['#faa0a0', { en: 'Pastel red', ru: 'Пастельный красный' }], // H
      ['#f8c8dc', { en: 'Pastel pink', ru: 'Пастельный розовый' }], // H
      ['#c3b1e1', { en: 'Pastel purple', ru: 'Пастельный фиолетовый' }], // H
      ['#ccccff', { en: 'Periwinkle', ru: 'Барвинок' }], // W, H
      ['#a7c7e7', { en: 'Pastel blue', ru: 'Пастельный синий' }], // H
      ['#b2ffff', { en: 'Celeste', ru: 'Селадоново-голубой' }], // W
    ],
  },
  {
    id: 'matrix',
    name: { en: 'Matrix', ru: 'Матрица' },
    colors: [
      ['#00ff41', { en: 'Code green', ru: 'Зелёный код' }],
      ['#00ff66', { en: 'Rain glow', ru: 'Свечение дождя' }],
      ['#17de1d', { en: 'Star green', ru: 'Зелёные звёзды' }],
      ['#1d873f', { en: 'Phosphor', ru: 'Люминофор' }],
      ['#008f11', { en: 'Dark green', ru: 'Тёмно-зелёный' }],
      ['#003b00', { en: 'Deep green', ru: 'Глубокий зелёный' }],
      ['#0d0208', { en: 'Screen black', ru: 'Чёрный экран' }],
      ['#d1ffd6', { en: 'Pale green', ru: 'Бледно-зелёный' }],
    ],
  },
];
