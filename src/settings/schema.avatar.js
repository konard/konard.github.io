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
  column: 2,
  title: { en: 'Photo and ring', ru: 'Фото и кольцо' },
  lead: {
    en: 'The photo on the home page and the ring that turns under it. The animations button of the top bar and the motion setting stop the turning; the angle stays.',
    ru: 'Фото на главной странице и кольцо, которое вращается под ним. Кнопка анимаций в верхней панели и настройка движения останавливают вращение; угол остаётся.',
  },
  fields: [
    toggle('avatar.ring', true, { en: 'Show the ring', ru: 'Показывать кольцо' }),
    select('avatar.ringShape', 'skin', shapes, { en: 'Shape of the ring', ru: 'Форма кольца' }),
    select('avatar.photoShape', 'skin', shapes, { en: 'Shape of the photo', ru: 'Форма фото' }),
    select(
      'avatar.spin',
      'clockwise',
      [
        option('clockwise', 'Clockwise', 'По часовой стрелке'),
        option('counter', 'Counter-clockwise', 'Против часовой стрелки'),
        option('still', 'Still', 'Не вращать'),
      ],
      { en: 'Turning', ru: 'Вращение' },
    ),
    range(
      'avatar.period',
      8,
      1,
      60,
      0.5,
      { en: 'Time of one turn', ru: 'Время одного оборота' },
      { unit: 's', hint: { en: 'Less is faster.', ru: 'Меньше — быстрее.' } },
    ),
    range(
      'avatar.angle',
      0,
      -180,
      180,
      1,
      { en: 'Angle', ru: 'Угол' },
      {
        unit: 'deg',
        hint: {
          en: 'The angle of a still ring, and the angle a turning ring starts from: 45 stands a square on its corner.',
          ru: 'Угол неподвижного кольца и угол, с которого начинает вращающееся: 45 ставит квадрат на угол.',
        },
      },
    ),
    range(
      'avatar.ringWidth',
      10,
      0,
      40,
      1,
      { en: 'Width of the ring', ru: 'Ширина кольца' },
      { unit: 'px', hint: { en: 'Beyond the edge of the photo.', ru: 'За краем фото.' } },
    ),
    range('avatar.glow', 24, 0, 80, 1, { en: 'Glow', ru: 'Свечение' }, { unit: 'px' }),
  ],
};
