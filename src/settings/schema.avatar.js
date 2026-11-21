import { localized } from '../i18n/localizer.js';
// The photo of the home page and the ring that turns under it (issue #47: "The
// rotating square under the avatar picture must be configurable (speed, size
// and or even static rotation angle so on)").
//
// The ring is a square in the futuristic skin because that skin squares every
// corner of the page (`border-radius: var(--ui-control-corners)` in
// skins.future.css); "As the skin" keeps that, the other shapes override it.
// The defaults are the look of the site before these settings existed.
import { option, range, select, toggle } from './fields.js';

const shapes = [
  option('skin', 'As the skin', 'Как в оформлении'),
  option('circle', 'Circle', 'Круг'),
  option('rounded', 'Rounded square', 'Скруглённый квадрат'),
  option('square', 'Square', 'Квадрат'),
];

export const AVATAR_SECTION = {
  id: 'avatar',
  title: localized('m1e4158268513'),
  lead: localized('m9889eb9060e5'),
  fields: [
    toggle('avatar.ring', true, localized('md5ebf89543a6')),
    select('avatar.ringShape', 'skin', shapes, localized('md752f6a7de12')),
    select('avatar.photoShape', 'skin', shapes, localized('m9aa6506256bb')),
    select(
      'avatar.spin',
      'clockwise',
      [
        option('clockwise', 'Clockwise', 'По часовой стрелке'),
        option('counter', 'Counter-clockwise', 'Против часовой стрелки'),
        option('still', 'Still', 'Не вращать'),
      ],
      localized('m2a2f408249ee'),
    ),
    range('avatar.period', 8, 1, 60, 0.5, localized('m56b39b6cc06e'), { unit: 's', hint: localized('m3907f9bdf558') }),
    range('avatar.angle', 0, -180, 180, 1, localized('ma4c2e181a993'), {
      unit: 'deg',
      hint: localized('m8bd092f114c9'),
    }),
    range('avatar.ringWidth', 10, 0, 40, 1, localized('m1bc2cf08d434'), {
      unit: 'px',
      hint: localized('md9f8ba2a85a1'),
    }),
    // Issue #49: the border of the photo was the one bordered element of the home page no setting changed.
    range('avatar.photoBorder', 2, 0, 16, 0.5, localized('md1f73191d626'), { unit: 'px' }),
    range('avatar.glow', 24, 0, 80, 1, localized('m3c94e643fd27'), { unit: 'px' }),
  ],
};
