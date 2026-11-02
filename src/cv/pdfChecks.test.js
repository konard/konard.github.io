// The checks of scripts/build-cv-pdf.mjs on hand-made PDF bodies and DOMs.
import { deflateSync } from 'node:zlib';
import { JSDOM } from 'jsdom';
import { countPages, hasTextLayer, pageLimit, positionedParts } from '../../scripts/build-cv-pdf.mjs';

const pdf = (body) => Buffer.from(body, 'latin1');

describe('CV PDF checks', () => {
  test('page limits: 1 for compact, 2 for a position, none for the full record', () => {
    expect(pageLimit('rust', 'compact')).toBe(1);
    expect(pageLimit('all', 'compact')).toBe(1);
    expect(pageLimit('rust', 'classic')).toBe(2);
    expect(pageLimit('all', 'technical')).toBe(Infinity);
  });

  test('pages are counted from the page objects, not the page tree', () => {
    const body = '<< /Type /Pages /Kids [3 0 R 4 0 R] >> << /Type /Page >> << /Type/Page /Parent 2 0 R >>';
    expect(countPages(pdf(body))).toBe(2);
    expect(countPages(pdf('%PDF-1.4'))).toBe(0);
  });

  test('text is extractable when a font maps its glyphs to Unicode, also in a compressed stream', () => {
    expect(hasTextLayer(pdf('<< /Type /Font /ToUnicode 9 0 R >>'))).toBe(true);
    const packed = deflateSync(Buffer.from('<< /Type /Font /ToUnicode 9 0 R >>')).toString('latin1');
    expect(hasTextLayer(pdf(`1 0 obj stream\n${packed}endstream`))).toBe(true);
    expect(hasTextLayer(pdf('<< /Type /XObject /Subtype /Image >>'))).toBe(false);
  });

  test('positioned parts of the CV are reported, plain ones are not', () => {
    const { window } = new JSDOM(
      '<article class="cv"><ul class="cv__bullets"><li>a</li><li class="moved" style="position: relative">b</li></ul></article>',
    );
    // jsdom computes no pseudo-element styles and logs an error for each one (issue #51);
    // answer like a browser for an element without generated content.
    const own = window.getComputedStyle.bind(window);
    window.getComputedStyle = (el, pseudo) => (pseudo ? { content: 'none' } : own(el));
    const { document } = window;
    expect(positionedParts(document.querySelector('.cv'))).toEqual(['moved']);
  });
});
