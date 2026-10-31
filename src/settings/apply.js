// Checks and applies settings. Both functions are also copied as text into the
// script that runs before the first paint (SETTINGS_SCRIPT in vite.config.js),
// so they must not use anything outside themselves.

/**
 * Valid settings for every key of `rules`: stored values that fit the rule
 * (numbers are clamped to min…max, choices must be listed, colours are #rrggbb),
 * the default for everything else.
 */
export function normalize(rules, stored) {
  /* Migration also runs before first paint and when importing old shared looks. */
  if (stored && stored['future.surface'] === 'transparent') {
    stored = Object.assign({}, stored, { 'future.surface': 'solid', 'future.opacity': 0 });
  }
  var out = {};
  for (var key in rules) {
    var rule = rules[key];
    var value = stored && Object.prototype.hasOwnProperty.call(stored, key) ? stored[key] : rule.d;
    if (typeof rule.d === 'number') {
      value = typeof value === 'number' && isFinite(value) ? Math.min(rule.max, Math.max(rule.min, value)) : rule.d;
    } else if (typeof rule.d === 'boolean') {
      value = typeof value === 'boolean' ? value : rule.d;
    } else if (rule.o) {
      value = rule.o.indexOf(value) >= 0 ? value : rule.d;
    } else if (rule.c) {
      value = typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : rule.d;
    }
    out[key] = value;
  }
  return out;
}

/**
 * Puts settings on `root` (the <html> element) for the stylesheets: numbers
 * and colours as CSS variables (`liquid.blur` → `--liquid-blur: 18px`),
 * switches and choices as attributes (`skin.name` → `data-skin-name`).
 */
export function applySettings(root, rules, settings) {
  for (var key in rules) {
    var name = key.replace(/\./g, '-').replace(/[A-Z]/g, function (letter) {
      return '-' + letter.toLowerCase();
    });
    var value = settings[key];
    if (typeof value === 'number' || rules[key].c) root.style.setProperty('--' + name, value + (rules[key].u || ''));
    else root.setAttribute('data-' + name, String(value));
  }
  /* Resolve skin inheritance once; changing skins still updates CSS references. */
  ['panel', 'control'].forEach(function (part) {
    ['Tl', 'Tr', 'Br', 'Bl'].forEach(function (corner) {
      var value = settings['ui.' + part + corner];
      var fallback = part === 'panel' ? 'var(--radius)' : 'var(--ui-skin-control-radius)';
      root.style.setProperty(
        '--ui-' + part + '-' + corner.toLowerCase() + '-resolved',
        value >= 0 ? value + 'px' : fallback,
      );
    });
  });
  /* Widths where −1 follows the skin (issue #45): without the variable the stylesheets fall back to it. */
  ['tl', 'tr', 'br', 'bl', 'top', 'right', 'bottom', 'left'].forEach(function (part) {
    if (!(settings['corner.' + part + 'Width'] >= 0)) root.style.removeProperty('--corner-' + part + '-width');
  });
  if (!(settings['future.accentWidth'] >= 0)) root.style.removeProperty('--future-accent-width');
  ['accent', 'accent2'].forEach(function (name) {
    var hex = settings['ui.' + name];
    if (typeof hex === 'string')
      root.style.setProperty(
        '--ui-' + name + '-rgb',
        [1, 3, 5]
          .map(function (start) {
            return parseInt(hex.slice(start, start + 2), 16);
          })
          .join(' '),
      );
  });
  /* A small static noise tile, regenerated only on settings changes. The zero
     path has no image, and every optical layer follows material opacity. */
  var grain = settings['liquid.noise'] * settings['liquid.opacity'];
  var noise =
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="' +
    grain +
    '"/></feComponentTransfer></filter><path filter="url(#n)" d="M0 0h128v128H0z"/></svg>';
  root.style.setProperty(
    '--liquid-grain-image',
    grain > 0 ? 'url("data:image/svg+xml,' + encodeURIComponent(noise) + '")' : 'none',
  );
  root.setAttribute(
    'data-surface-invisible',
    String(
      settings[
        settings['skin.name'] === 'glass'
          ? 'glass.level'
          : settings['skin.name'] === 'liquid'
            ? 'liquid.opacity'
            : 'future.opacity'
      ] === 0,
    ),
  );
}
