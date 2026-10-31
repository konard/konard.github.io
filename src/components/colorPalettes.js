// Ready colours for every colour setting (issue #45: "for color settings we
// should have palettes of the best neon and pastel colors, not only sliders").
// The colour chooser of ColorInput shows them above its red, green and blue
// sliders. Sources of the values are in docs/case-studies/issue-45/README.md:
// the neon colours are the usual sRGB values of the named neon colours, the
// pastels are the named pastel colours of the same lists, and the matrix group
// holds the greens of the default look (the colours of issue #45) and of the
// "digital rain".
export const COLOR_PALETTES = [
  {
    id: 'neon',
    name: { en: 'Neon', ru: 'Неон' },
    colors: [
      ['#39ff14', { en: 'Neon green', ru: 'Неоновый зелёный' }],
      ['#ccff00', { en: 'Electric lime', ru: 'Электрический лайм' }],
      ['#ffff33', { en: 'Neon yellow', ru: 'Неоновый жёлтый' }],
      ['#ff9933', { en: 'Neon orange', ru: 'Неоновый оранжевый' }],
      ['#ff073a', { en: 'Neon red', ru: 'Неоновый красный' }],
      ['#ff10f0', { en: 'Neon pink', ru: 'Неоновый розовый' }],
      ['#bc13fe', { en: 'Neon purple', ru: 'Неоновый фиолетовый' }],
      ['#1f51ff', { en: 'Neon blue', ru: 'Неоновый синий' }],
      ['#00ffff', { en: 'Electric cyan', ru: 'Электрический циан' }],
      ['#00ffcc', { en: 'Neon aqua', ru: 'Неоновая морская волна' }],
    ],
  },
  {
    id: 'pastel',
    name: { en: 'Pastel', ru: 'Пастель' },
    colors: [
      ['#77dd77', { en: 'Pastel green', ru: 'Пастельный зелёный' }],
      ['#aaf0d1', { en: 'Mint', ru: 'Мятный' }],
      ['#fdfd96', { en: 'Pastel yellow', ru: 'Пастельный жёлтый' }],
      ['#ffb347', { en: 'Pastel orange', ru: 'Пастельный оранжевый' }],
      ['#ff6961', { en: 'Pastel red', ru: 'Пастельный красный' }],
      ['#ffd1dc', { en: 'Pastel pink', ru: 'Пастельный розовый' }],
      ['#c3b1e1', { en: 'Pastel purple', ru: 'Пастельный фиолетовый' }],
      ['#ccccff', { en: 'Periwinkle', ru: 'Барвинок' }],
      ['#a7c7e7', { en: 'Pastel blue', ru: 'Пастельный синий' }],
      ['#99e6e6', { en: 'Pastel cyan', ru: 'Пастельный циан' }],
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
