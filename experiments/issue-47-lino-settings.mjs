// Issue #47: how lino-objects-codec writes and reads settings changes and presets (types, keys with dots, colours).
import { decode, encode, formatIndented, parseIndented } from 'lino-objects-codec';

const changes = {
  'skin.name': 'liquid',
  'avatar.angle': 45,
  'corner.fitScale': 0.25,
  'motion.reduce': true,
  'accent.color': '#3fbf7f',
  'site.title': 'Hello: "world" (x)',
  empty: '',
};
const show = (title, text) => console.log(`--- ${title}\n${text}`);
const a = formatIndented({ id: 'settings', obj: changes });
show('formatIndented', a);
console.log('parseIndented', JSON.stringify(parseIndented({ text: a })));
const b = encode({ obj: changes });
show('encode', b);
console.log('decode', JSON.stringify(decode({ notation: b })));
const presets = { presets: [{ name: 'Mine', at: 1700000000000, changes }] };
const c = encode({ obj: presets });
show('encode presets', c);
console.log('decode', JSON.stringify(decode({ notation: c })) === JSON.stringify(presets));
