import { decode } from '../links/configurations';
import { glyphPaths, SIZE } from '../links/glyph';

/**
 * One link configuration drawn inline in the links-visuals style. `code` is a
 * configuration code such as '00 11 01' (link i → (source, target)).
 */
export default function Glyph({ code, size = 48, title = null, className = 'glyph' }) {
  const { stroke, dots } = glyphPaths(decode(code));
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
      <path
        d={stroke}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="currentColor">
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.2" />
        ))}
      </g>
    </svg>
  );
}
