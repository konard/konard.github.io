// Project existing field metadata into the framework schema while the rich
// panel remains in the host. Validation, defaults, differences and comfort
// semantics belong to ui-settings.
import { formatLinks } from '@link-foundation/ui-core';
import { defaults, diff, merge, readSchema } from '@link-foundation/ui-settings';

export const COMFORT = ['motion.mode', 'sound.on', 'sound.volume', 'theory.notation', 'ui.transparency'];

export function frameworkSchema(sections) {
  const records = [{ id: 'settings-schema', values: ['schema', ['version', '1']] }];
  for (const section of sections) {
    records.push({ id: section.id, values: ['section', ['label', section.title.en]] });
    for (const field of section.fields) {
      const type = field.type === 'select' ? 'choice' : field.type;
      const values = [
        ['type', type],
        ['default', String(field.d)],
        ['section', section.id],
      ];
      if (field.type === 'range') {
        // Historical imports clamp continuously; step controls editing only.
        values.push(['min', String(field.min)], ['max', String(field.max)]);
      }
      if (field.options) values.push(['options', ...field.options.map((o) => String(o.value))]);
      if (COMFORT.includes(field.key)) values.push(['comfort']);
      records.push({ id: field.key, values });
    }
  }
  const text = formatLinks(records);
  const { schema, diagnostics } = readSchema(text, { normalization: { primitives: 'strict', numbers: 'clamp' } });
  if (diagnostics.length) throw new Error(JSON.stringify(diagnostics));
  return schema;
}

// Preserve the historical transparent-surface migration and color casing;
// the framework's strict normalization policy validates JSON primitives.
export function settingsValues(schema, stored) {
  if (stored?.['future.surface'] === 'transparent') {
    stored = { ...stored, 'future.surface': 'solid', 'future.opacity': 0 };
  }
  const input = {};
  for (const field of schema.fields.values()) {
    const value = stored?.[field.key];
    input[field.key] = field.type === 'color' && typeof value === 'string' ? value.toLowerCase() : value;
  }
  return merge(schema, undefined, input).values;
}

export { defaults, diff };
