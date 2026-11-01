// What formatIndented writes for every kind of value a setting can have, to
// write the tiny reader of the script that applies the settings before the
// first paint (vite.config.js) — it cannot bundle lino-objects-codec.
import { formatIndented, parseIndented, setDebugEnabled } from 'lino-objects-codec';

setDebugEnabled(false);
const obj = {
  'skin.name': 'liquid',
  'grid.size': 96,
  'glass.blur': 12.5,
  'neg.value': -3,
  'rain.on': false,
  'rain.real': true,
  'avatar.text': '45',
  'some.text': 'two words',
  'quote.text': 'it\'s "quoted"',
  'empty.text': '',
  'color.hex': '#ff00aa',
};
const text = formatIndented({ id: 'settings', obj });
console.log(text);
console.log(
  JSON.stringify(parseIndented({ text }).obj) === JSON.stringify(obj) ? 'round trip ok' : parseIndented({ text }).obj,
);
