// Issue #15: "every setting must be verified as actually applied". A setting
// reaches the page in one of three ways: as a CSS variable or an attribute of
// <html> that a stylesheet uses, as an option a background script reads, or
// as a key a component reads. This test fails for a setting that does none.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { beamsOptions, nebulaOptions, rainOptions, starsOptions } from '../components/Cosmos';
import { soundOptions } from '../sound/options';
import { CSS_RULES, DEFAULTS, FIELDS, RULES } from './schema';

const SRC = join(__dirname, '..');
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  );
const ALL = files(SRC);
const read = (pattern) =>
  ALL.filter((file) => pattern.test(file) && !/\.test\.|[\\/]schema[.\w]*\.js$/.test(file))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
const CSS = read(/\.css$/);
const SCRIPTS = read(/\.jsx?$/);

/** `liquid.refractionScale` → `liquid-refraction-scale`, as in apply.js. */
const cssName = (key) => key.replace(/\./g, '-').replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());

/** Keys the option builders of the background layers and of the sound read. */
const readByLayers = () => {
  const keys = new Set();
  const spy = new Proxy(DEFAULTS, { get: (target, key) => (keys.add(key), target[key]) });
  [nebulaOptions, starsOptions, beamsOptions, (s) => rainOptions(s, true)].forEach((options) => options(spy));
  // The sound reads the slots of an interaction up to the first empty one, so it is read with every slot full.
  const full = Object.fromEntries(
    Object.keys(DEFAULTS).map((key) => [key, /^sound\.\w+\d$/.test(key) ? 'quartz' : DEFAULTS[key]]),
  );
  soundOptions(new Proxy(full, { get: (target, key) => (keys.add(key), target[key]) }));
  return keys;
};

const usedBy = (field, layers) => {
  const name = cssName(field.key);
  const inCss =
    field.css !== false &&
    (field.type === 'range' || field.type === 'color' ? CSS.includes(`var(--${name}`) : CSS.includes(`[data-${name}`));
  const inScripts = layers.has(field.key) || SCRIPTS.includes(`'${field.key}'`);
  return inCss || inScripts;
};

/** Choices that switch a decoration off, so no rule is needed for them. */
const NOTHING = ['none', 'plain'];

/**
 * The corners of a type of control (issue #47): `border` keeps the border of
 * the skin, because the frame is drawn only for `same` and `own`.
 */
const PLAIN_CONTROLS = /^corner\.(button|field|tab|chip|menu|table)Corners$/;

describe('every setting is applied (issue #15)', () => {
  it('is used by a stylesheet, a background layer or a component', () => {
    const layers = readByLayers();
    const unused = FIELDS.filter((field) => !usedBy(field, layers)).map((field) => field.key);
    expect(unused).toEqual([]);
    // The check itself finds a setting nobody reads.
    expect(usedBy({ key: 'nebula.unread', type: 'range' }, layers)).toBe(false);
    expect(usedBy({ key: 'rain.step', type: 'range', css: false }, layers)).toBe(true);
  });

  it('styles every choice of a setting that only stylesheets read', () => {
    const layers = readByLayers();
    const missing = FIELDS.filter(
      (field) =>
        field.type === 'select' && field.css !== false && !layers.has(field.key) && !SCRIPTS.includes(`'${field.key}'`),
    ).flatMap((field) =>
      field.options
        .map((o) => o.value)
        .filter(
          (value) =>
            value !== field.d &&
            !NOTHING.includes(value) &&
            !(PLAIN_CONTROLS.test(field.key) && value === 'border') &&
            !CSS.includes(`[data-${cssName(field.key)}='${value}']`),
        )
        .map((value) => `${field.key}=${value}`),
    );
    expect(missing).toEqual([]);
  });

  it('puts only the settings stylesheets use on <html>', () => {
    const scriptOnly = FIELDS.filter((field) => field.css === false).map((field) => field.key);
    expect(scriptOnly.length).toBeGreaterThan(50);
    scriptOnly.forEach((key) => expect(CSS_RULES, key).not.toHaveProperty(key));
    expect(Object.keys(CSS_RULES).length + scriptOnly.length).toBe(Object.keys(RULES).length);
  });
});
