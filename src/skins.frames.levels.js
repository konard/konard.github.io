// Corners of every level of the frame (issue #47: "each type of INTERFACE
// CONTROLS must have separate CORNERS OF THE FRAME, so on each level I should
// be able to configure it fully"). Inner blocks and every type of control
// (buttons, fields, tabs, chips, menus, tables) draw the corners of the outer
// panels in their scale until they are given their own: then they have their
// own shape, line, size and width at every corner, their own edges, edge
// style and side widths.
//
// A level works like the outer panels (src/skins.frames.js): its chosen shapes
// and lines put numbers on the root only (`--fx-button-tl-*`), the root turns
// them into typed lengths (`--fxbutton-tl-*`), and the elements of the level
// draw from those. The lengths are declared only while the level has its own
// corners, so a level that follows the panels costs nothing when the page
// restyles. Each level has its own generated stylesheet,
// src/skins.frames.level-<level>.css (`npm run build:frames`).
import {
  BLOCKS,
  clip,
  column,
  CONTROL_TYPES,
  CORNERS,
  EDGE_LOOK,
  EDGE_STYLES,
  EDGES,
  edgeImages,
  each,
  element,
  FRAME,
  INNER,
  layers,
  LEVELS,
  LINES,
  lineLook,
  ownCorners,
  property,
  registered,
  scaleLengths,
  SHAPES,
  shapeNumbers,
  STRONG,
  controlsOf,
} from './skins.frames.js';

/** The edge styles of the outer panels: the ones a block follows while its style is `same`. */
const PANEL_STYLES = EDGE_STYLES.filter((style) => style !== 'double');

/** A rule on one line: a level has a thousand of them, and the file stays short. */
const line = (selector, declarations) =>
  `${selector} { ${Object.entries(declarations)
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ')} }\n`;

/** A rule with one declaration per line, for the long values of the layers. */
const block = (selector, declarations) =>
  `${selector} {\n${Object.entries(declarations)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')}\n}\n`;

/** The elements of a level, one `:where()` each under `prefix`. */
const elementsOf = (level, prefix) =>
  level === 'block'
    ? `${prefix}${INNER.replace(':is(', ':where(')},\n${each(prefix, BLOCKS)}`
    : each(prefix, CONTROL_TYPES[level]);

/** The registrations of a level: as for the outer panels (see `registered`). */
function properties(level) {
  const types = registered(level);
  return [
    ...types.rootOnly.map((name) => property(name, '*', false)),
    ...types.lengths.map((name) => property(name, '<length>', true, '0px')),
    ...types.colors.map((name) => property(name, '<color>', true, 'transparent')),
    // The colour of the edges of the level, which its elements read.
    property(`--fx-${level}-ec`, '<color>', true, 'transparent'),
    ...types.images.map((name) => property(name, '<image> | none', true, 'none')),
  ];
}

/** The numbers of the chosen shape and line of every corner of a level, on the root only. */
function corners(level) {
  return CORNERS.flatMap((corner) => [
    ...Object.keys(SHAPES).map((shape) =>
      line(`:root[data-corner-${level}-${corner}-shape='${shape}']`, shapeNumbers(corner, shape, level)),
    ),
    ...LINES.map((name) => line(`:root[data-corner-${level}-${corner}-line='${name}']`, lineLook(corner, name, level))),
  ]);
}

/**
 * The colour of the edges and of the `line` corners of a level: the ones of
 * the outer panels, or its own while it has its own corners.
 */
function edges(level) {
  const own = `:root${ownCorners(level)}`;
  return [
    line(':where(:root)', { [`--fx-${level}-ce-col`]: 'var(--fx-ce-col)', [`--fx-${level}-ec`]: 'var(--fx-ec)' }),
    ...EDGES.map((edge) =>
      line(`${own}[data-corner-${level}-edges='${edge}']`, {
        [`--fx-${level}-ce-col`]: EDGE_LOOK[edge].col,
        [`--fx-${level}-ec`]: EDGE_LOOK[edge].ec,
      }),
    ),
  ];
}

/** What the elements of a level with its own corners draw. */
function elements(level) {
  const own = `${FRAME}${ownCorners(level)}`;
  const out = [block(own, scaleLengths(level))];
  if (level === 'block') {
    out.push(block(elementsOf(level, `${own} `), { ...element(level), '--fx-ec': `var(--fx-${level}-ec)` }));
    // The images of the edges in the colour of the block (those of the root have the colour of the panels).
    const styled = `:root${ownCorners(level)}[data-corner-${level}-edge-style=`;
    PANEL_STYLES.forEach((style) =>
      out.push(block(elementsOf(level, `${styled}'same'][data-corner-edge-style='${style}'] `), edgeImages(style))),
    );
    EDGE_STYLES.forEach((style) => out.push(block(elementsOf(level, `${styled}'${style}'] `), edgeImages(style))));
    return out;
  }
  // The frame of a control, as for `same` in `controlRules` with the layers of the level.
  out.push(
    block(controlsOf(level, `${STRONG}${ownCorners(level)}`), {
      'background-image': `${column(layers(level), 0)},\n    var(--fx-control-img, none)`,
      'background-size': `${column(layers(level), 1)},\n    100% 100%`,
      'background-position': `${column(layers(level), 2)},\n    0 0`,
      'background-repeat': 'no-repeat',
      'background-origin': 'border-box',
      'border-color': 'transparent',
      'border-radius': '0',
      'clip-path': clip(level),
    }),
  );
  // Its own edge style; `same` keeps the border style of the controls.
  EDGE_STYLES.forEach((style) =>
    out.push(
      block(
        elementsOf(level, `:root${ownCorners(level)}[data-corner-${level}-edge-style='${style}'] `),
        edgeImages(style),
      ),
    ),
  );
  return out;
}

/** The stylesheet of one level (src/skins.frames.level-<level>.css). */
export function levelCss(level) {
  return [
    '/* Generated by src/skins.frames.levels.js (npm run build:frames); do not edit.\n' +
      `   The own corners of ${level === 'block' ? 'inner blocks' : `the controls of type "${level}"`} (issue #47). */\n`,
    ...properties(level),
    ...edges(level),
    ...corners(level),
    ...elements(level),
  ].join('');
}

/** Every level with the name of its stylesheet. */
export const LEVEL_FILES = Object.keys(LEVELS).map((level) => [`skins.frames.level-${level}.css`, level]);
