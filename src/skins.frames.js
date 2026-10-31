// Frames with every corner on its own (issue #15: "each corner must be
// configurable", with cuts, rounded corners and corners with a missing
// border). This file describes the corner shapes once; the same numbers draw
// the preview tiles on the settings page and generate src/skins.frames.css
// (`npm run build:frames`; a test checks that the stylesheet is up to date).
// It imports nothing, so a plain Node script can run it.

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
const right = (corner) => corner === 'tr' || corner === 'br';
const bottom = (corner) => corner === 'br' || corner === 'bl';

/** `coefficient` × the corner size as a CSS length. */
const size = (corner, coefficient) => {
  if (coefficient === 0) return '0px';
  if (coefficient === 1) return v(corner, 's');
  return `calc(${v(corner, 's')} * ${coefficient})`;
};

/** A point of the top left shape moved to `corner`, as a polygon point. */
const point = (corner, [x, y]) => {
  const along = (flip, value) => (flip ? (value === '0px' ? '100%' : `calc(100% - ${value})`) : value);
  return `${along(right(corner), size(corner, x))} ${along(bottom(corner), size(corner, y))}`;
};

/** The outline of `shape` at `corner` in the clockwise order of the polygon. */
export const cornerPoints = (corner, shape) => {
  const points = SHAPES[shape].points.map((p) => point(corner, p));
  // Top right and bottom left go from the horizontal edge to the vertical one.
  return corner === 'tr' || corner === 'bl' ? points.reverse() : points;
};

/** A background position `x` from the side and `y` from the top or bottom of the corner. */
const at = (corner, x, y) => `${right(corner) ? 'right' : 'left'} ${x} ${bottom(corner) ? 'bottom' : 'top'} ${y}`;

const DIAGONAL = { tl: 'to bottom right', tr: 'to bottom left', br: 'to top left', bl: 'to top right' };
const OUTSIDE = { tl: '100% 100%', tr: '0 100%', br: '0 0', bl: '100% 0' };
const INSIDE = { tl: '0 0', tr: '100% 0', br: '100% 100%', bl: '0 100%' };

/** The two line layers of a shape at a corner: [image, size, position]. */
function strokes(corner, shape) {
  const col = v(corner, 'col');
  const w = v(corner, 'w');
  const s = v(corner, 's');
  const solid = `linear-gradient(${col}, ${col})`;
  const none = ['none', '0px 0px', '0 0'];
  const { x, y } = SHAPES[shape];
  switch (shape) {
    case 'square': {
      const tick = v(corner, 'tick');
      return [
        [solid, `${tick} ${w}`, at(corner, 0, 0)],
        [solid, `${w} ${tick}`, at(corner, 0, 0)],
      ];
    }
    case 'cut':
    case 'tall':
    case 'wide':
      return [
        [
          `linear-gradient(${DIAGONAL[corner]}, transparent 50%, ${col} 50% calc(50% + ${w}), transparent 0)`,
          `${size(corner, x)} ${size(corner, y)}`,
          at(corner, 0, 0),
        ],
        none,
      ];
    case 'round':
      return [
        [
          `radial-gradient(circle at ${OUTSIDE[corner]}, transparent calc(${s} - ${w}), ${col} calc(${s} - ${w}) ${s}, transparent ${s})`,
          `${s} ${s}`,
          at(corner, 0, 0),
        ],
        none,
      ];
    case 'scoop':
      return [
        [
          `radial-gradient(circle at ${INSIDE[corner]}, transparent ${s}, ${col} ${s} calc(${s} + ${w}), transparent calc(${s} + ${w}))`,
          `calc(${s} + ${w}) calc(${s} + ${w})`,
          at(corner, 0, 0),
        ],
        none,
      ];
    default:
      // notch: a step into the panel, two lines.
      return [
        [solid, `${s} ${w}`, at(corner, 0, s)],
        [solid, `${w} ${s}`, at(corner, s, 0)],
      ];
  }
}

/** What a corner line sets: colour, width, the tick of a square corner, arms and the gap of the edges. */
const LOOK = {
  none: { col: 'transparent', w: 'var(--future-border, 1px)', tick: '0px', arm: '0px', gap: '0px' },
  gap: { col: 'transparent', w: 'var(--future-border, 1px)', tick: '0px', arm: '0px', gap: 'var(--fx-k)' },
  line: { col: 'var(--fx-ce-col)', w: 'var(--future-border, 1px)', tick: '0px', arm: '0px', gap: '0px' },
  accent: { col: 'var(--fx-line)', w: 'var(--fx-b)', tick: 'S', arm: '0px', gap: '0px' },
  bracket: { col: 'var(--fx-line)', w: 'var(--fx-b)', tick: '0px', arm: 'var(--fx-k)', gap: '0px' },
};

const EDGE_LOOK = {
  none: { img: 'none', col: 'rgb(var(--accent-rgb) / 0.3)' },
  faint: {
    img: 'linear-gradient(rgb(var(--accent-rgb) / 0.3), rgb(var(--accent-rgb) / 0.3))',
    col: 'rgb(var(--accent-rgb) / 0.3)',
  },
  line: { img: 'var(--fx-l)', col: 'var(--fx-line)' },
};

const rule = (selector, declarations) =>
  `${selector} {\n${Object.entries(declarations)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')}\n}\n`;

/** The layers of one corner: two lines of the shape and two arms. */
function cornerLayers(corner) {
  const col = v(corner, 'col');
  const w = v(corner, 'w');
  const arm = v(corner, 'arm');
  const solid = `linear-gradient(${col}, ${col})`;
  return [
    [v(corner, 'a-img'), v(corner, 'a-size'), v(corner, 'a-pos')],
    [v(corner, 'b-img'), v(corner, 'b-size'), v(corner, 'b-pos')],
    [solid, `${arm} ${w}`, at(corner, v(corner, 'x'), 0)],
    [solid, `${w} ${arm}`, at(corner, 0, v(corner, 'y'))],
  ];
}

/** The four edges between the corners, shortened by the shapes and the gaps. */
function edgeLayers() {
  const reach = (corner, axis) => `${v(corner, axis)} + ${v(corner, 'gap')}`;
  const span = (a, b, axis) => `max(0px, calc(100% - (${reach(a, axis)}) - (${reach(b, axis)})))`;
  const img = 'var(--fx-ce-img)';
  const w = 'var(--fx-ew)';
  return [
    [img, `${span('tl', 'tr', 'x')} ${w}`, `left calc(${reach('tl', 'x')}) top 0`],
    [img, `${w} ${span('tr', 'br', 'y')}`, `right 0 top calc(${reach('tr', 'y')})`],
    [img, `${span('bl', 'br', 'x')} ${w}`, `left calc(${reach('bl', 'x')}) bottom 0`],
    [img, `${w} ${span('tl', 'bl', 'y')}`, `left 0 top calc(${reach('tl', 'y')})`],
  ];
}

const FRAME = ":root[data-skin-name='futuristic'][data-future-frame='custom']";

/** The whole stylesheet of the custom frames. */
export function framesCss() {
  const out = [
    '/* Generated by src/skins.frames.js (npm run build:frames); do not edit.\n' +
      '   The custom frame of the futuristic skin (issue #15): every corner has its own\n' +
      '   shape (clip-path points), size and line (background layers). */\n',
  ];
  const layers = [...CORNERS.flatMap(cornerLayers), ...edgeLayers()];
  out.push(
    rule(FRAME, {
      '--fx-border-w': '0px',
      '--fx-ew': 'var(--future-border, 1px)',
      '--fx-clip': `polygon(${CORNERS.map((corner) => v(corner, 'p')).join(', ')})`,
      '--fx-frame-img': layers.map((layer) => layer[0]).join(',\n    '),
      '--fx-frame-size': layers.map((layer) => layer[1]).join(',\n    '),
      '--fx-frame-pos': layers.map((layer) => layer[2]).join(',\n    '),
      '--fx-bar-start': `calc(${v('tl', 'x')} + ${v('tl', 'gap')} + ${v('tl', 'arm')})`,
    }),
  );
  CORNERS.forEach((corner) => {
    out.push(rule(':root', { [`--fx-${corner}-s`]: `var(--corner-${corner}-size, 14px)` }));
    Object.keys(SHAPES).forEach((shape) => {
      const [a, b] = strokes(corner, shape);
      out.push(
        rule(`:root[data-corner-${corner}-shape='${shape}']`, {
          [`--fx-${corner}-p`]: cornerPoints(corner, shape).join(', '),
          [`--fx-${corner}-x`]: size(corner, SHAPES[shape].x),
          [`--fx-${corner}-y`]: size(corner, SHAPES[shape].y),
          [`--fx-${corner}-a-img`]: a[0],
          [`--fx-${corner}-a-size`]: a[1],
          [`--fx-${corner}-a-pos`]: a[2],
          [`--fx-${corner}-b-img`]: b[0],
          [`--fx-${corner}-b-size`]: b[1],
          [`--fx-${corner}-b-pos`]: b[2],
        }),
      );
    });
    LINES.forEach((line) => {
      const look = LOOK[line];
      out.push(
        rule(
          `:root[data-corner-${corner}-line='${line}']`,
          Object.fromEntries(
            Object.entries(look).map(([name, value]) => [
              `--fx-${corner}-${name}`,
              value === 'S' ? v(corner, 's') : value,
            ]),
          ),
        ),
      );
    });
  });
  EDGES.forEach((edge) =>
    out.push(
      rule(`:root[data-corner-edges='${edge}']`, {
        '--fx-ce-img': EDGE_LOOK[edge].img,
        '--fx-ce-col': EDGE_LOOK[edge].col,
      }),
    ),
  );
  return out.join('\n');
}
