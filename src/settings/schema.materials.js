import { localized } from '../i18n/localizer.js';
import { range } from './fields.js';

export const MATERIAL_FIELDS = [
  range('liquid.opacity', 0.85, 0, 1, 0.01, localized('mcf47ce87ce73'), { unit: '%' }),
  range('liquid.contrast', 100, 50, 200, 1, localized('m738596896ad1'), { unit: '%' }),
  range('liquid.noise', 0, 0, 0.25, 0.01, localized('m124e236ea6a9'), { unit: '%' }),
  range('liquid.sheenStrength', 0.16, 0, 0.8, 0.01, localized('m0340ac68b1a8'), { unit: '%' }),
  range('liquid.sheenAngle', 110, 0, 360, 1, localized('m819032aea370'), { unit: 'deg' }),
  range('liquid.lightAngle', 180, 0, 360, 1, localized('m0bf34c1269e4'), { unit: 'deg' }),
  range('liquid.borderWidth', 1, 0, 8, 0.5, localized('m7a1ded29929a'), { unit: 'px' }),
  range('liquid.borderLight', 0.4, 0, 1, 0.01, localized('m0fff34e4e9e2'), { unit: '%' }),
  range('liquid.depthBlur', 20, 0, 80, 1, localized('mf83c8f052e30'), { unit: 'px' }),
  range('liquid.shadowBlur', 30, 0, 100, 1, localized('m111ede846cfc'), { unit: 'px' }),
  range('liquid.shadowDistance', 12, 0, 60, 1, localized('m0446bb8deead'), { unit: 'px' }),
  range('liquid.shadowSpread', 0, -20, 30, 1, localized('m60451f3105f5'), { unit: 'px' }),
  range('liquid.refractionOctaves', 2, 1, 4, 1, localized('m1602a7aa6b49'), { css: false }),
  range('liquid.refractionSmoothing', 2, 0, 10, 0.5, localized('mbb21ae8a3179'), { css: false }),
  range('liquid.refractionSeed', 13, 0, 100, 1, localized('m74372ed5f483'), { css: false }),
];

const OPTICAL_DEFAULTS = {
  ...Object.fromEntries(MATERIAL_FIELDS.map((field) => [field.key, field.d])),
  'liquid.tint': 'theme',
  'liquid.edge': 0.22,
  'liquid.shadow': 0.5,
  'liquid.refractionScale': 40,
  'liquid.refractionDetail': 12,
};

/** Deterministic optical bundles preserve the visitor's geometry and comfort. */
export const MATERIAL_PRESETS = [
  {
    id: 'frosted',
    label: localized('m20b65766fb4a'),
    values: {
      ...OPTICAL_DEFAULTS,
      'liquid.blur': 28,
      'liquid.saturation': 110,
      'liquid.brightness': 100,
      'liquid.contrast': 95,
      'liquid.tintLevel': 0.55,
      'liquid.opacity': 1,
      'liquid.noise': 0.06,
      'liquid.highlight': 0.18,
      'liquid.borderLight': 0.15,
      'liquid.depth': 0.1,
      'liquid.sheen': false,
      'liquid.sheenStrength': 0,
      'liquid.refraction': false,
    },
  },
  {
    id: 'glossy',
    label: localized('m4ca8b7250b49'),
    values: {
      ...OPTICAL_DEFAULTS,
      'liquid.blur': 6,
      'liquid.saturation': 140,
      'liquid.brightness': 110,
      'liquid.contrast': 105,
      'liquid.tintLevel': 0.16,
      'liquid.opacity': 0.9,
      'liquid.noise': 0,
      'liquid.highlight': 0.8,
      'liquid.borderLight': 0.7,
      'liquid.depth': 0.25,
      'liquid.sheen': true,
      'liquid.sheenStrength': 0.3,
      'liquid.refraction': false,
    },
  },
  {
    id: 'liquid',
    label: localized('m15dd1ab54927'),
    values: {
      ...OPTICAL_DEFAULTS,
      'liquid.blur': 18,
      'liquid.saturation': 180,
      'liquid.brightness': 108,
      'liquid.contrast': 110,
      'liquid.tintLevel': 0.22,
      'liquid.opacity': 0.85,
      'liquid.noise': 0,
      'liquid.highlight': 0.55,
      'liquid.borderLight': 0.4,
      'liquid.depth': 0.35,
      'liquid.sheen': true,
      'liquid.sheenStrength': 0.16,
      'liquid.refraction': true,
    },
  },
];
