// Frames with every corner on its own (issue #15: "each corner must be
// configurable", with cuts, rounded corners and corners with a missing
// border). This file describes the corner shapes once; the same numbers draw
// the preview tiles on the settings page and generate src/skins.frames.css
// (`npm run build:frames`; a test checks that the stylesheet is up to date).
// It imports nothing, so a plain Node script can run it.
//
// Issue #45: outer panels, inner blocks, buttons and fields share the frame,
// each framed element in its own scale (1 for an outer panel, the block scale
// for a panel inside a panel, the control scale for buttons and fields).
// Corners and edges have their own widths, the edges a style (solid, dashed,
// dotted, double), and the corner layer is drawn above the content of a panel
// (over the colour bar of a position) or below it.
//
// A setting changes a variable or an attribute of <html>, and then every
// element of the page computes its style again; with sliders that happens on
// every step. So the chosen shapes and lines put numbers on the root only (how
// many corner sizes a point or a layer is away from the corner), the root turns
// them into typed lengths of each scale (registered with `@property`, so every
// element inherits one computed length, not a formula), and a framed element
// draws its outline and layers from the lengths of its scale in properties
// that do not inherit. Every selector of a framed element is its own
// `:where()`, so a browser tries the rule only on the elements of that class or
// tag (a list in one `:where()` is tried on every element of the page).

export const CORNERS = ['tl', 'tr', 'br', 'bl'];

const quarter = (point) => Array.from({ length: 9 }, (_, i) => point((i * Math.PI) / 16));
const round4 = (value) => Math.round(value * 10000) / 10000;

/**
 * The shapes of the top left corner in units of the corner size, from the left
 * edge to the top edge: `points` of the outline, `x` and `y` how far the shape
 * reaches along the top and the left edge.
 */
export const SHAPES = {
  square: { points: [[0, 0]], x: 0, y: 0 },
  cut: {
    points: [
      [0, 1],
      [1, 0],
    ],
    x: 1,
    y: 1,
  },
  tall: {
    points: [
      [0, 2],
      [1, 0],
    ],
    x: 1,
    y: 2,
  },
  wide: {
    points: [
      [0, 1],
      [2, 0],
    ],
    x: 2,
    y: 1,
  },
  round: { points: quarter((a) => [round4(1 - Math.cos(a)), round4(1 - Math.sin(a))]), x: 1, y: 1 },
  scoop: { points: quarter((a) => [round4(Math.sin(a)), round4(Math.cos(a))]), x: 1, y: 1 },
  notch: {
    points: [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
    x: 1,
    y: 1,
  },
};

/**
 * Lines at a corner: none (the edges end at the shape, its own line is
 * missing), gap (the edges stop a bracket length before it), line (the colour
 * of the edges), accent (a bright line) and bracket (a bright line with arms
 * along both edges).
 */
export const LINES = ['none', 'gap', 'line', 'accent', 'bracket'];

export const EDGES = ['none', 'faint', 'line'];

const v = (corner, name) => `var(--fx-${corner}-${name})`;
/**
 * The three scales of the frame: outer panels, inner blocks and controls. The
 * root computes the lengths of every corner once in each scale (`--fxp-*`,
 * `--fxb-*`, `--fxc-*`), and a framed element draws with its set.
 */
export const SCALES = {
  p: { scale: '1', ew: 'var(--fx-ew)' },
  b: { scale: 'var(--corner-block-scale, 0.6)', ew: 'var(--fx-ew)' },
  // Controls draw their edges as wide as their border.
  c: { scale: 'var(--corner-control-scale, 0.35)', ew: 'var(--ui-control-border, 1px)' },
};
/** A length of `corner` in scale `k` (a key of SCALES). */
const len = (k, corner, name) => `var(--fx${k}-${corner}-${name})`;
const right = (corner) => corner === 'tr' || corner === 'br';
const bottom = (corner) => corner === 'br' || corner === 'bl';

/** The most points of a shape: every corner has this many points in the polygon. */
export const POINTS = Math.max(...Object.values(SHAPES).map((shape) => shape.points.length));

/**
 * The points of `shape` at `corner` in the clockwise order of the polygon, in
 * corner sizes from the corner, repeated at the end up to POINTS points.
 */
export const cornerSteps = (corner, shape) => {
  const points = [...SHAPES[shape].points];
  // Top right and bottom left go from the horizontal edge to the vertical one.
  if (corner === 'tr' || corner === 'bl') points.reverse();
  while (points.length < POINTS) points.push(points[points.length - 1]);
  return points;
};

/** A length from the side of the corner, or from the far side for a right or bottom corner. */
const along = (flip, length) => (flip ? `calc(100% - ${length})` : length);

/** Point `i` of the polygon at `corner` in scale `k`, from the lengths of the root. */
const point = (corner, i, k) =>
  `${along(right(corner), len(k, corner, `${i}x`))} ${along(bottom(corner), len(k, corner, `${i}y`))}`;

/** The outline of the chosen shape at `corner`: POINTS points of the polygon. */
export const cornerPoints = (corner, k = 'p') => Array.from({ length: POINTS }, (_, i) => point(corner, i, k));

/** A background position `x` from the side and `y` from the top or bottom of the corner. */
const at = (corner, x, y) => `${right(corner) ? 'right' : 'left'} ${x} ${bottom(corner) ? 'bottom' : 'top'} ${y}`;

const DIAGONAL = { tl: 'to bottom right', tr: 'to bottom left', br: 'to top left', bl: 'to top right' };
const OUTSIDE = { tl: '100% 100%', tr: '0 100%', br: '0 0', bl: '100% 0' };
const INSIDE = { tl: '0 0', tr: '100% 0', br: '100% 100%', bl: '0 100%' };

/**
 * The two line layers of a shape at a corner. The image does not depend on the
 * corner size, so the root holds it; the size of a layer is `s × sx + wx` by
 * `s × sy + wy` and its position `s × px` and `s × py` from the corner, where
 * `s` is the corner size of the framed element.
 */
export function strokes(corner, shape) {
  const col = v(corner, 'col');
  const w = v(corner, 'w');
  const tick = v(corner, 'tickk');
  const solid = `linear-gradient(${col}, ${col})`;
  const layer = (img, [sx, wx], [sy, wy], [px, py] = [0, 0]) => ({ img, sx, wx, sy, wy, px, py });
  const none = layer('none', [0, '0px'], [0, '0px']);
  // A ring as wide as the line on the inside of the layer box: the radius is the box.
  const ring = (center) =>
    `radial-gradient(circle farthest-side at ${center}, transparent calc(100% - ${w}), ${col} calc(100% - ${w}) 100%, transparent 100%)`;
  const { x, y } = SHAPES[shape];
  switch (shape) {
    case 'square':
      // A bright line draws a tick as long as the corner size along both edges.
      return [layer(solid, [tick, '0px'], [0, w]), layer(solid, [0, w], [tick, '0px'])];
    case 'cut':
    case 'tall':
    case 'wide':
      return [
        layer(
          `linear-gradient(${DIAGONAL[corner]}, transparent 50%, ${col} 50% calc(50% + ${w}), transparent 0)`,
          [x, '0px'],
          [y, '0px'],
        ),
        none,
      ];
    case 'round':
      return [layer(ring(OUTSIDE[corner]), [1, '0px'], [1, '0px']), none];
    case 'scoop':
      return [layer(ring(INSIDE[corner]), [1, w], [1, w]), none];
    default:
      // notch: a step into the panel, two lines.
      return [layer(solid, [1, '0px'], [0, w], [0, 1]), layer(solid, [0, w], [1, '0px'], [1, 0])];
  }
}

/** Outer panels of the site; a panel inside a panel is an inner block. */
export const PANELS = [
  '.card',
  '.chart',
  '.registry',
  '.project',
  '.skills__group',
  '.org',
  '.step',
  '.stat',
  '.position',
  '.ps-note',
  '.social',
  '.cloud',
  '.habr-card',
  '.page-card',
  '.psd',
  '.theory__formulas li',
  '.theory__hero',
  '.theory__network',
  '.version',
  '.filters',
  '.page-stats li',
  '.post',
  '.repo',
  '.field-card',
  '.stack__layer',
  '.symbols__grid li',
  '.settings__group',
  '.network__panel',
  '.network__preview',
  '.link-card',
  '.preset',
  '.ui-preview__panel',
];

/**
 * Panels inside another panel: inner blocks in the block scale. Inside a
 * `[data-frame-root]` element only the panels inside that element count, so the
 * samples of the settings page show outer panels as outer though a settings
 * panel holds them.
 */
const PANEL = `:is(${PANELS.join(', ')})`;
export const INNER = `:is(${PANEL} ${PANEL}:not([data-frame-root] *), [data-frame-root] ${PANEL} ${PANEL})`;

/** Small items of lists: blocks even when they are not inside a panel. */
export const BLOCKS = ['.theory__formulas li', '.page-stats li', '.symbols__grid li'];

/** Buttons, fields, chips, tabs and menus: the frame in the control scale. */
export const CONTROLS = [
  'button:not(.segmented button, .prefs__langs button, .preset, .preset button)',
  '.button',
  'textarea',
  "input:not([type='range'], [type='checkbox'], [type='radio'], [type='color'], [type='file'], [type='hidden'])",
  '.chip',
  '.tags li',
  '.pages a',
  '.role-tabs a',
  '.segmented',
  '.prefs__langs',
  '.repo__fields li',
  '.ui-select__list',
];

const list = (selectors) => selectors.join(', ');
/** `prefix :where(element)` for every element: one selector each, so a browser files it under its class or tag. */
const each = (prefix, elements) => elements.map((element) => `${prefix}:where(${element})`).join(',\n');

/**
 * What a corner line sets: colour, width, the tick of a square corner (in
 * corner sizes), and whether it has arms and a gap of the edges (in brackets).
 */
const THIN = 'var(--future-border, 1px)';
const BOLD = 'var(--fx-b)';
const LOOK = {
  none: { col: 'transparent', w: THIN, tickk: 0, armk: 0, gapk: 0 },
  gap: { col: 'transparent', w: THIN, tickk: 0, armk: 0, gapk: 1 },
  line: { col: 'var(--fx-ce-col)', w: THIN, tickk: 0, armk: 0, gapk: 0 },
  accent: { col: 'var(--fx-line)', w: BOLD, tickk: 1, armk: 0, gapk: 0 },
  bracket: { col: 'var(--fx-line)', w: BOLD, tickk: 0, armk: 1, gapk: 0 },
};
/** The bracket of a framed element in its own scale. */
const ARM = (k) => `var(--fx-k) * ${SCALES[k].scale}`;

/** The colour of the edges and of the `line` corners. */
const EDGE_LOOK = {
  none: { ec: 'transparent', col: 'rgb(var(--accent-rgb) / 0.3)' },
  faint: { ec: 'rgb(var(--accent-rgb) / 0.3)', col: 'rgb(var(--accent-rgb) / 0.3)' },
  line: { ec: 'var(--fx-line)', col: 'var(--fx-line)' },
};

/** Images of a horizontal and a vertical edge in each style (the colour is `--fx-ec`). */
export const EDGE_STYLES = ['solid', 'dashed', 'dotted', 'double'];
const DOT = 'max(1px, var(--fx-ew))';
const edgeImages = (style) => {
  const c = 'var(--fx-ec)';
  const along = (deg) =>
    ({
      solid: `linear-gradient(${c}, ${c})`,
      dashed: `repeating-linear-gradient(${deg}, ${c} 0 6px, transparent 6px 10px)`,
      dotted: `repeating-linear-gradient(${deg}, ${c} 0 ${DOT}, transparent ${DOT} calc(${DOT} * 3))`,
      // Two thin lines across the edge, like `border-style: double`.
      double: `linear-gradient(${deg === '90deg' ? '180deg' : '90deg'}, ${c} 0 34%, transparent 34% 66%, ${c} 66%)`,
    })[style];
  return { '--fx-ce-h': along('90deg'), '--fx-ce-v': along('180deg') };
};

const SIDES = ['top', 'right', 'bottom', 'left'];
// The images of the edges; solid until the style of the edges is known.
const H = 'var(--fx-ce-h, linear-gradient(var(--fx-ec), var(--fx-ec)))';
const V = 'var(--fx-ce-v, linear-gradient(var(--fx-ec), var(--fx-ec)))';

const rule = (selector, declarations) =>
  `${selector} {\n${Object.entries(declarations)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')}\n}\n`;

/** The layers of one corner: two lines of the shape and two arms. */
function cornerLayers(corner, k) {
  const col = v(corner, 'col');
  const w = v(corner, 'w');
  const arm = len(k, corner, 'arm');
  const solid = `linear-gradient(${col}, ${col})`;
  const shape = (name) => [
    v(corner, `${name}-img`),
    `${len(k, corner, `${name}-w`)} ${len(k, corner, `${name}-h`)}`,
    at(corner, len(k, corner, `${name}-px`), len(k, corner, `${name}-py`)),
  ];
  return [
    shape('a'),
    shape('b'),
    [solid, `${arm} ${w}`, at(corner, len(k, corner, 'x'), 0)],
    [solid, `${w} ${arm}`, at(corner, 0, len(k, corner, 'y'))],
  ];
}

/** The four edges between the corners, shortened by the shapes and the gaps; each side has its width. */
function edgeLayers(k) {
  const reach = (corner, axis) => len(k, corner, `r${axis}`);
  const span = (a, b, axis) => `max(0px, calc(100% - ${reach(a, axis)} - ${reach(b, axis)}))`;
  const w = (side) => `var(--fx${k}-ew-${side})`;
  return [
    [H, `${span('tl', 'tr', 'x')} ${w('top')}`, `left ${reach('tl', 'x')} top 0`],
    [V, `${w('right')} ${span('tr', 'br', 'y')}`, `right 0 top ${reach('tr', 'y')}`],
    [H, `${span('bl', 'br', 'x')} ${w('bottom')}`, `left ${reach('bl', 'x')} bottom 0`],
    [V, `${w('left')} ${span('tl', 'bl', 'y')}`, `left 0 top ${reach('tl', 'y')}`],
  ];
}

const FUTURE = ":root[data-skin-name='futuristic']";
const FRAME = `${FUTURE}[data-future-frame='custom']`;
/** The background layers of the frame in scale `k`: 16 of the corners, then 4 edges. */
const layers = (k) => [...CORNERS.flatMap((corner) => cornerLayers(corner, k)), ...edgeLayers(k)];
const LAYERS = layers('p');
const column = (list, i) => list.map((layer) => layer[i]).join(',\n    ');
/** The outline of the frame in scale `k`. */
const clip = (k) => `polygon(${CORNERS.flatMap((corner) => cornerPoints(corner, k)).join(', ')})`;

/** The lengths of a corner in scale `k`, from the numbers of the root. */
function cornerLengths(corner, k) {
  const name = (key) => `--fx${k}-${corner}-${key}`;
  const s = `var(${name('s')})`;
  const times = (key) => `calc(${s} * ${v(corner, key)})`;
  const layer = (layerName) => ({
    [name(`${layerName}-w`)]: `calc(${s} * ${v(corner, `${layerName}-sx`)} + ${v(corner, `${layerName}-wx`)})`,
    [name(`${layerName}-h`)]: `calc(${s} * ${v(corner, `${layerName}-sy`)} + ${v(corner, `${layerName}-wy`)})`,
    [name(`${layerName}-px`)]: times(`${layerName}-px`),
    [name(`${layerName}-py`)]: times(`${layerName}-py`),
  });
  return {
    [name('s')]: `calc(var(--corner-${corner}-size, 14px) * ${SCALES[k].scale})`,
    [name('gap')]: `calc(${ARM(k)} * ${v(corner, 'gapk')})`,
    [name('x')]: times('kx'),
    [name('y')]: times('ky'),
    // Where an edge starts: past the shape and the gap of a bracket.
    [name('rx')]: `calc(${s} * ${v(corner, 'kx')} + var(${name('gap')}))`,
    [name('ry')]: `calc(${s} * ${v(corner, 'ky')} + var(${name('gap')}))`,
    [name('arm')]: `calc(${ARM(k)} * ${v(corner, 'armk')})`,
    ...Object.fromEntries(
      Array.from({ length: POINTS }, (_, i) => [
        [name(`${i}x`), times(`k${i}x`)],
        [name(`${i}y`), times(`k${i}y`)],
      ]).flat(),
    ),
    ...layer('a'),
    ...layer('b'),
  };
}

/** The lengths of the frame in scale `k`, on the root: the widths of the sides and every corner. */
const scaleLengths = (k) => ({
  ...Object.fromEntries(SIDES.map((side) => [`--fx${k}-ew-${side}`, `var(--corner-${side}-width, ${SCALES[k].ew})`])),
  ...Object.assign({}, ...CORNERS.map((corner) => cornerLengths(corner, k))),
});

/** What a framed element in scale `k` draws: its outline and background layers, from the lengths of the root. */
const element = (k) => ({
  '--fx-el-clip': clip(k),
  '--fx-el-img': column(layers(k), 0),
  '--fx-el-size': column(layers(k), 1),
  '--fx-el-pos': column(layers(k), 2),
});

/** The numbers of a shape at a corner, declared on the root only, and the images of its lines. */
function shapeNumbers(corner, shape) {
  const layers = strokes(corner, shape);
  return {
    ...Object.fromEntries(
      cornerSteps(corner, shape).flatMap(([x, y], i) => [
        [`--fx-${corner}-k${i}x`, x],
        [`--fx-${corner}-k${i}y`, y],
      ]),
    ),
    [`--fx-${corner}-kx`]: SHAPES[shape].x,
    [`--fx-${corner}-ky`]: SHAPES[shape].y,
    ...Object.fromEntries(
      ['a', 'b'].flatMap((name, i) =>
        Object.entries(layers[i]).map(([key, value]) => [`--fx-${corner}-${name}-${key}`, value]),
      ),
    ),
  };
}

/**
 * The registered custom properties of the frame (issue #45). WebKit compares
 * the value of every inherited custom property on every element when the page
 * restyles, and a value with `var()` costs as much as its tokens; a slider
 * then took a second per step. So:
 * - the numbers that only the root reads do not inherit;
 * - the lengths, colours and images that the framed elements read are typed,
 *   so the root computes them once to a single value;
 * - what a framed element draws is its own and does not inherit either.
 * A browser without `@property` inherits them all as plain values (slower).
 */
export function registered() {
  const scales = Object.keys(SCALES);
  const own = ['s', 'gap'];
  const numbers = CORNERS.flatMap((corner) =>
    Object.keys(shapeNumbers(corner, 'square')).filter((name) => !name.endsWith('-img')),
  );
  const looks = CORNERS.flatMap((corner) => ['tickk', 'armk', 'gapk'].map((name) => `--fx-${corner}-${name}`));
  const lengths = scales.flatMap((k) => Object.keys(scaleLengths(k)));
  const rootOnly = lengths.filter((name) => own.some((key) => name.endsWith(`-${key}`)));
  return {
    rootOnly: [...numbers, ...looks, ...rootOnly],
    lengths: [...lengths.filter((name) => !rootOnly.includes(name)), ...CORNERS.map((corner) => `--fx-${corner}-w`)],
    colors: CORNERS.map((corner) => `--fx-${corner}-col`),
    images: CORNERS.flatMap((corner) => [`--fx-${corner}-a-img`, `--fx-${corner}-b-img`]),
    element: Object.keys(element('p')),
  };
}
/** One registration per line: there are several hundred. */
const property = (name, syntax, inherits, initial) =>
  `@property ${name} { syntax: '${syntax}'; inherits: ${inherits};${initial ? ` initial-value: ${initial};` : ''} }\n`;

/** The stylesheet that registers the custom properties of the frame (src/skins.frames.properties.css). */
export function propertiesCss() {
  const types = registered();
  return [
    '/* Generated by src/skins.frames.js (npm run build:frames); do not edit.\n' +
      '   The custom properties of the custom frame (issue #45): the numbers of the\n' +
      '   root do not inherit, the lengths, colours and images are typed (the root\n' +
      '   computes them once), and what a framed element draws stays on it. */\n',
    ...types.rootOnly.map((name) => property(name, '*', false)),
    ...types.lengths.map((name) => property(name, '<length>', true, '0px')),
    ...types.colors.map((name) => property(name, '<color>', true, 'transparent')),
    ...types.images.map((name) => property(name, '<image> | none', true, 'none')),
    ...types.element.map((name) => property(name, '*', false)),
  ].join('');
}

/** The whole stylesheet of the custom frames. */
export function framesCss() {
  const out = [
    '/* Generated by src/skins.frames.js (npm run build:frames); do not edit.\n' +
      '   The custom frame of the futuristic skin (issue #15): every corner has its own\n' +
      '   shape (clip-path points), size, width and line (background layers). Outer\n' +
      '   panels, inner blocks and controls share it in their own scale (issue #45):\n' +
      '   the chosen shapes and lines put numbers on the root, the root turns them into\n' +
      '   typed lengths of every scale, and each framed element draws its outline and\n' +
      '   layers from the lengths of its scale. */\n',
  ];
  out.push(
    rule(FRAME, {
      '--fx-border-w': '0px',
      '--fx-ew': 'var(--future-border, 1px)',
      ...scaleLengths('p'),
      ...scaleLengths('b'),
      ...scaleLengths('c'),
      // The other frames draw with these; a framed element draws with --fx-el-*.
      '--fx-clip': 'none',
      '--fx-frame-img': 'none',
      '--fx-frame-size': 'auto',
      '--fx-frame-pos': '0 0',
      '--fx-bar-start': `calc(${len('p', 'tl', 'rx')} + ${len('p', 'tl', 'arm')})`,
    }),
  );
  // The scale of the corners: outer panels 1, inner blocks and small items the
  // block scale, controls the control scale. No specificity, so nothing else changes.
  out.push(rule(each('', CONTROLS), { '--fx-scale': SCALES.c.scale }));
  out.push(rule(each('', PANELS), { '--fx-scale': SCALES.p.scale }));
  out.push(rule(`${INNER.replace(':is(', ':where(')},\n${each('', BLOCKS)}`, { '--fx-scale': SCALES.b.scale }));
  // Controls draw their edges as wide as their border.
  out.push(rule(each(`${FUTURE} `, CONTROLS), { '--fx-ew': SCALES.c.ew }));
  // Each panel draws the frame of its scale; inner blocks come later and win.
  out.push(rule(each(`${FRAME} `, PANELS), element('p')));
  out.push(rule(`${FRAME} ${INNER.replace(':is(', ':where(')},\n${each(`${FRAME} `, BLOCKS)}`, element('b')));
  EDGES.forEach((edge) =>
    out.push(
      rule(`:root[data-corner-edges='${edge}']`, {
        '--fx-ec': EDGE_LOOK[edge].ec,
        '--fx-ce-col': EDGE_LOOK[edge].col,
      }),
    ),
  );
  // The style of the edges: panels follow the corner settings (only controls
  // change the colour of their edges, so the panels take the images of the
  // root), controls the border style of the controls.
  EDGE_STYLES.forEach((style) => {
    if (style !== 'double') out.push(rule(`:root[data-corner-edge-style='${style}']`, edgeImages(style)));
  });
  EDGE_STYLES.forEach((style) =>
    out.push(rule(each(`:root[data-ui-border-style='${style}'] `, CONTROLS), edgeImages(style))),
  );
  out.push(...blockRules(), ...controlRules(), ...layerRules());
  return out.join('\n');
}

/**
 * The numbers of the chosen shape and line of every corner, on the root only
 * (src/skins.frames.corners.css): an attribute of <html> then never makes the
 * browser look at the elements of the page.
 */
export function cornersCss() {
  const out = [
    '/* Generated by src/skins.frames.js (npm run build:frames); do not edit.\n' +
      '   The shape and the line of every corner of the custom frame (issues #15 and\n' +
      '   #45) as numbers in corner sizes and images, on the root only; the frame rule\n' +
      '   of skins.frames.css turns them into lengths on every framed element. */\n',
  ];
  CORNERS.forEach((corner) => {
    Object.keys(SHAPES).forEach((shape) =>
      out.push(rule(`:root[data-corner-${corner}-shape='${shape}']`, shapeNumbers(corner, shape))),
    );
    LINES.forEach((line) =>
      out.push(
        rule(
          `:root[data-corner-${corner}-line='${line}']`,
          Object.fromEntries(
            Object.entries(LOOK[line]).map(([name, value]) => [
              `--fx-${corner}-${name}`,
              // The width of a corner: its own setting (apply.js) or the one of its line.
              name === 'w' ? `var(--corner-${corner}-width, ${value})` : value,
            ]),
          ),
        ),
      ),
    );
  });
  return out.join('\n');
}

/** Inner blocks drawn with a plain line instead of the frame. */
function blockRules() {
  const line = `${FRAME}[data-corner-blocks='line']`;
  return [
    rule(`${line} ${INNER},\n${line} :is(${list(BLOCKS)})`, {
      '--fx-frame-img': 'none',
      '--fx-frame-under': 'none',
      '--fx-frame-size': 'auto',
      '--fx-frame-pos': '0 0',
      '--fx-bar-img': 'none',
      '--fx-clip': 'none',
      '--fx-el-img': 'none',
      '--fx-el-size': 'auto',
      '--fx-el-pos': '0 0',
      '--fx-el-clip': 'none',
      '--fx-border-w': 'var(--future-border, 1px)',
      '--ui-panel-width': 'var(--future-border, 1px)',
      'border-color': 'rgb(var(--accent-rgb) / 0.2)',
      'box-shadow': 'none',
    }),
  ];
}

/** Buttons, fields and the like draw the frame over their fill and are cut by its shape. */
function controlRules() {
  // (0,7,1) and more: above the control rules of ui.css, including hover and
  // pressed states. One selector for every control (no `:is()` list), so a
  // browser tries each one only on the elements of its class or tag.
  const strong = `:root:root:root${FRAME.slice(':root'.length)}:not([data-corner-controls='border'])`;
  const controls = (state = '') => CONTROLS.map((control) => `${strong} ${control}${state}`).join(',\n');
  return [
    rule(controls(), {
      // A control may keep an image of its own (a palette chip) under the frame.
      // The corners of the root, the edges in the colour and style of this control.
      // Straight from the lengths of the root: no custom property of its own.
      'background-image': `${column(layers('c'), 0)},\n    var(--fx-control-img, none)`,
      'background-size': `${column(layers('c'), 1)},\n    100% 100%`,
      'background-position': `${column(layers('c'), 2)},\n    0 0`,
      'background-repeat': 'no-repeat',
      'background-origin': 'border-box',
      'border-color': 'transparent',
      'border-radius': '0',
      'clip-path': clip('c'),
    }),
    // Hover, pressed, current and focused controls light their edges up instead of the border.
    rule(
      [
        ':hover:not(:disabled)',
        "[aria-pressed='true']",
        "[aria-current='page']",
        "[aria-selected='true']",
        '.is-active',
        '.button--primary',
        ':focus-visible',
        ':focus',
      ]
        .map((state) => controls(state))
        .join(',\n'),
      { '--fx-ec': 'var(--accent)' },
    ),
    // The primary button keeps a fill of the accent (its gradient was a background image).
    rule(controls('.button--primary'), {
      'background-color': 'color-mix(in srgb, var(--accent) 20%, var(--ui-control-fill, transparent))',
    }),
    // The outline of the focus would be cut by the shape, so it is drawn inside.
    rule(controls(':focus-visible'), { 'outline-offset': 'calc(-1 * var(--ui-focus-width, 2px))' }),
  ];
}

/** The corner layer above the content: an overlay of the frame on every panel. */
function layerRules() {
  const top = `${FRAME}:not([data-corner-layer='below'])`;
  return [
    rule(top, { '--fx-frame-under': LAYERS.map(() => 'none').join(', ') }),
    // No specificity: a panel that is positioned already keeps its position.
    rule(each(`:where(${top}) `, PANELS), { position: 'relative' }),
    // One selector for every panel, so a browser tries each one only on the elements of its class.
    rule(PANELS.map((panel) => `${top} ${panel}::after`).join(',\n'), {
      content: "''",
      position: 'absolute',
      inset: '0',
      'z-index': '1',
      'pointer-events': 'none',
      // The layers of the panel (they do not inherit by themselves).
      '--fx-el-img': 'inherit',
      '--fx-el-size': 'inherit',
      '--fx-el-pos': 'inherit',
      'background-image': 'var(--fx-el-img)',
      'background-size': 'var(--fx-el-size)',
      'background-position': 'var(--fx-el-pos)',
      'background-repeat': 'no-repeat',
    }),
  ];
}
