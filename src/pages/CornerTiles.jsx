import { useLang } from '../i18n/prefs';
import { CORNERS, SHAPES } from '../skins.frames';
import { setSettings } from '../settings/store';

// Tiles with a preview of every corner (issue #15: "each corner must be
// configurable with selection tiles which do have a preview of such
// corners"). A tile draws the top left corner of a panel and is mirrored for
// the other corners, with the same points as the clip-path of the stylesheet
// (src/skins.frames.js).

const AT = 5; // where the corner of the panel is in the 32 × 32 tile
const UNIT = 10; // the corner size in the tile
const FAR = 32;

/** The mirror that turns the top left corner into `corner`. */
const MIRROR = { tl: 'none', tr: 'scaleX(-1)', br: 'scale(-1, -1)', bl: 'scaleY(-1)' };

const xy = ([x, y]) => `${AT + x * UNIT},${AT + y * UNIT}`;

/** Points of a corner shape in the tile, from the left edge to the top edge. */
const outline = (shape) => SHAPES[shape].points.map(xy).join(' ');

/** A corner of `shape` with the line `line`, as it will look on the panels. */
export function CornerPreview({ shape, line, corner }) {
  const { x, y } = SHAPES[shape];
  const gap = line === 'gap' ? 6 : 0;
  const bright = line === 'accent' || line === 'bracket';
  const arm = line === 'bracket' ? 8 : 0;
  const tick = shape === 'square' && line === 'accent' ? UNIT : 0;
  return (
    <svg viewBox="0 0 32 32" className="corner-tile__svg" style={{ transform: MIRROR[corner] }} aria-hidden="true">
      <polygon className="corner-tile__fill" points={`${AT},${FAR} ${outline(shape)} ${FAR},${AT} ${FAR},${FAR}`} />
      <polyline className="corner-tile__edge" points={`${AT},${FAR} ${AT},${AT + y * UNIT + gap}`} />
      <polyline className="corner-tile__edge" points={`${AT + x * UNIT + gap},${AT} ${FAR},${AT}`} />
      {line !== 'none' && line !== 'gap' && (
        <polyline className={bright ? 'corner-tile__accent' : 'corner-tile__edge'} points={outline(shape)} />
      )}
      {(arm || tick) > 0 && (
        <polyline
          className="corner-tile__accent"
          points={`${AT},${AT + y * UNIT + arm + tick} ${AT},${AT + y * UNIT}`}
        />
      )}
      {(arm || tick) > 0 && (
        <polyline
          className="corner-tile__accent"
          points={`${AT + x * UNIT},${AT} ${AT + x * UNIT + arm + tick},${AT}`}
        />
      )}
    </svg>
  );
}

/** A row of tiles instead of a list for the shape or the line of a corner. */
export function CornerTiles({ field, value, settings, labelId }) {
  const { t } = useLang();
  const corner = field.key.slice('corner.'.length, 'corner.'.length + 2);
  return (
    <div className="corner-tiles" role="radiogroup" aria-labelledby={labelId}>
      {field.options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          className="corner-tile"
          aria-checked={value === option.value}
          title={t(option.label)}
          aria-label={t(option.label)}
          onClick={() => setSettings({ [field.key]: option.value })}
        >
          {field.tiles === 'shape' ? (
            <CornerPreview shape={option.value} line="accent" corner={corner} />
          ) : (
            <CornerPreview shape={settings[`corner.${corner}Shape`]} line={option.value} corner={corner} />
          )}
        </button>
      ))}
    </div>
  );
}

/** Copies the shape, line, size and line width of one corner to the other three. */
export function SameCorners({ corner, settings }) {
  const { t } = useLang();
  const copy = () =>
    setSettings(
      Object.fromEntries(
        CORNERS.flatMap((other) =>
          ['Shape', 'Line', 'Size', 'Width'].map((name) => [
            `corner.${other}${name}`,
            settings[`corner.${corner}${name}`],
          ]),
        ),
      ),
    );
  return (
    <button type="button" className="button button--small corner-tiles__same" onClick={copy}>
      {t({ en: 'Make all corners like this one', ru: 'Сделать все углы такими же' })}
    </button>
  );
}
