import { createLocalizer, message } from '@link-foundation/ui-i18n';
import catalogs from './catalogs.generated.js';

const localizers = Object.fromEntries(['en', 'ru'].map((locale) => [locale, createLocalizer({ catalogs, locale })]));
const messages = new Map();

// Bilingual data remains usable by CV/export code and stable React keys. The
// actual message lookup and fallback are provided by the framework localizer.
export function localized(key) {
  if (!messages.has(key)) {
    const value = message(key);
    messages.set(
      key,
      Object.freeze({
        get en() {
          return localizers.en.text(value);
        },
        get ru() {
          return localizers.ru.text(value);
        },
      }),
    );
  }
  return messages.get(key);
}

export { catalogs };
