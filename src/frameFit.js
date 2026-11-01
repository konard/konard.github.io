// Corners of the frame by the size of the element (issue #47: "configure
// CORNERS OF THE FRAME based on conditions like minimum/maximum height/width of
// the UI element"). A stylesheet cannot select an element by its own size, so
// this script measures the framed elements of every level with limits and marks
// those outside them with `data-fx-fit="<level>"`; src/skins.frames.fit.css then
// draws their corners times the fit scale of the level.
//
// It costs nothing until a level has limits: then one ResizeObserver measures
// the elements of those levels (the browser reports a size only when it
// changes, after layout, so reading it forces no layout), and one
// MutationObserver finds the elements a new page adds. An attribute is written
// only when it changes.
import { BLOCKS, CONTROL_TYPES, INNER, PANELS } from './skins.frames.js';
import { FIT_ATTR, FIT_LEVELS } from './skins.frames.fit.js';
import { drawsFrame, FIT_LIMITS, hasFitLimits, levelKey } from './settings/schema.skins.js';

/** Turn on to log every element that changes its mark (`localStorage.debugFrameFit = '1'`). */
const debug = () => {
  try {
    return globalThis.localStorage?.getItem('debugFrameFit') === '1';
  } catch {
    return false;
  }
};

const CONTROL_SELECTORS = Object.entries(CONTROL_TYPES).map(([type, selectors]) => [type, selectors.join(', ')]);
const BLOCK_SELECTOR = `${INNER}, ${BLOCKS.join(', ')}`;
const PANEL_SELECTOR = PANELS.join(', ');

/** The level of the frame an element draws: a type of control, an inner block or an outer panel. */
export function levelOf(element) {
  for (const [type, selector] of CONTROL_SELECTORS) if (element.matches(selector)) return type;
  if (element.matches(BLOCK_SELECTOR)) return 'block';
  if (element.matches(PANEL_SELECTOR)) return 'panel';
  return null;
}

/**
 * The limits of every level that has some and draws the frame,
 * `{ button: [minWidth, maxWidth, minHeight, maxHeight] }` (0 is no limit), or
 * null when no element needs measuring (another skin or frame, or no limits).
 */
export function limitsOf(settings) {
  if (settings['skin.name'] !== 'futuristic' || settings['future.frame'] !== 'custom') return null;
  const levels = FIT_LEVELS.filter((level) => drawsFrame(level, settings) && hasFitLimits(level, settings));
  if (!levels.length) return null;
  return Object.fromEntries(
    levels.map((level) => [level, FIT_LIMITS.map(([name]) => settings[levelKey(level, name)])]),
  );
}

/** Whether a size is outside the limits [minWidth, maxWidth, minHeight, maxHeight]; 0 is no limit. */
export const outside = ([minWidth, maxWidth, minHeight, maxHeight], width, height) =>
  (minWidth > 0 && width < minWidth) ||
  (maxWidth > 0 && width > maxWidth) ||
  (minHeight > 0 && height < minHeight) ||
  (maxHeight > 0 && height > maxHeight);

/** The selector of every element a level with limits draws. */
const selectorOf = (limits) =>
  [
    ...(limits.panel || limits.block ? [PANEL_SELECTOR] : []),
    ...(limits.block ? [BLOCKS.join(', ')] : []),
    ...CONTROL_SELECTORS.filter(([type]) => limits[type]).map(([, selector]) => selector),
  ].join(', ');

/** The border box of an observed element. */
function sizeOf(entry) {
  const box = entry.borderBoxSize?.[0];
  if (box) return [box.inlineSize, box.blockSize];
  const rect = entry.target.getBoundingClientRect();
  return [rect.width, rect.height];
}

/**
 * Keeps the marks of the page up to date with the settings: `getSettings`
 * returns them, `subscribe(listener)` calls back when they change. Returns a
 * function that stops and removes every mark.
 */
export function watchFrameFit(getSettings, subscribe, root = document.documentElement) {
  if (typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') return () => {};
  let limits = null;
  let key = 'null';
  let sizes = null;
  let mutations = null;
  let levels = new WeakMap();
  const observed = new Set();

  const mark = (element, width, height) => {
    if (!levels.has(element)) levels.set(element, levelOf(element));
    const level = levels.get(element);
    const value = level && limits?.[level] && outside(limits[level], width, height) ? level : null;
    if (element.getAttribute(FIT_ATTR) === value) return;
    if (value) element.setAttribute(FIT_ATTR, value);
    else element.removeAttribute(FIT_ATTR);
    if (debug()) console.log('[frame-fit]', value ?? 'inside', level, Math.round(width), Math.round(height), element);
  };

  const observe = (element) => {
    if (observed.has(element)) return;
    observed.add(element);
    sizes.observe(element);
  };
  const forget = (element) => {
    if (!observed.delete(element)) return;
    sizes.unobserve(element);
  };
  /** `node` and the elements inside it that match `selector`. */
  const within = (node, selector) =>
    node.nodeType === 1 ? [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)] : [];

  const stop = () => {
    sizes?.disconnect();
    mutations?.disconnect();
    sizes = mutations = null;
    observed.clear();
    root.querySelectorAll(`[${FIT_ATTR}]`).forEach((element) => element.removeAttribute(FIT_ATTR));
  };

  const start = () => {
    const selector = selectorOf(limits);
    levels = new WeakMap();
    sizes = new ResizeObserver((entries) => entries.forEach((entry) => mark(entry.target, ...sizeOf(entry))));
    mutations = new MutationObserver((records) =>
      records.forEach((record) => {
        record.addedNodes.forEach((node) => within(node, selector).forEach(observe));
        // Forget the elements that left the page, or the observer keeps them.
        record.removedNodes.forEach((node) => within(node, selector).forEach(forget));
      }),
    );
    mutations.observe(root, { childList: true, subtree: true });
    // The first report of every observed element marks it.
    within(root, selector).forEach(observe);
  };

  const sync = () => {
    const next = limitsOf(getSettings());
    const nextKey = JSON.stringify(next);
    if (nextKey === key) return;
    key = nextKey;
    stop();
    limits = next;
    if (limits) start();
  };

  sync();
  const unsubscribe = subscribe(sync);
  return () => {
    unsubscribe();
    stop();
  };
}
