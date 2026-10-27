import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { STYLE_FIELDS, normalizeStyle, styleFromParams, styleToParams } from './style';

const history = JSON.parse(
  readFileSync(join(__dirname, '../../docs/case-studies/issue-27/data/url-schema-history.json'), 'utf8'),
);
it.each(history)('retains every URL field and option from published schema $sha', ({ fields }) => {
  for (const field of fields) {
    const current = STYLE_FIELDS.find(({ key }) => key === field.key);
    expect(current, field.key).toBeDefined();
    const values =
      field.type === 'range'
        ? [field.min, field.d, field.max]
        : field.type === 'select'
          ? field.options
          : field.type === 'toggle'
            ? [false, true]
            : [field.d];
    for (const value of values) {
      const params = new URLSearchParams({ [field.key]: String(value) });
      const style = styleFromParams(params);
      expect(style[field.key], `${field.key}=${value}`).toEqual(normalizeStyle({ [field.key]: value })[field.key]);
      if (field.type !== 'list') expect(style[field.key], field.key).toEqual(value);
      expect(styleFromParams(styleToParams(style)), `${field.key}=${value}`).toEqual(style);
    }
  }
});
it('preserves legacy gap aliases, explicit colors and empty rows without moving subsequent link indices', () => {
  const old = styleFromParams(
    new URLSearchParams(
      'gap=0.2&endGap=0.3&colors=%23ABCDEF,%23123456&turns=0+0,0+0,15+-15&gaps=~+~+~+~,~+0+~+~,0.18+0.18+~+~',
    ),
  );
  expect(old.startGap).toBe(0.2);
  expect(old.endGap).toBe(0.3);
  expect(old.palette).toBe('custom');
  expect(old.colors).toBe('#abcdef,#123456');
  const params = styleToParams(old);
  expect(params.get('turns')).toBe(',,15 -15');
  expect(params.get('gaps')).toBe(',~ 0,0.18 0.18');
  expect(styleFromParams(params)).toEqual(old);
});
