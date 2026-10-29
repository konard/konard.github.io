import { describe, expect, it } from 'vitest';
import { codeAt, decode, networkCount } from './configurations';
import { bezier, glyphParts, MARKERS } from './glyph';
import { splitCurve, trimCurve } from './curve-tools';
import { geometryAvailable, GEOMETRY_SECTIONS } from './style-geometry';
import { normalizeStyle, shapeOfStyle, STYLE_DEFAULTS, styleFromParams, styleToParams } from './style';
import { networkSvg } from './render';

describe('geometry and control audit (issue #19)', () => {
  it('renders all 4,181 networks of 1–3 links with finite editor geometry', () => {
    for (const n of [1, 2, 3])
      for (const code of Array.from({ length: networkCount(n) }, (_, i) => codeAt(n, i))) {
        const svg = networkSvg(decode(code));
        expect(svg, code).not.toMatch(/NaN|Infinity|undefined/);
      }
  }, 20000);

  it('round trips every geometry control and exercises its visible range', () => {
    const examples = ['00', '11', '10', '01', '12 21', '22 13 31', '00 02 30 44'];
    for (const field of GEOMETRY_SECTIONS.flatMap((section) => section.fields)) {
      if (field.key === 'columns' || field.key.startsWith('force')) continue; // Arrangements tested below.
      let changed = false;
      const variants =
        field.type === 'range'
          ? [field.min, field.max]
          : field.type === 'toggle'
            ? [true, false]
            : field.type === 'text'
              ? ['', '2 1', '1 3 2 4']
              : field.options.map((o) => o.value);
      for (const code of examples)
        for (const mode of ['fixed', 'mirror']) {
          const links = decode(code);
          const base = normalizeStyle({ angles: mode, start: 'arrow', end: 'arrow', middle: 'arrow' });
          if ((field.when && !field.when(base)) || !geometryAvailable(field.key, base, links)) continue;
          const svg = networkSvg(links, base);
          for (const value of variants) {
            const style = normalizeStyle({ ...base, [field.key]: value });
            expect(styleFromParams(styleToParams(style)), field.key).toEqual(style);
            const next = networkSvg(links, style);
            expect(next, field.key).not.toMatch(/NaN|Infinity|undefined/);
            changed ||= next !== svg;
          }
        }
      expect(changed, `${field.key} has a visible effect in an applicable context`).toBe(true);
    }
    const links = Array.from({ length: 10 }, (_, i) => [i + 1, ((i + 1) % 10) + 1]);
    for (const [placement, keys] of [
      ['square', ['columns']],
      ['force', ['forceDistance', 'forceCharge', 'forceCollision']],
    ]) {
      const base = normalizeStyle({ placement });
      for (const key of keys) expect(networkSvg(links, { ...base, [key]: 3 }), key).not.toBe(networkSvg(links, base));
    }
  });

  it('offers every marker at each position, with independent size, offsets and direction', () => {
    for (const position of ['start', 'end', 'middle'])
      for (const kind of MARKERS) {
        const style = normalizeStyle({
          [position]: kind,
          [`${position}Offset`]: 12,
          [`${position}Across`]: -8,
          [`${position}Rotation`]: 37,
        });
        const shape = shapeOfStyle(style, 1);
        const [parts] = glyphParts([[1, 1]], shape);
        expect(Boolean(parts[position].d)).toBe(kind !== 'none');
        expect(networkSvg([[1, 1]], style)).not.toMatch(/NaN|Infinity|undefined/);
      }
  });

  it('hides ineffective controls but keeps angles and bends for self references', () => {
    const available = (key, links, patch = {}) => geometryAvailable(key, normalizeStyle(patch), links);
    for (const key of ['free', 'placement', 'lens']) expect(available(key, [[1, 1]])).toBe(false);
    for (const key of ['sourceAngle', 'targetAngle', 'tension', 'loop', 'bulge'])
      expect(available(key, [[1, 1]])).toBe(true);
    for (const key of ['angles', 'sourceAngle', 'targetAngle', 'loop', 'tension', 'startGap', 'endGap'])
      expect(available(key, [[0, 0]])).toBe(false);
    expect(
      available(
        'lens',
        [
          [2, 2],
          [1, 1],
        ],
        { angles: 'mirror' },
      ),
    ).toBe(true);
    expect(
      available('bulge', [
        [2, 2],
        [1, 1],
      ]),
    ).toBe(false);
    expect(
      available(
        'forceDistance',
        [
          [1, 1],
          [0, 2],
        ],
        { placement: 'force' },
      ),
    ).toBe(false);
    expect(
      available(
        'forceDistance',
        [
          [2, 1],
          [0, 2],
        ],
        { placement: 'force' },
      ),
    ).toBe(true);
    const rotation = GEOMETRY_SECTIONS.flatMap((section) => section.fields).find((f) => f.key === 'middleRotation');
    for (const middle of ['none', 'circle', 'dot']) expect(rotation.when(normalizeStyle({ middle }))).toBe(false);
  });

  it('uses the supplied visual defaults with zero rotation and continuous middles', () => {
    expect(normalizeStyle()).toEqual(STYLE_DEFAULTS);
    expect(STYLE_DEFAULTS).toMatchObject({
      angles: 'fixed',
      sourceAngle: 30,
      targetAngle: 30,
      bendMode: 'curve',
      tension: 0.4,
      bulge: 0,
      startGap: 0.08,
      endGap: 0.08,
      rotation: 0,
      startSize: 2.5,
      startAngle: 70,
      endSize: 3.5,
      endAngle: 45,
      middle: 'dot',
      middleSize: 2,
      strokeWidth: 1.3,
      linejoin: 'miter',
      palette: 'site',
      card: false,
      bgColor: '#000000',
      width: 2048,
      height: 2048,
      middleGapStart: 0,
      middleGapEnd: 0,
    });
    const legacy = styleFromParams(new URLSearchParams('gap=0.12'));
    expect(legacy.startGap).toBe(0.12);
    expect(legacy.endGap).toBe(0.12);
    expect(normalizeStyle({ ...legacy, startGap: 0.2 }).startGap).toBe(0.2);
  });
});

it('cuts actual cubic subcurves without moving endpoints or changing their tangents', () => {
  const curve = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
  ];
  const [a, b] = splitCurve(curve, 0.4);
  expect(a[3]).toEqual(b[0]);
  a[3].forEach((v, i) => expect(v).toBeCloseTo(bezier(curve, 0.4)[i], 12));
  expect(trimCurve(curve, 0)).toBe(curve);
  expect(trimCurve(curve, 100)).toBeNull();
  const end = trimCurve(curve, 3);
  expect(end[0]).toEqual(curve[0]);
  expect(end[1][0]).toBe(0);
  const start = trimCurve(curve, 3, true);
  expect(start[3]).toEqual(curve[3]);
  expect(start[2][0]).toBe(10);
});
