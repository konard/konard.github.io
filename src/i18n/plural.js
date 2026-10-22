// Plural word forms per site language (issue #11).
// English has two forms (one, other); Russian has three (one, few, many):
// 1 связь, 2 связи, 5 связей, 21 связь, 11 связей.
const rules = new Map();
const rule = (lang) => {
  if (!rules.has(lang)) rules.set(lang, new Intl.PluralRules(lang === 'ru' ? 'ru-RU' : 'en-US'));
  return rules.get(lang);
};

const INDEX = { one: 0, few: 1, many: 2, other: 2 };

/**
 * The word form for `count`: `forms` is `{ en: [one, other], ru: [one, few, many] }`.
 * plural(5, 'ru', { en: ['link', 'links'], ru: ['связь', 'связи', 'связей'] }) → 'связей'.
 */
export function plural(count, lang, forms) {
  const words = forms[lang] ?? forms.en;
  if (words.length === 2) return rule('en').select(count) === 'one' ? words[0] : words[1];
  return words[INDEX[rule(lang).select(count)] ?? 2];
}
