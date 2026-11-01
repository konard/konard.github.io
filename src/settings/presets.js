// Presets (issue #15: "ability also to have multiple presets, saved and so
// on"): complete looks built into the site, looks the visitor saves in this
// browser, a random look and links that carry a look. A look is stored as its
// difference from the defaults, like the settings themselves (./store.js), and
// applying one keeps the visitor's comfort choices: the motion, whether the
// interface sounds and how loud, and the notation of the theory pages. The idea
// and the comfort rule follow konard/immortality (src/settings.ts), which has
// no saved looks.
import { normalize } from './apply';
import { isObject, readNotation, toIndented, toNested } from '../lino';
import { DEFAULTS, FIELDS, PREVIOUS_DEFAULTS, RULES } from './schema';

/** Settings that a preset, a link or the randomizer never change. */
export const COMFORT = ['motion.mode', 'sound.on', 'sound.volume', 'theory.notation', 'ui.transparency'];

/** The difference of `settings` from the defaults. */
const changes = (settings) =>
  Object.fromEntries(Object.entries(settings).filter(([key, value]) => value !== DEFAULTS[key]));

/** Only known settings with valid values, comfort settings left out. */
export function cleanLook(look) {
  if (!look || typeof look !== 'object' || Array.isArray(look)) return {};
  const known = Object.fromEntries(Object.entries(look).filter(([key]) => key in DEFAULTS && !COMFORT.includes(key)));
  return changes(normalize(RULES, { ...DEFAULTS, ...known }));
}

/** The settings after applying `look` over `current`: the look on the defaults, comfort kept. */
export function applyLook(look, current) {
  const next = normalize(RULES, { ...DEFAULTS, ...cleanLook(look) });
  for (const key of COMFORT) next[key] = current[key];
  return next;
}

/** Whether `current` is exactly the look (comfort settings aside). */
export function isLook(look, current) {
  const next = applyLook(look, current);
  return Object.keys(DEFAULTS).every((key) => next[key] === current[key]);
}

/** A built-in preset. */
const preset = (id, en, ru, enText, ruText, look) => ({ id, name: { en, ru }, text: { en: enText, ru: ruText }, look });

/**
 * A preset made before issue #45 changed the defaults: its look over the old
 * defaults (the glass universe of issue #39), so it stays as it was. Values
 * that are the new defaults are left out, as a saved look would leave them.
 */
const before45 = (id, en, ru, enText, ruText, look) =>
  preset(id, en, ru, enText, ruText, changes({ ...PREVIOUS_DEFAULTS, ...look }));

/** Turns star layer `n` on with `options` (`{ count: 300 }` → `stars2.count`). */
const layer = (n, options) =>
  Object.fromEntries([['on', true], ...Object.entries(options)].map(([key, value]) => [`stars${n}.${key}`, value]));

export const PRESETS = [
  preset(
    'default',
    'Matrix universe',
    'Вселенная матрицы',
    'The default look of issue #45: a green universe, a dashed grid, bright rain and HUD frames with corners of their own.',
    'Вид по умолчанию из задачи #45: зелёная вселенная, пунктирная сетка, яркий дождь и рамки HUD со своими углами.',
    {},
  ),
  before45(
    'glass-universe',
    'Glass universe',
    'Стеклянная вселенная',
    'The look of issue #39: the universe, a fading grid, the rain of links and glass panels.',
    'Вид из задачи #39: вселенная, затухающая сетка, дождь связей и стеклянные панели.',
    {},
  ),
  before45(
    'calm',
    'Calm',
    'Спокойствие',
    'No rain, a slow universe and a few soft stars; frosted panels.',
    'Без дождя, медленная вселенная и немного мягких звёзд; матовые панели.',
    {
      'rain.on': false,
      'nebula.speed': 0.2,
      'nebula.twinkle': 0.1,
      'grid.level': 0.5,
      ...layer(1, { count: 260, shape: 'soft', size: 2, twinkle: 0.4, speed: 1.5, brightness: 0.7 }),
      'glass.blur': 10,
      'glass.level': 0.55,
      'sound.hover1': 'halo',
      'sound.activate1': 'opal',
      'sound.activate2': 'none',
    },
  ),
  before45(
    'matrix',
    'Matrix',
    'Матрица',
    'Green terminal: bright rain of links, a dotted grid, scanlines and brackets.',
    'Зелёный терминал: яркий дождь связей, сетка из точек, линии развёртки и уголки.',
    {
      'skin.name': 'futuristic',
      'future.palette': 'matrix',
      'future.font': 'terminal',
      'future.frame': 'bracket',
      'future.surface': 'solid',
      'future.opacity': 0,
      'future.scanlines': 0.3,
      'future.title': 'slash',
      'nebula.on': false,
      'grid.style': 'dots',
      'grid.tint': 'accent',
      'rain.level': 1.3,
      'rain.glow': 10,
      'rain.glowColor': '#00ff66',
      'rain.density': 0.8,
      'sound.hover1': 'byte',
      'sound.activate1': 'mica',
      'sound.activate2': 'none',
      'sound.notify1': 'cinder',
    },
  ),
  before45(
    'deep-space',
    'Deep space',
    'Глубокий космос',
    'A bright universe with three layers of stars: dust, stars with rays and rare flares.',
    'Яркая вселенная и три слоя звёзд: пыль, звёзды с лучами и редкие вспышки.',
    {
      'nebula.level': 0.9,
      'nebula.gas': 1,
      'nebula.stars': 2,
      'nebula.speed': 0.3,
      'grid.on': false,
      'rain.on': false,
      ...layer(1, { count: 1400, size: 0.8, twinkle: 2, speed: 2 }),
      ...layer(2, {
        count: 90,
        shape: 'star4',
        motion: 'drift',
        size: 7,
        glow: 12,
        glowColor: '#9fd0ff',
        twinkle: 0.8,
        speed: 3,
      }),
      ...layer(3, {
        count: 12,
        shape: 'flare',
        motion: 'drift',
        size: 16,
        glow: 24,
        color: '#ffe6c7',
        twinkle: 1.5,
        speed: 1,
      }),
      'sound.hover1': 'ion',
      'sound.activate1': 'sonar',
      'sound.activate2': 'none',
      'sound.open1': 'vesper',
    },
  ),
  before45(
    'warp',
    'Warp',
    'Варп',
    'Stars rushing from the centre with trails, beams along the grid.',
    'Звёзды летят из центра со шлейфами, лучи бегут по сетке.',
    {
      'rain.on': false,
      'nebula.speed': 2,
      'nebula.zoom': 1.6,
      ...layer(1, { count: 700, motion: 'warp', speed: 220, streak: 8, glow: 6, size: 1.4 }),
      'beams.on': true,
      'beams.count': 10,
      'beams.speed': 600,
      'sound.open1': 'warp',
      'sound.intro1': 'warp',
    },
  ),
  before45(
    'neon',
    'Neon HUD',
    'Неоновый HUD',
    'Tron: holographic panels with cut corners, comets along a grid of crosses.',
    'Трон: голографические панели со срезанными углами, кометы по сетке из крестов.',
    {
      'skin.name': 'futuristic',
      'future.palette': 'tron',
      'future.frame': 'kranox',
      'future.surface': 'holographic',
      'future.glow': 1,
      'beams.on': true,
      'beams.count': 14,
      'beams.glow': 16,
      'grid.style': 'crosses',
      'grid.tint': 'accent',
      'rain.level': 0.5,
      'sound.hover1': 'tungsten',
      'sound.activate1': 'prism',
      'sound.activate2': 'none',
    },
  ),
  before45(
    'liquid',
    'Liquid',
    'Жидкое стекло',
    'Liquid glass over a soft universe, sparkles instead of the grid.',
    'Жидкое стекло над мягкой вселенной, искры вместо сетки.',
    {
      'skin.name': 'liquid',
      'liquid.tint': 'clear',
      'nebula.level': 0.7,
      'nebula.gas': 0.8,
      'grid.on': false,
      'rain.level': 0.45,
      ...layer(1, { count: 160, shape: 'sparkle', size: 5, glow: 8, twinkle: 1.5, speed: 2 }),
      'sound.hover1': 'glass',
      'sound.activate1': 'halo',
      'sound.activate2': 'none',
    },
  ),
  before45(
    'blueprint',
    'Blueprint',
    'Чертёж',
    'Plain lines on a blueprint, a strong grid and a monospaced font; nothing moves but the grid.',
    'Простые линии на синьке, чёткая сетка и моноширинный шрифт; движется только сетка.',
    {
      'skin.name': 'futuristic',
      'future.palette': 'athena',
      'future.surface': 'blueprint',
      'future.frame': 'lines',
      'future.font': 'mono',
      'future.case': 'normal',
      'nebula.on': false,
      'rain.on': false,
      'grid.level': 2,
      'grid.mark': 0.6,
    },
  ),
  before45(
    'fast',
    'Light and fast',
    'Лёгкий и быстрый',
    'Only the grid: no animation on canvas and no blur, for slow phones and mobile internet.',
    'Только сетка: без анимации на canvas и без размытия, для медленных телефонов и мобильного интернета.',
    {
      'nebula.on': false,
      'rain.on': false,
      'grid.level': 0.7,
      'glass.blur': 0,
      'glass.bar': 0,
      'glass.level': 0.85,
    },
  ),
];

/** A random look: every visual setting at random, but never heavier on the device than the defaults. */
export function randomLook(random = Math.random) {
  const look = {};
  const pick = (items) => items[Math.floor(random() * items.length) % items.length];
  for (const field of FIELDS) {
    if (COMFORT.includes(field.key) || field.key.startsWith('sound.')) continue;
    // The number of things drawn and the frame rate stay at most at the default.
    const heavy = /count|fps|resolution|density|refraction|blur|shadow|glow|noise/i.test(field.key);
    if (field.type === 'select') look[field.key] = pick(field.options).value;
    else if (field.type === 'toggle') look[field.key] = heavy ? false : random() < 0.5;
    else if (field.type === 'color')
      look[field.key] = `#${Math.floor(random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`;
    else {
      const max = heavy ? Math.max(field.min, field.d) : field.max;
      const steps = Math.round((max - field.min) / field.step);
      // Rounded, so 0.2 + 4 × 0.1 is 0.6 and not 0.6000000000000001.
      look[field.key] = Math.min(max, Number((field.min + Math.round(random() * steps) * field.step).toFixed(6)));
    }
  }
  return cleanLook(look);
}

export const SAVED_KEY = 'settings-presets';

const storage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

/**
 * The looks saved in this browser, as stored: `[{ name, look }]`, kept as
 * nested Links Notation (issue #47; a list saved as JSON before still loads).
 */
export function loadSaved() {
  try {
    const text = storage()?.getItem(SAVED_KEY);
    const list = text ? readNotation(text).value : [];
    return Array.isArray(list)
      ? list
          .filter((item) => item && typeof item.name === 'string' && item.name.trim())
          .map((item) => ({ name: item.name.trim(), look: cleanLook(item.look) }))
      : [];
  } catch {
    return [];
  }
}

let saved = loadSaved();
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  // Other open tabs of the site follow along, like the settings (./store.js).
  window.addEventListener('storage', (event) => {
    if (event.key === SAVED_KEY || event.key === null) {
      saved = loadSaved();
      notify();
    }
  });
}

/** The saved looks; the same array until they change (for useSyncExternalStore). */
export const getSaved = () => saved;

export const subscribeSaved = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Keeps `list` as the saved looks; returns false when the browser does not remember it. */
export function setSaved(list) {
  saved = list;
  notify();
  try {
    const store = storage();
    if (!store) return false;
    if (list.length) store.setItem(SAVED_KEY, toNested(list));
    else store.removeItem(SAVED_KEY);
    return true;
  } catch {
    // Private mode or a full storage: the looks last until the page closes.
    return false;
  }
}

/** `list` with `look` saved under `name` (replacing a look of the same name). */
export function withSaved(list, name, look) {
  const clean = name.trim();
  if (!clean) return list;
  const item = { name: clean, look: cleanLook(look) };
  const index = list.findIndex((other) => other.name === clean);
  return index < 0 ? [...list, item] : list.map((other, i) => (i === index ? item : other));
}

/** `list` without the look called `name`. */
export const withoutSaved = (list, name) => list.filter((item) => item.name !== name);

/** The saved looks as copied to another browser: nested Links Notation of `{ presets: [{ name, look }] }` (issue #47). */
export const presetsText = (list) => toNested({ presets: list });

/**
 * What the box of the changes holds (issue #47): `{ presets }`, looks copied
 * from another browser, or `{ settings }`, settings changes. Reads Links
 * Notation (`settings:` indented, or nested) and JSON copied before; throws
 * on anything else.
 */
export function readPasted(text) {
  const { id, value, format } = readNotation(text);
  if (format === 'indented' && id !== 'settings') throw new Error(`unknown root ${id}`);
  if (!isObject(value)) throw new Error('not an object');
  return Array.isArray(value.presets) ? { presets: value.presets } : { settings: value };
}

/** `list` with the looks of an exported `{ presets: [{ name, look }] }`, same names replaced. */
export function withImported(list, presets) {
  return (Array.isArray(presets) ? presets : []).reduce(
    (out, item) => (item && typeof item.name === 'string' ? withSaved(out, item.name, item.look) : out),
    list,
  );
}

/** `list` with the look `from` renamed to `to`; a look already called `to` is replaced. */
export function renamed(list, from, to) {
  const clean = to.trim();
  if (!clean || clean === from) return list;
  return list
    .filter((item) => item.name !== clean)
    .map((item) => (item.name === from ? { ...item, name: clean } : item));
}

export const SHARE_PREFIX = '#settings=';

/** A link to `url` that carries the look of `settings`, as indented Links Notation (issue #47). */
export function shareLink(settings, url) {
  const base = url.split('#')[0];
  return `${base}${SHARE_PREFIX}${encodeURIComponent(toIndented('settings', cleanLook(changes(settings))))}`;
}

/** The look a `#settings=` hash carries, or null; links shared as JSON before issue #47 still open. */
export function lookOfHash(hash) {
  if (!hash?.startsWith(SHARE_PREFIX)) return null;
  try {
    const look = readNotation(decodeURIComponent(hash.slice(SHARE_PREFIX.length))).value;
    return isObject(look) ? cleanLook(look) : null;
  } catch {
    return null;
  }
}
