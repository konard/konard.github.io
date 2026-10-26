// Capture actual compositor output: native screencapture on macOS, or Xvfb's
// framebuffer on Linux. XWD/PNG are decoded/encoded without extra dependencies.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { crc32, deflateSync } from 'node:zlib';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export async function displayScreenshot(path) {
  if (process.platform === 'darwin') {
    await promisify(execFile)('/usr/sbin/screencapture', ['-x', '-t', 'png', path]);
    return readFile(path);
  }
  const xwd = await readFile(process.env.XWD_FILE);
  const header = Array.from({ length: 25 }, (_, i) => xwd.readUInt32BE(i * 4));
  const [width, height] = header.slice(4, 6);
  assert.equal(header[1], 7, 'XWD format version');
  assert.equal(header[3], 24, '24-bit Xvfb display');
  assert.equal(header[11], 32, '32-bit framebuffer pixels');
  assert(width > 0 && width <= 4096 && height > 0 && height <= 4096);
  const offset = header[0] + header[19] * 12;
  const read = header[7] === 0 ? (p) => xwd.readUInt32LE(p) : (p) => xwd.readUInt32BE(p);
  const shifts = header.slice(14, 17).map((mask) => 31 - Math.clz32(mask & -mask));
  const pixels = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const color = read(offset + y * header[12] + x * 4);
      const target = y * (width * 3 + 1) + 1 + x * 3;
      shifts.forEach((shift, i) => {
        pixels[target + i] = (color >>> shift) & 255;
      });
    }
  const chunk = (type, value) => {
    const body = Buffer.concat([Buffer.from(type), value]);
    const length = Buffer.alloc(4);
    const checksum = Buffer.alloc(4);
    length.writeUInt32BE(value.length);
    checksum.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, checksum]);
  };
  const size = Buffer.alloc(13);
  size.writeUInt32BE(width, 0);
  size.writeUInt32BE(height, 4);
  size[8] = 8;
  size[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', size),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  if (path) await writeFile(path, png);
  return png;
}
