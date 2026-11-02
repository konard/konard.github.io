// Issue #49: "We need to make sure all UI elements with borders are
// configurable" and "We also need to add configuration of borders on hover,
// focus, outline and so on". Writes src/ui.borders.css (npm run build:frames)
// from the lists of src/skins.frames.js, so a panel or a control added there is
// covered here too:
// - the lines between the parts of a page follow `ui.lines` and the settings of
//   the lines (they had a border of their own that no setting changed);
// - the chips, tabs and badges outside the futuristic skin follow the width and
//   the style of the borders of the controls (only buttons and fields did);
// - panels that are not outer panels follow the width and style of the panels;
// - hovered, chosen and pressed controls and panels take the colour and the
//   style of `ui.hoverEdge`, `ui.hoverStyle`, `ui.activeEdge` and
//   `ui.activeStyle`; "As in the skin" (the default) adds no rule at all.
import { CONTROLS, EDGE_STYLES, PANELS, STRONG, edgeImages, list, rule } from './skins.frames.js';

/** Lines between the parts of a page, by the side of the element they are on. */
export const LINES = {
  top: ['.nav', '.footer', '.timeline__row', '.habr-card__stats', '.post__fallback', '.link-card__fields', '.setting'],
  bottom: ['.topbar', '.cv__heading', '.post__head'],
};

/**
 * Bordered controls that the control rule of ui.css (buttons and fields) did
 * not reach. The futuristic skin gives them the width of its own border
 * (`future.border`) or the frame of their level.
 */
export const OTHER_CONTROLS = [
  '.chip',
  '.tags li',
  '.repo__fields li',
  '.segmented',
  '.prefs__langs',
  '.pages a',
  '.role-tabs a',
  '.hero__kicker',
  '.habr__status',
  '.ui-color__swatch',
  '.palettes__chip',
  '.corner-tile',
];

/** Bordered boxes that are not outer panels: they follow the width and style of the panels. */
export const OTHER_PANELS = ['.settings__json', '.level-preview'];

/**
 * Not configured on purpose: the mini panels of the presets show how another
 * look draws a panel, so they keep the borders of that look.
 */
export const EXCLUDED = ['.preset__panel'];

/** Everything whose border changes on hover or when chosen, each once. */
export const STATEFUL = [...new Set([...CONTROLS, ...OTHER_CONTROLS, ...PANELS])];

/** The states of a chosen, pressed or current element. */
export const ACTIVE = [
  "[aria-pressed='true']",
  "[aria-current='page']",
  "[aria-selected='true']",
  '.is-active',
  '.button--primary',
];

const COLOR = { accent: 'var(--accent)', accent2: 'var(--accent-2)', text: 'var(--text)' };
const EDGE = { ...COLOR, strong: 'var(--border-strong)' };
const STYLES = EDGE_STYLES;
const mix = (color, opacity) => `color-mix(in srgb, ${color} calc(${opacity} * 100%), transparent)`;
const states = (state) => STATEFUL.map((element) => `${element}${state}`);
// As specific as the hover, so the chosen state that comes later wins.
const ACTIVE_STATE = `:is(${ACTIVE.join(', ')}):not(:disabled)`;
const HOVER_STATE = ':hover:not(:disabled)';

function variables() {
  return [
    ...Object.entries(COLOR).map(([name, color]) =>
      rule(`:root[data-ui-line-color='${name}']`, { '--ui-line-color': mix(color, 'var(--ui-line-opacity, 0.2)') }),
    ),
    ...STYLES.map((style) => rule(`:root[data-ui-line-style='${style}']`, { '--ui-line-style': style })),
    ...Object.entries(EDGE).map(([name, color]) =>
      rule(`:root[data-ui-hover-edge='${name}']`, { '--ui-hover-edge': color }),
    ),
    ...Object.entries(EDGE).map(([name, color]) =>
      rule(`:root[data-ui-active-edge='${name}']`, { '--ui-active-edge': color }),
    ),
    ...STYLES.map((style) => rule(`:root[data-ui-hover-style='${style}']`, { '--ui-hover-style': style })),
    ...STYLES.map((style) => rule(`:root[data-ui-active-style='${style}']`, { '--ui-active-style': style })),
    ...Object.entries(COLOR).map(([name, color]) =>
      rule(`:root[data-ui-focus-color='${name}']`, { '--ui-focus-color': color }),
    ),
    ...STYLES.map((style) => rule(`:root[data-ui-focus-style='${style}']`, { '--ui-focus-style': style })),
  ];
}

function lineRules() {
  const own = ":root:root[data-ui-lines='own']";
  return Object.entries(LINES).flatMap(([side, elements]) => [
    rule(`${own} :is(${list(elements)})`, {
      [`border-${side}-width`]: 'var(--ui-line-width, 1px)',
      [`border-${side}-style`]: 'var(--ui-line-style, solid)',
    }),
    rule(`${own}:not([data-ui-line-color='skin']) :is(${list(elements)})`, {
      [`border-${side}-color`]: 'var(--ui-line-color)',
    }),
  ]);
}

function borderRules() {
  return [
    // The futuristic skin has a border width of its own, and frames of the levels.
    rule(`:root:root:not([data-skin-name='futuristic']) :is(${list(OTHER_CONTROLS)})`, {
      'border-width': 'var(--ui-control-border, 1px)',
      'border-style': 'var(--ui-border-style, solid)',
    }),
    rule(`:root:root :is(${list(OTHER_PANELS)})`, {
      'border-width': 'var(--ui-panel-width, var(--ui-panel-border, 1px))',
      'border-style': 'var(--ui-border-style, solid)',
    }),
    // The floating top bar of the liquid skin: its rows are pills with a border.
    rule(":root:root[data-skin-name='liquid'][data-liquid-float='true'] .topbar > *", {
      'border-width': 'var(--ui-control-border, 1px)',
      'border-style': 'var(--ui-border-style, solid)',
    }),
    // The sheet of the CV has a border on a dark page only.
    rule(":root:root:not([data-theme='light']) .cv-paper", {
      'border-width': 'var(--ui-panel-border, 1px)',
      'border-style': 'var(--ui-border-style, solid)',
    }),
  ];
}

/**
 * Hover first, then chosen: a chosen element under the pointer shows that it is
 * chosen. The focus ring is the outline of ui.css. The rules of the custom
 * frame (a transparent border) are more specific, so a framed control keeps it.
 */
function stateRules() {
  const edge = (attr, name) => `:root:root:root:not([data-ui-${attr}='${name}'])`;
  return [
    rule(`${edge('hover-edge', 'skin')} :is(${list(states(HOVER_STATE))})`, {
      'border-color': 'var(--ui-hover-edge)',
    }),
    rule(`${edge('hover-style', 'same')} :is(${list(states(HOVER_STATE))})`, {
      'border-style': 'var(--ui-hover-style)',
    }),
    rule(`${edge('active-edge', 'skin')} :is(${list(states(ACTIVE_STATE))})`, {
      'border-color': 'var(--ui-active-edge)',
    }),
    rule(`${edge('active-style', 'same')} :is(${list(states(ACTIVE_STATE))})`, {
      'border-style': 'var(--ui-active-style)',
    }),
  ];
}

/**
 * The custom frame of the futuristic skin draws the edges of panels and
 * controls as images in the colour `--fx-ec`: the hover and chosen states
 * change that colour and the images of the edges on the element itself.
 */
function frameRules() {
  const out = [];
  for (const [attr, state, skip] of [
    ['hover', HOVER_STATE, 'skin'],
    ['active', ACTIVE_STATE, 'skin'],
  ]) {
    const elements = (root, targets = STATEFUL) =>
      `${root} :is(${list(targets.map((element) => `${element}${state}`))})`;
    out.push(
      rule(elements(`${STRONG}:not([data-ui-${attr}-edge='${skip}'])`), { '--fx-ec': `var(--ui-${attr}-edge)` }),
    );
    // The images of the edges in the style of the state. Controls declare the
    // images of their edges themselves, so a new colour reaches them; panels
    // take the images of the root, so they are declared again on the panel.
    for (const style of STYLES) {
      const selectors = [elements(`${STRONG}[data-ui-${attr}-style='${style}']`)];
      if (style !== 'double')
        selectors.push(
          elements(
            `${STRONG}[data-ui-${attr}-style='same'][data-corner-edge-style='${style}']:not([data-ui-${attr}-edge='${skip}'])`,
            PANELS,
          ),
        );
      out.push(rule(selectors.join(',\n'), edgeImages(style)));
    }
  }
  return out;
}

export function bordersCss() {
  return [
    '/* Generated by src/ui.borders.js (npm run build:frames); do not edit.\n' +
      '   Issue #49: the borders that no setting changed (lines between the parts of\n' +
      '   a page, chips, tabs and badges, boxes that are not panels) and the borders\n' +
      '   of hovered, chosen and pressed elements. */\n',
    '@media screen {\n',
    ...variables(),
    ...lineRules(),
    ...borderRules(),
    ...stateRules(),
    ...frameRules(),
    '}\n',
  ].join('\n');
}
