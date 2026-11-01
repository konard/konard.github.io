// Issue #47: lino-objects-codec 0.9.4 in a page without Node globals. A browser has neither
// `process` nor `Buffer`; this script removes both before loading the codec, as Vite's build does
// not provide them, and shows which calls fail and that setDebugEnabled(false) avoids `process`.
const saved = { process: globalThis.process, Buffer: globalThis.Buffer };
delete globalThis.process;
delete globalThis.Buffer;
const codec = await import('lino-objects-codec');
const attempt = (title, run) => {
  try {
    console.log('ok  ', title, JSON.stringify(run()));
  } catch (error) {
    console.log('FAIL', title, `${error.name}: ${error.message}`);
  }
};
attempt('formatIndented', () => codec.formatIndented({ id: 'settings', obj: { 'skin.name': 'liquid' } }));
attempt('parseIndented', () => codec.parseIndented({ text: 'settings:\n  skin.name liquid' }).obj);
attempt('decode', () => codec.decode({ notation: '(\n  skin.name "liquid"\n)' }));
codec.setDebugEnabled(false);
attempt(
  'parseIndented after setDebugEnabled(false)',
  () => codec.parseIndented({ text: 'settings:\n  skin.name liquid' }).obj,
);
attempt('decode after setDebugEnabled(false)', () => codec.decode({ notation: '(\n  skin.name "liquid"\n)' }));
attempt('decode of a (base64 "…") value', () => codec.decode({ notation: '(\n  name (base64 "bGlxdWlk")\n)' }));
Object.assign(globalThis, saved);
