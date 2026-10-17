#!/usr/bin/env node
// Wraps a single square PNG (<= 256px) into an .ico container.
// ICO files may embed PNG data directly (supported by all current browsers).
// Usage: node experiments/png-to-ico.cjs input.png output.ico
const fs = require('fs');
const [input, output] = process.argv.slice(2);
const png = fs.readFileSync(input);
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
const header = Buffer.alloc(6 + 16);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count
header.writeUInt8(width >= 256 ? 0 : width, 6);
header.writeUInt8(height >= 256 ? 0 : height, 7);
header.writeUInt8(0, 8); // palette colors
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // color planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18); // image data offset
fs.writeFileSync(output, Buffer.concat([header, png]));
console.log(`Wrote ${output}: ${width}x${height}, ${png.length + 22} bytes`);
