// JSON quoting alone allows </script> to terminate an HTML script element.
const escapes = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' };
export const inlineJSON = (value) => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => escapes[char]);
