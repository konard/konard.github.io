// Verifies every repository in src/data/fields.js professions exists in src/data/repositories.json.
import fs from 'node:fs';
import { professions, fields } from '../src/data/fields.js';
const data = JSON.parse(fs.readFileSync(new URL('../src/data/repositories.json', import.meta.url)));
const byName = new Map(data.items.map((r) => [r.fullName.toLowerCase(), r]));
let missing = 0;
for (const p of professions)
  for (const [name] of p.repos) {
    const r = byName.get(name.toLowerCase());
    if (!r) {
      missing++;
      console.log('MISSING', p.id, name);
    } else if (r.kind !== 'own') console.log('NOT OWN', p.id, name, r.kind);
    else if (r.fullName !== name) console.log('CASE', name, '->', r.fullName);
  }
console.log('fields in data', data.fields, 'fields.js', fields.map((f) => f.id).join(','));
console.log('missing', missing);
