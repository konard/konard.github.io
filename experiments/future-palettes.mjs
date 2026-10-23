// Generates the palette rules of the futuristic skin (issue #13) for
// src/skins.future.css from the palettes of konard/immortality
// (app/src/styles.css, .app-shell[data-palette=…]).
//
//   node experiments/future-palettes.mjs > /tmp/palettes.css
//
// Dark: the immortality surfaces, neon and series colours as they are; the
// page is the surface darkened. Light: white panels on a page tinted by the
// neon, and the neon darkened until it reads on white (WCAG contrast ≥ 4.5).
const PALETTES = {
  mission: ['#0a1018', '#0d1520', '#eef6f6', '#7efcf6', '#10a99a'],
  glitchy: ['#120d17', '#1b1321', '#fbf1fd', '#e2aeeb', '#c45cd6'],
  amber: ['#151008', '#1e170a', '#fff8e9', '#ffd273', '#e4a72b'],
  monochrome: ['#0d0f11', '#15181b', '#f3f5f6', '#ffffff', '#d8dee1'],
  tron: ['#000b0b', '#001414', '#e4fbfb', '#00cfd1', '#00b2b4'],
  ares: ['#110303', '#1c0908', '#fbeceb', '#ff2f45', '#ff4b4f'],
  clu: ['#100400', '#1b0b02', '#fdf0e6', '#ff8300', '#e56f00'],
  athena: ['#0c0700', '#150e00', '#fdf7e2', '#fbc600', '#dcae00'],
  aphrodite: ['#0f040b', '#190914', '#fdeef8', '#f259c8', '#e05cbc'],
  poseidon: ['#010813', '#04101e', '#e9f3fd', '#59aaf8', '#2f8fea'],
  soulextract: ['#02161a', '#062328', '#e8fdff', '#27e1fa', '#19a0b3'],
  matrix: ['#020c04', '#041507', '#e6ffe9', '#3dff7a', '#1fbf55'],
};

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const lum = (c) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const readable = (c, on, target = 4.5) => {
  let t = 0;
  let out = c;
  while (contrast(out, on) < target && t < 1) {
    t += 0.02;
    out = mix(c, [0, 0, 0], t);
  }
  return out.map(Math.round);
};
const triplet = (c) => c.map(Math.round).join(' ');

const lines = [];
for (const [id, [s1, s2, text, neon, series]] of Object.entries(PALETTES)) {
  const [S1, S2, T, N, X] = [s1, s2, text, neon, series].map(rgb);
  const page = mix(S1, [0, 0, 0], 0.45);
  lines.push(
    `:root[data-skin-name='futuristic'][data-future-palette='${id}'] {`,
    `  --fx-neon-rgb: ${triplet(N)};`,
    `  --fx-series-rgb: ${triplet(X)};`,
    `  --fx-panel-rgb: ${triplet(S1)};`,
    `  --fx-panel-2-rgb: ${triplet(S2)};`,
    `  --fx-page-rgb: ${triplet(page)};`,
    `  --fx-text: ${text};`,
    '}',
    '',
  );
  const bg = mix([244, 247, 249], N, 0.06);
  const ink = readable(mix(N, X, 0.35), [255, 255, 255]);
  const ink2 = readable(X, [255, 255, 255]);
  const dark = mix(
    T.map(() => 0),
    S1,
    0.6,
  );
  lines.push(
    `:root[data-skin-name='futuristic'][data-future-palette='${id}'][data-theme='light'] {`,
    `  --fx-neon-rgb: ${triplet(ink)};`,
    `  --fx-series-rgb: ${triplet(ink2)};`,
    '  --fx-panel-rgb: 255 255 255;',
    `  --fx-panel-2-rgb: ${triplet(mix([255, 255, 255], N, 0.05))};`,
    `  --fx-page-rgb: ${triplet(bg)};`,
    `  --fx-text: ${hex(dark)};`,
    '}',
    '',
  );
}
console.log(lines.join('\n').trimEnd());
