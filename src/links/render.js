// The picture of a network as a standalone SVG document (issue #17): the
// preview of the editor of /network/ and every image it exports (SVG, and
// PNG, JPEG, WebP drawn from it) are this one string, so what is shared is
// exactly what is seen. Every value comes through normalizeStyle, and the
// caption is escaped, so a shared link cannot put markup into the picture.
import { mathNotation, encode } from './configurations';
import { linksText, numberNotation, decimalOf, theoryNotation } from './edit';
import { SIZE, glyphParts, arrowMiterLimit } from './glyph';
import { linkColors, normalizeStyle, shapeOfStyle } from './style';

const FONTS = {
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};
// Average width of a character relative to the font size, to fit long captions.
const WIDTH = { mono: 0.6, sans: 0.55, serif: 0.52 };

export const escapeXml = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c],
  );

const num = (x) => +x.toFixed(2);

/** Dash pattern of the lines, relative to their width. Zero-length dots need round or square caps. */
function dashArray(dash, width, cap) {
  const dot = cap === 'butt' ? width : 0.01;
  const pattern = {
    dashed: [3, 2],
    dotted: [dot / width, 2],
    dashdot: [4, 1.6, dot / width, 1.6],
    long: [8, 3],
  }[dash];
  return pattern ? pattern.map((k) => num(k * width)).join(' ') : null;
}

/** The caption of a network in the chosen notation. */
export function captionOf(links, style, notation = 'L') {
  switch (style.caption) {
    case 'theory':
      return theoryNotation(links, notation);
    case 'pairs':
      return mathNotation(encode(links));
    case 'number':
      return `${numberNotation(links)} = ${decimalOf(links)}`;
    case 'links':
      return linksText(links);
    case 'custom':
      return style.captionText;
    default:
      return '';
  }
}

/** The background and the card, in a viewBox of `w` × `h`. */
function backdrop(style, w, h, defs) {
  const parts = [];
  if (style.background === 'solid') parts.push(`<rect width="${num(w)}" height="${num(h)}" fill="${style.bgColor}"/>`);
  else if (style.background === 'linear') {
    const a = (style.bgAngle * Math.PI) / 180;
    const [dx, dy] = [Math.cos(a) / 2, Math.sin(a) / 2];
    defs.push(
      `<linearGradient id="bg" x1="${num(0.5 - dx)}" y1="${num(0.5 - dy)}" x2="${num(0.5 + dx)}" y2="${num(0.5 + dy)}">` +
        `<stop offset="0" stop-color="${style.bgColor}"/><stop offset="1" stop-color="${style.bgColor2}"/></linearGradient>`,
    );
    parts.push(`<rect width="${num(w)}" height="${num(h)}" fill="url(#bg)"/>`);
  } else if (style.background === 'radial') {
    defs.push(
      `<radialGradient id="bg" cx="0.5" cy="0.5" r="0.75">` +
        `<stop offset="0" stop-color="${style.bgColor}"/><stop offset="1" stop-color="${style.bgColor2}"/></radialGradient>`,
    );
    parts.push(`<rect width="${num(w)}" height="${num(h)}" fill="url(#bg)"/>`);
  }
  if (style.card) {
    const inset = style.inset;
    const [cw, ch] = [Math.max(w - 2 * inset, 1), Math.max(h - 2 * inset, 1)];
    const r = Math.min(style.radius, cw / 2, ch / 2);
    const rect = (d, extra) =>
      `<rect x="${num(inset + d)}" y="${num(inset + d)}" width="${num(Math.max(cw - 2 * d, 0))}" ` +
      `height="${num(Math.max(ch - 2 * d, 0))}" rx="${num(Math.max(r - d, 0))}" ${extra}/>`;
    parts.push(rect(0, `fill="${style.cardColor}" fill-opacity="${style.cardOpacity}"`));
    if (style.borderStyle !== 'none') {
      const b = style.border;
      const stroke = `fill="none" stroke="${style.borderColor}" stroke-width="${num(b)}"`;
      const dash = {
        dashed: ` stroke-dasharray="${num(b * 4)} ${num(b * 3)}"`,
        dotted: ` stroke-dasharray="0.01 ${num(b * 2.5)}" stroke-linecap="round"`,
      }[style.borderStyle];
      parts.push(rect(b / 2, stroke + (dash || '')));
      if (style.borderStyle === 'double') parts.push(rect(b * 2.5, stroke));
    }
  }
  return parts.join('');
}

/**
 * The SVG document of network `links` in `style` (any partial or untrusted
 * style; it is normalized). `notation` is 'L' or 'R' for the caption in math
 * notation, `extraTurns` the turns found by the solver of overlaps.
 */
export function networkSvg(
  links,
  rawStyle = {},
  { notation = null, extraTurns = null, extraGaps = null, extraLayout = null, title = '' } = {},
) {
  const style = normalizeStyle(rawStyle);
  const n = links.length;
  const short = Math.min(style.width, style.height);
  // The shorter side of the picture is SIZE units long, so the symbol keeps its size in any proportions.
  const [w, h] = [(SIZE * style.width) / short, (SIZE * style.height) / short];
  const defs = [];
  const back = backdrop(style, w, h, defs);
  const caption = captionOf(links, style, notation || style.notation);
  const edge = style.card ? style.inset : 0;
  const room = caption ? style.captionSize * 2.2 : 0;
  const side = Math.max(SIZE - room - 2 * edge, 10);
  const [x, y] = [(w - side) / 2, edge + (h - 2 * edge - room - side) / 2];

  const colors = linkColors(style, n);
  const parts = glyphParts(links, shapeOfStyle({ ...style, ...extraLayout }, n, extraTurns, extraGaps));
  const dash = dashArray(style.dash, style.strokeWidth, style.linecap);
  const lines = parts
    .map(({ line, start, end, middle }, i) => {
      const shapes = [start, end, middle]
        .filter((m) => m.d)
        .map((m) => {
          const key = m === start ? 'start' : m === end ? 'end' : 'middle';
          const arrow = ['arrow', 'triangle', 'tail'].includes(style[key]) && style.arrowJoin !== 'inherit';
          const join = arrow
            ? ` stroke-linejoin="${style.arrowJoin}" stroke-miterlimit="${arrowMiterLimit(style[`${key}Angle`], m.outline, style[key])}"`
            : '';
          return `<path d="${m.d}"${m.fill ? ` fill="${colors[i]}"` : ''}${join}/>`;
        })
        .join('');
      return `<g stroke="${colors[i]}"><path d="${line}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>${shapes}</g>`;
    })
    .join('');
  if (style.glow > 0)
    defs.push(
      `<filter id="glow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="${num(style.glow * 0.5)}" result="b"/>` +
        `<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    );

  let text = '';
  if (caption) {
    const size = style.captionSize;
    const width = w - 2 * edge - size * 2;
    const estimate = caption.length * size * WIDTH[style.captionFont];
    const fit = estimate > width ? ` textLength="${num(width)}" lengthAdjust="spacingAndGlyphs"` : '';
    text =
      `<text x="${num(w / 2)}" y="${num(h - edge - room / 2 + size * 0.35)}" text-anchor="middle" ` +
      `font-family="${escapeXml(FONTS[style.captionFont])}" font-size="${num(size)}" fill="${style.captionColor}"${fit}>` +
      `${escapeXml(caption)}</text>`;
  }

  const label = escapeXml(title || `Links network ${mathNotation(encode(links))}`);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${style.width}" height="${style.height}" ` +
    `viewBox="0 0 ${num(w)} ${num(h)}" role="img" aria-label="${label}"><title>${label}</title>` +
    (defs.length ? `<defs>${defs.join('')}</defs>` : '') +
    back +
    `<g transform="translate(${num(x)} ${num(y)}) scale(${+(side / SIZE).toFixed(4)})" fill="none" ` +
    `stroke-width="${style.strokeWidth}" stroke-linecap="${style.linecap}" stroke-linejoin="${style.linejoin}" ` +
    `opacity="${style.opacity}"${style.glow > 0 ? ' filter="url(#glow)"' : ''}>${lines}</g>${text}</svg>`
  );
}
