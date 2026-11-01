// Probe how lino-objects-codec writes and reads settings-shaped objects (issue #47, C7).
import { encode, decode, formatIndented, parseIndented } from 'lino-objects-codec';
const changes = {
  'corner.shape': 'cut',
  'rain.step': 105,
  'motion.mode': 'off',
  'ui.motion': 0.5,
  'sound.on': true,
  'rain.glowColor': '#00ff66',
  label: 'two words',
  empty: '',
  n: null,
  list: [1, 'a'],
};
const text = encode({ obj: changes });
console.log(text);
console.log('---');
const back = decode({ notation: text });
console.log(JSON.stringify(back) === JSON.stringify(changes), back);
console.log('--- indented');
const ind = formatIndented({ id: 'settings', obj: changes });
console.log(ind);
console.log(JSON.stringify(parseIndented({ text: ind })));
