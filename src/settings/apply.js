// Checks and applies settings. Both functions are also copied as text into the
// script that runs before the first paint (SETTINGS_SCRIPT in vite.config.js),
// so they must not use anything outside themselves.

/**
 * Valid settings for every key of `rules`: stored values that fit the rule
 * (numbers are clamped to min…max, choices must be listed, colours are #rrggbb),
 * the default for everything else.
 */
export function normalize(rules, stored) {
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
}
