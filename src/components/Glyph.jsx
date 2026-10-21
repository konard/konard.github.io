import { decode } from '../links/configurations';
import { glyphPaths, SIZE, STROKE } from '../links/glyph';

/**
 * One network of links drawn inline in the links-visuals style: every link is
 * one continuous line in its own colour. `code` is a network code such as
 * '00 11' (link 1 = (1: 0 0), link 2 = (2: 1 1)); 0 is the zero link.
 */
export default function Glyph({ code, size = 48, title = null, className = 'glyph' }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      <g fill="none" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {glyphPaths(decode(code)).map(({ d, color }, i) => (
          <path key={i} d={d} stroke={color} data-link={i + 1} />
        ))}
      </g>
    </svg>
  );
}
