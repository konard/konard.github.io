// Site-owned geometry and control tokens, shared by every page and skin.
import { color, option, range, select, toggle } from './fields.js';

const corners = [
  ['Tl', 'Top left', 'Левый верхний'],
  ['Tr', 'Top right', 'Правый верхний'],
  ['Br', 'Bottom right', 'Правый нижний'],
  ['Bl', 'Bottom left', 'Левый нижний'],
];
const cornerFields = (part, en, ru) =>
  corners.map(([key, label, russian]) =>
    range(
      `ui.${part}${key}`,
      -1,
      -1,
      80,
      1,
      { en: `${en}: ${label.toLowerCase()}`, ru: `${ru}: ${russian.toLowerCase()}` },
      {
        unit: 'px',
        hint: { en: '−1 follows the skin. 0 makes this corner square.', ru: '−1 — как в оформлении. 0 — прямой угол.' },
      },
    ),
  );

const STYLES = [
  option('solid', 'Solid', 'Сплошная'),
  option('dashed', 'Dashed', 'Штриховая'),
  option('dotted', 'Dotted', 'Пунктирная'),
  option('double', 'Double', 'Двойная'),
];
const SAME_STYLES = [option('same', 'As the border', 'Как у рамки'), ...STYLES];
const COLORS = [
  option('accent', 'Primary accent', 'Основной акцент'),
  option('accent2', 'Secondary accent', 'Второй акцент'),
  option('text', 'Text color', 'Цвет текста'),
];
const EDGE_COLORS = [
  option('skin', 'As in the skin', 'Как в оформлении'),
  ...COLORS,
  option('strong', 'A stronger line', 'Более заметная линия'),
];

export const UI_SECTIONS = [
  {
    id: 'interface',
    title: { en: 'Interface controls', ru: 'Элементы интерфейса' },
    lead: {
      en: 'Buttons, menus, fields, tabs and tables share these controls. Menus are drawn by the site, including their popups. The page is a live preview.',
      ru: 'Кнопки, меню, поля, вкладки и таблицы используют эти настройки. Меню, включая выпадающие списки, рисует сайт. Страница — живой предпросмотр.',
    },
    fields: [
      range(
        'ui.controlHeight',
        32,
        24,
        64,
        1,
        { en: 'Minimum control height', ru: 'Минимальная высота элементов' },
        { unit: 'px' },
      ),
      range(
        'ui.controlPadding',
        10,
        0,
        32,
        1,
        { en: 'Control horizontal padding', ru: 'Горизонтальный отступ элементов' },
        { unit: 'px' },
      ),
      range(
        'ui.controlBorder',
        1,
        0,
        8,
        0.5,
        { en: 'Control border width', ru: 'Толщина рамки элементов' },
        { unit: 'px' },
      ),
      range(
        'ui.controlOpacity',
        0.85,
        0,
        1,
        0.05,
        { en: 'Control background opacity', ru: 'Непрозрачность фона элементов' },
        { unit: '%' },
      ),
      range(
        'ui.menuHeight',
        320,
        120,
        600,
        10,
        { en: 'Maximum menu height', ru: 'Максимальная высота меню' },
        { unit: 'px', css: false },
      ),
      range(
        'ui.menuWidth',
        200,
        120,
        480,
        10,
        { en: 'Minimum menu width', ru: 'Минимальная ширина меню' },
        { unit: 'px', css: false },
      ),
      range(
        'ui.motion',
        1,
        0,
        2,
        0.1,
        { en: 'Interface animation duration', ru: 'Длительность анимации интерфейса' },
        { unit: '×' },
      ),
      range(
        'ui.disabledOpacity',
        0.5,
        0.2,
        1,
        0.05,
        { en: 'Disabled control opacity', ru: 'Непрозрачность отключённых элементов' },
        { unit: '%' },
      ),
      range('ui.sliderSize', 14, 8, 32, 1, { en: 'Slider thumb size', ru: 'Размер бегунка' }, { unit: 'px' }),
      range(
        'ui.sliderTrack',
        3,
        1,
        12,
        1,
        { en: 'Slider track thickness', ru: 'Толщина дорожки слайдера' },
        { unit: 'px' },
      ),
      range('ui.checkSize', 18, 14, 32, 1, { en: 'Checkbox size', ru: 'Размер флажка' }, { unit: 'px' }),
      ...cornerFields('control', 'Controls', 'Элементы'),
      ...cornerFields('panel', 'Panels', 'Панели'),
    ],
  },
  {
    id: 'borders',
    title: { en: 'Borders and accents', ru: 'Рамки и акценты' },
    fields: [
      range('ui.panelBorder', 1, 0, 8, 0.5, { en: 'Panel border width', ru: 'Толщина рамки панелей' }, { unit: 'px' }),
      select('ui.borderStyle', 'solid', STYLES, { en: 'Border style', ru: 'Стиль рамки' }),
      range(
        'ui.borderOpacity',
        0.2,
        0,
        1,
        0.01,
        { en: 'Control border opacity', ru: 'Непрозрачность рамки элементов' },
        { unit: '%' },
      ),
      range(
        'ui.hoverOpacity',
        0.16,
        0,
        1,
        0.01,
        { en: 'Hover accent strength', ru: 'Яркость акцента при наведении' },
        { unit: '%' },
      ),
      toggle('ui.customAccent', false, { en: 'Use custom accent colors', ru: 'Свои цвета акцентов' }),
      color('ui.accent', '#67e8f9', { en: 'Primary accent', ru: 'Основной акцент' }),
      color('ui.accent2', '#a78bfa', { en: 'Secondary accent', ru: 'Второй акцент' }),
      range(
        'ui.accentSize',
        2,
        0,
        16,
        0.5,
        { en: 'Accent strip width', ru: 'Толщина акцентной полосы' },
        { unit: 'px' },
      ),
      select(
        'ui.selection',
        'accent',
        [
          option('accent', 'Primary accent', 'Основной акцент'),
          option('accent2', 'Secondary accent', 'Второй акцент'),
          option('system', 'As in the system', 'Как в системе'),
        ],
        { en: 'Selected text', ru: 'Выделенный текст' },
      ),
      range(
        'ui.selectionOpacity',
        0.35,
        0.1,
        1,
        0.05,
        { en: 'Selection strength', ru: 'Яркость выделения' },
        { unit: '%', when: (s) => s['ui.selection'] !== 'system' },
      ),
      // Issue #49: "We need to make sure all UI elements with borders are
      // configurable": the lines between the parts of a page (the top bar, the
      // menu, the footer, the rows of the timeline and of the settings) had a
      // border of their own that no setting changed.
      select(
        'ui.lines',
        'skin',
        [option('skin', 'As in the skin', 'Как в оформлении'), option('own', 'Own lines', 'Свои линии')],
        { en: 'Lines between parts', ru: 'Линии между частями' },
        {
          hint: {
            en: 'Under the top bar, above the menu and the footer, between rows of the timeline and of the settings, under headings.',
            ru: 'Под верхней панелью, над меню и подвалом, между строками хронологии и настроек, под заголовками.',
          },
        },
      ),
      range(
        'ui.lineWidth',
        1,
        0,
        8,
        0.5,
        { en: 'Line width', ru: 'Толщина линий' },
        { unit: 'px', when: (s) => s['ui.lines'] === 'own' },
      ),
      select(
        'ui.lineStyle',
        'solid',
        STYLES,
        { en: 'Line style', ru: 'Стиль линий' },
        { when: (s) => s['ui.lines'] === 'own' },
      ),
      select(
        'ui.lineColor',
        'skin',
        [option('skin', 'As in the skin', 'Как в оформлении'), ...COLORS],
        { en: 'Line color', ru: 'Цвет линий' },
        { when: (s) => s['ui.lines'] === 'own' },
      ),
      range(
        'ui.lineOpacity',
        0.2,
        0,
        1,
        0.01,
        { en: 'Line opacity', ru: 'Непрозрачность линий' },
        { unit: '%', when: (s) => s['ui.lines'] === 'own' && s['ui.lineColor'] !== 'skin' },
      ),
      select(
        'ui.overflow',
        'clip',
        [
          option('clip', 'Cut at the frame', 'Обрезать по рамке'),
          option('visible', 'Show past the frame', 'Показывать за рамкой'),
        ],
        { en: 'Content that does not fit a panel', ru: 'Содержимое, которое не помещается в панель' },
      ),
    ],
  },
  {
    // Issue #49: "We also need to add configuration of borders on hover, focus,
    // outline and so on". "As in the skin" keeps the colour each element had.
    id: 'states',
    title: { en: 'Hover, focus and selection', ru: 'Наведение, фокус и выбор' },
    lead: {
      en: 'The borders of buttons, tabs, chips, menus and panels under the pointer, when chosen or pressed, and the ring of the keyboard focus.',
      ru: 'Рамки кнопок, вкладок, меток, меню и панелей под указателем, выбранных или нажатых, и обводка фокуса клавиатуры.',
    },
    fields: [
      select('ui.hoverEdge', 'skin', EDGE_COLORS, { en: 'Border color on hover', ru: 'Цвет рамки при наведении' }),
      select('ui.hoverStyle', 'same', SAME_STYLES, { en: 'Border style on hover', ru: 'Стиль рамки при наведении' }),
      select('ui.activeEdge', 'skin', EDGE_COLORS, {
        en: 'Border color of the chosen and pressed',
        ru: 'Цвет рамки выбранных и нажатых',
      }),
      select('ui.activeStyle', 'same', SAME_STYLES, {
        en: 'Border style of the chosen and pressed',
        ru: 'Стиль рамки выбранных и нажатых',
      }),
      range(
        'ui.chosenWidth',
        2,
        0,
        6,
        0.5,
        { en: 'Ring of the chosen color', ru: 'Обводка выбранного цвета' },
        { unit: 'px', hint: { en: 'Palettes and color chips.', ru: 'Палитры и образцы цветов.' } },
      ),
      select('ui.focusColor', 'accent', COLORS, { en: 'Focus ring color', ru: 'Цвет обводки фокуса' }),
      select('ui.focusStyle', 'solid', STYLES, { en: 'Focus ring style', ru: 'Стиль обводки фокуса' }),
      range('ui.focusWidth', 2, 1, 6, 0.5, { en: 'Focus ring width', ru: 'Толщина обводки фокуса' }, { unit: 'px' }),
      range('ui.focusOffset', 3, 0, 8, 1, { en: 'Focus ring offset', ru: 'Отступ обводки фокуса' }, { unit: 'px' }),
    ],
  },
  {
    // Issue #49: the stripe on the left of the experience cards lay on the border
    // of the card, and the summary took all the free height of a card, leaving a
    // gap in the middle of the text.
    id: 'cards',
    title: { en: 'Experience cards', ru: 'Карточки опыта' },
    lead: {
      en: 'The cards of the experience page: a stripe on the left tells the work for a company from open source.',
      ru: 'Карточки страницы опыта: полоса слева отличает работу в компании от открытого кода.',
    },
    fields: [
      select(
        'cards.layout',
        'top',
        [
          option('top', 'Text at the top, tags at the bottom', 'Текст сверху, метки снизу'),
          option('content', 'Each card as high as its text', 'Высота карточки по тексту'),
          option('gap', 'Gap after the summary (as before)', 'Промежуток после описания (как раньше)'),
        ],
        { en: 'Text in the cards', ru: 'Текст в карточках' },
        {
          hint: {
            en: 'The cards of a row are as high as the highest one, unless each card is as high as its text.',
            ru: 'Карточки в ряду одной высоты с самой высокой, если высота карточки не по тексту.',
          },
        },
      ),
      select(
        'cards.stripe',
        'inset',
        [
          option('inset', 'Inside the border', 'Внутри рамки'),
          option('edge', 'On the border (as before)', 'На рамке (как раньше)'),
          option('none', 'No stripe', 'Без полосы'),
        ],
        { en: 'Stripe on the left', ru: 'Полоса слева' },
      ),
      range(
        'cards.stripeWidth',
        3,
        1,
        12,
        0.5,
        { en: 'Stripe width', ru: 'Толщина полосы' },
        { unit: 'px', when: (s) => s['cards.stripe'] !== 'none' },
      ),
      range(
        'cards.stripeOpacity',
        0.7,
        0.1,
        1,
        0.05,
        { en: 'Stripe opacity', ru: 'Непрозрачность полосы' },
        { unit: '%', when: (s) => s['cards.stripe'] !== 'none' },
      ),
      range(
        'cards.stripeInset',
        2,
        0,
        16,
        1,
        { en: 'Stripe gap from the border', ru: 'Отступ полосы от рамки' },
        { unit: 'px', when: (s) => s['cards.stripe'] === 'inset' },
      ),
      range(
        'cards.stripeEnds',
        6,
        0,
        64,
        1,
        { en: 'Stripe gap from the corners', ru: 'Отступ полосы от углов' },
        {
          unit: 'px',
          when: (s) => s['cards.stripe'] === 'inset',
          hint: {
            en: 'At the top and at the bottom, past the corners of the frame.',
            ru: 'Сверху и снизу, после углов рамки.',
          },
        },
      ),
    ],
  },
  {
    id: 'tables',
    title: { en: 'Tables', ru: 'Таблицы' },
    fields: [
      range('ui.tablePadding', 8, 2, 24, 1, { en: 'Table cell padding', ru: 'Отступ ячеек таблицы' }, { unit: 'px' }),
      range('ui.tableBorder', 1, 0, 4, 0.5, { en: 'Table line width', ru: 'Толщина линий таблицы' }, { unit: 'px' }),
      range(
        'ui.tableStripe',
        0.03,
        0,
        0.3,
        0.01,
        { en: 'Alternating row tint', ru: 'Тонирование чередующихся строк' },
        { unit: '%' },
      ),
      range(
        'ui.tableHover',
        0.08,
        0,
        0.4,
        0.01,
        { en: 'Table row hover tint', ru: 'Тонирование строки при наведении' },
        { unit: '%' },
      ),
      toggle('ui.tableGrid', false, { en: 'Vertical table lines', ru: 'Вертикальные линии таблиц' }),
      toggle('ui.tableHeader', true, { en: 'Tint table headers', ru: 'Тонировать заголовки таблиц' }),
    ],
  },
  {
    id: 'accessibility',
    title: { en: 'Comfort and accessibility', ru: 'Комфорт и доступность' },
    fields: [
      select(
        'ui.transparency',
        'auto',
        [
          option('auto', 'Follow system', 'Как в системе'),
          option('reduce', 'Reduce transparency', 'Уменьшить прозрачность'),
          option('allow', 'Allow transparency', 'Разрешить прозрачность'),
        ],
        { en: 'Transparency preference', ru: 'Предпочтение прозрачности' },
      ),
    ],
  },
];
