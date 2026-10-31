// Frames with every corner on its own (issue #15: "each corner must be
// configurable", with cuts, rounded corners and corners with a missing
// border). This file describes the corner shapes once; the same numbers draw
// the preview tiles on the settings page and generate src/skins.frames.css
// (`npm run build:frames`; a test checks that the stylesheet is up to date).
// It imports nothing, so a plain Node script can run it.
//
// Issue #45: outer panels, inner blocks, buttons and fields share the frame.
// Custom properties are resolved on the element that declares them, so every
// rule that depends on the size of a corner is declared both on the root and
// on every framed element (`:where(...)` adds no specificity); a framed element
// scales the corner sizes, brackets and gaps by its own `--fx-scale` (1 for an
// outer panel, the block scale for a panel inside a panel, the control scale for
// buttons and fields). Corners and edges have their own widths, the edges a
// style (solid, dashed, dotted, double), and the corner layer is drawn above
// the content of a panel (over the colour bar of a position) or below it.

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
const FRAMED = list([...PANELS, ...CONTROLS]);
/** A rule on the root and on every framed element, so the element resolves it with its own scale. */
const everywhere = (selector, elements = FRAMED) => `${selector},\n${selector} :where(${elements})`;

/** What a corner line sets: colour, width, the tick of a square corner, arms and the gap of the edges. */
const THIN = 'var(--future-border, 1px)';
const BOLD = 'var(--fx-b)';
const ARM = 'calc(var(--fx-k) * var(--fx-scale, 1))';
const LOOK = {
  none: { col: 'transparent', w: THIN, tick: '0px', arm: '0px', gap: '0px' },
  gap: { col: 'transparent', w: THIN, tick: '0px', arm: '0px', gap: ARM },
  line: { col: 'var(--fx-ce-col)', w: THIN, tick: '0px', arm: '0px', gap: '0px' },
  accent: { col: 'var(--fx-line)', w: BOLD, tick: 'S', arm: '0px', gap: '0px' },
  bracket: { col: 'var(--fx-line)', w: BOLD, tick: '0px', arm: ARM, gap: '0px' },
};

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

/** The four edges between the corners, shortened by the shapes and the gaps; each side has its width. */
function edgeLayers() {
  const reach = (corner, axis) => `${v(corner, axis)} + ${v(corner, 'gap')}`;
  const span = (a, b, axis) => `max(0px, calc(100% - (${reach(a, axis)}) - (${reach(b, axis)})))`;
  const w = (side) => `var(--fx-ew-${side})`;
  // Solid edges until the style of the edges is known.
  const H = 'var(--fx-ce-h, linear-gradient(var(--fx-ec), var(--fx-ec)))';
  const V = 'var(--fx-ce-v, linear-gradient(var(--fx-ec), var(--fx-ec)))';
  return [
    [H, `${span('tl', 'tr', 'x')} ${w('top')}`, `left calc(${reach('tl', 'x')}) top 0`],
    [V, `${w('right')} ${span('tr', 'br', 'y')}`, `right 0 top calc(${reach('tr', 'y')})`],
    [H, `${span('bl', 'br', 'x')} ${w('bottom')}`, `left calc(${reach('bl', 'x')}) bottom 0`],
    [V, `${w('left')} ${span('tl', 'bl', 'y')}`, `left 0 top calc(${reach('tl', 'y')})`],
  ];
}

const FUTURE = ":root[data-skin-name='futuristic']";
const FRAME = `${FUTURE}[data-future-frame='custom']`;
const LAYERS = [...CORNERS.flatMap(cornerLayers), ...edgeLayers()];

/** The whole stylesheet of the custom frames. */
export function framesCss() {
  const out = [
    '/* Generated by src/skins.frames.js (npm run build:frames); do not edit.\n' +
      '   The custom frame of the futuristic skin (issue #15): every corner has its own\n' +
      '   shape (clip-path points), size, width and line (background layers). Outer\n' +
      '   panels, inner blocks and controls share it in their own scale (issue #45). */\n',
  ];
  out.push(rule(FRAME, { '--fx-border-w': '0px', '--fx-ew': 'var(--future-border, 1px)' }));
  // The scale of the corners: outer panels 1, inner blocks and small items the
  // block scale, controls the control scale. No specificity, so nothing else changes.
  out.push(rule(`:where(${list(CONTROLS)})`, { '--fx-scale': 'var(--corner-control-scale, 0.35)' }));
  out.push(rule(`:where(${list(PANELS)})`, { '--fx-scale': '1' }));
  out.push(
    rule(`:where(${list(PANELS)}) :where(${list(PANELS)}),\n:where(${list(BLOCKS)})`, {
      '--fx-scale': 'var(--corner-block-scale, 0.6)',
    }),
  );
  // Controls draw their edges as wide as their border.
  out.push(rule(`${FUTURE} :where(${list(CONTROLS)})`, { '--fx-ew': 'var(--ui-control-border, 1px)' }));
  out.push(
    rule(everywhere(FRAME), {
      ...Object.fromEntries(SIDES.map((side) => [`--fx-ew-${side}`, `var(--corner-${side}-width, var(--fx-ew))`])),
      '--fx-clip': `polygon(${CORNERS.map((corner) => v(corner, 'p')).join(', ')})`,
      '--fx-frame-img': LAYERS.map((layer) => layer[0]).join(',\n    '),
      '--fx-frame-size': LAYERS.map((layer) => layer[1]).join(',\n    '),
      '--fx-frame-pos': LAYERS.map((layer) => layer[2]).join(',\n    '),
      '--fx-bar-start': `calc(${v('tl', 'x')} + ${v('tl', 'gap')} + ${v('tl', 'arm')})`,
    }),
  );
  CORNERS.forEach((corner) => {
    out.push(
      rule(everywhere(':root'), {
        [`--fx-${corner}-s`]: `calc(var(--corner-${corner}-size, 14px) * var(--fx-scale, 1))`,
      }),
    );
    Object.keys(SHAPES).forEach((shape) => {
      const [a, b] = strokes(corner, shape);
      out.push(
        rule(everywhere(`:root[data-corner-${corner}-shape='${shape}']`), {
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
          everywhere(`:root[data-corner-${corner}-line='${line}']`),
          Object.fromEntries(
            Object.entries(look).map(([name, value]) => [
              `--fx-${corner}-${name}`,
              // The width of a corner: its own setting (apply.js) or the one of its line.
              name === 'w' ? `var(--corner-${corner}-width, ${value})` : value === 'S' ? v(corner, 's') : value,
            ]),
          ),
        ),
      );
    });
  });
  EDGES.forEach((edge) =>
    out.push(
      rule(`:root[data-corner-edges='${edge}']`, {
        '--fx-ec': EDGE_LOOK[edge].ec,
        '--fx-ce-col': EDGE_LOOK[edge].col,
      }),
    ),
  );
  // The style of the edges: panels follow the corner settings, controls the border style of the controls.
  EDGE_STYLES.forEach((style) => {
    if (style !== 'double')
      out.push(rule(everywhere(`:root[data-corner-edge-style='${style}']`, list(PANELS)), edgeImages(style)));
  });
  EDGE_STYLES.forEach((style) =>
    out.push(rule(`:root[data-ui-border-style='${style}'] :where(${list(CONTROLS)})`, edgeImages(style))),
  );
  out.push(...blockRules(), ...controlRules(), ...layerRules());
  return out.join('\n');
}

/** Inner blocks drawn with a plain line instead of the frame. */
function blockRules() {
  const line = `${FRAME}[data-corner-blocks='line']`;
  return [
    rule(`${line} :is(${list(PANELS)}) :is(${list(PANELS)}),\n${line} :is(${list(BLOCKS)})`, {
      '--fx-frame-img': 'none',
      '--fx-frame-under': 'none',
      '--fx-frame-size': 'auto',
      '--fx-frame-pos': '0 0',
      '--fx-bar-img': 'none',
      '--fx-clip': 'none',
      '--fx-border-w': 'var(--future-border, 1px)',
      '--ui-panel-width': 'var(--future-border, 1px)',
      'border-color': 'rgb(var(--accent-rgb) / 0.2)',
      'box-shadow': 'none',
    }),
  ];
}

/** Buttons, fields and the like draw the frame over their fill and are cut by its shape. */
function controlRules() {
  const controls = `${FRAME}:not([data-corner-controls='border']) :is(${list(CONTROLS)})`;
  // (0,6,0) and more: above the control rules of ui.css, including hover and pressed states.
  const strong = `:root:root${controls.slice(':root'.length)}`;
  return [
    rule(strong, {
      // A control may keep an image of its own (a palette chip) under the frame.
      'background-image': 'var(--fx-frame-img), var(--fx-control-img, none)',
      'background-size': 'var(--fx-frame-size), 100% 100%',
      'background-position': 'var(--fx-frame-pos), 0 0',
      'background-repeat': 'no-repeat',
      'background-origin': 'border-box',
      'border-color': 'transparent',
      'border-radius': '0',
      'clip-path': 'var(--fx-clip)',
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
        .map((state) => `${strong}${state}`)
        .join(',\n'),
      { '--fx-ec': 'var(--accent)' },
    ),
    // The primary button keeps a fill of the accent (its gradient was a background image).
    rule(`${strong}.button--primary`, {
      'background-color': 'color-mix(in srgb, var(--accent) 20%, var(--ui-control-fill, transparent))',
    }),
    // The outline of the focus would be cut by the shape, so it is drawn inside.
    rule(`${strong}:focus-visible`, { 'outline-offset': 'calc(-1 * var(--ui-focus-width, 2px))' }),
  ];
}

/** The corner layer above the content: an overlay of the frame on every panel. */
function layerRules() {
  const top = `${FRAME}:not([data-corner-layer='below'])`;
  return [
    rule(top, { '--fx-frame-under': LAYERS.map(() => 'none').join(', ') }),
    // No specificity: a panel that is positioned already keeps its position.
    rule(`:where(${top}) :where(${list(PANELS)})`, { position: 'relative' }),
    rule(`${top} :is(${list(PANELS)})::after`, {
      content: "''",
      position: 'absolute',
      inset: '0',
      'z-index': '1',
      'pointer-events': 'none',
      'background-image': 'var(--fx-frame-img)',
      'background-size': 'var(--fx-frame-size)',
      'background-position': 'var(--fx-frame-pos)',
      'background-repeat': 'no-repeat',
    }),
  ];
}
