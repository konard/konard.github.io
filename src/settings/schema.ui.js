import { localized } from '../i18n/localizer.js';
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
        hint: localized('m16852ff27ceb'),
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
    title: localized('m16d5aa1c22fe'),
    lead: localized('m6565786e7c07'),
    fields: [
      range('ui.controlHeight', 32, 24, 64, 1, localized('mfd978b6f502c'), { unit: 'px' }),
      range('ui.controlPadding', 10, 0, 32, 1, localized('mce355217a23b'), { unit: 'px' }),
      range('ui.controlBorder', 1, 0, 8, 0.5, localized('mb8d8463479d8'), { unit: 'px' }),
      range('ui.controlOpacity', 0.85, 0, 1, 0.05, localized('m18026d45591e'), { unit: '%' }),
      range('ui.menuHeight', 320, 120, 600, 10, localized('m1135ec3e1f67'), { unit: 'px', css: false }),
      range('ui.menuWidth', 200, 120, 480, 10, localized('m1ff001a19241'), { unit: 'px', css: false }),
      range('ui.motion', 1, 0, 2, 0.1, localized('maf4d3df54061'), { unit: '×' }),
      range('ui.disabledOpacity', 0.5, 0.2, 1, 0.05, localized('mb5731e532e97'), { unit: '%' }),
      range('ui.sliderSize', 14, 8, 32, 1, localized('m780463fd5578'), { unit: 'px' }),
      range('ui.sliderTrack', 3, 1, 12, 1, localized('m65f9fd527576'), { unit: 'px' }),
      range('ui.checkSize', 18, 14, 32, 1, localized('m0cec1bb52bb2'), { unit: 'px' }),
      ...cornerFields('control', 'Controls', 'Элементы'),
      ...cornerFields('panel', 'Panels', 'Панели'),
    ],
  },
  {
    id: 'borders',
    title: localized('ma401290d4598'),
    fields: [
      range('ui.panelBorder', 1, 0, 8, 0.5, localized('ma0e58b8b2544'), { unit: 'px' }),
      select('ui.borderStyle', 'solid', STYLES, localized('m310c2fc07266')),
      range('ui.borderOpacity', 0.2, 0, 1, 0.01, localized('m446ab31a00b3'), { unit: '%' }),
      range('ui.hoverOpacity', 0.16, 0, 1, 0.01, localized('md25458f9f074'), { unit: '%' }),
      toggle('ui.customAccent', false, localized('m80d74ad0349b')),
      color('ui.accent', '#67e8f9', localized('mff47c50baf9f')),
      color('ui.accent2', '#a78bfa', localized('mf6636a708b53')),
      range('ui.accentSize', 2, 0, 16, 0.5, localized('m3d851d6fc43f'), { unit: 'px' }),
      select(
        'ui.selection',
        'accent',
        [
          option('accent', 'Primary accent', 'Основной акцент'),
          option('accent2', 'Secondary accent', 'Второй акцент'),
          option('system', 'As in the system', 'Как в системе'),
        ],
        localized('m5f8ec799ac2f'),
      ),
      range('ui.selectionOpacity', 0.35, 0.1, 1, 0.05, localized('mcb7db5f5e47b'), {
        unit: '%',
        when: (s) => s['ui.selection'] !== 'system',
      }),
      // Issue #49: "We need to make sure all UI elements with borders are
      // configurable": the lines between the parts of a page (the top bar, the
      // menu, the footer, the rows of the timeline and of the settings) had a
      // border of their own that no setting changed.
      select(
        'ui.lines',
        'skin',
        [option('skin', 'As in the skin', 'Как в оформлении'), option('own', 'Own lines', 'Свои линии')],
        localized('m293e957b8b30'),
        {
          hint: localized('m79b5f03fe475'),
        },
      ),
      range('ui.lineWidth', 1, 0, 8, 0.5, localized('m19156ba5b253'), {
        unit: 'px',
        when: (s) => s['ui.lines'] === 'own',
      }),
      select('ui.lineStyle', 'solid', STYLES, localized('mef988a21cc34'), { when: (s) => s['ui.lines'] === 'own' }),
      select(
        'ui.lineColor',
        'skin',
        [option('skin', 'As in the skin', 'Как в оформлении'), ...COLORS],
        localized('m353230e19b6a'),
        { when: (s) => s['ui.lines'] === 'own' },
      ),
      range('ui.lineOpacity', 0.2, 0, 1, 0.01, localized('md09eeaab6929'), {
        unit: '%',
        when: (s) => s['ui.lines'] === 'own' && s['ui.lineColor'] !== 'skin',
      }),
      select(
        'ui.overflow',
        'clip',
        [
          option('clip', 'Cut at the frame', 'Обрезать по рамке'),
          option('visible', 'Show past the frame', 'Показывать за рамкой'),
        ],
        localized('m8de187231e23'),
      ),
    ],
  },
  {
    // Issue #49: "We also need to add configuration of borders on hover, focus,
    // outline and so on". "As in the skin" keeps the colour each element had.
    id: 'states',
    title: localized('m6d5854c42d90'),
    lead: localized('mc726fd5802f0'),
    fields: [
      select('ui.hoverEdge', 'skin', EDGE_COLORS, localized('m219485e069d1')),
      select('ui.hoverStyle', 'same', SAME_STYLES, localized('m2659a13a6deb')),
      select('ui.activeEdge', 'skin', EDGE_COLORS, localized('mf7613446f91e')),
      select('ui.activeStyle', 'same', SAME_STYLES, localized('mac8ba4a6c7b6')),
      range('ui.chosenWidth', 2, 0, 6, 0.5, localized('m6473db0a41b5'), {
        unit: 'px',
        hint: localized('m88406f2728bb'),
      }),
      select('ui.focusColor', 'accent', COLORS, localized('m75a4e63af14f')),
      select('ui.focusStyle', 'solid', STYLES, localized('m8c953f7f60c5')),
      range('ui.focusWidth', 2, 1, 6, 0.5, localized('m9ea66ca9cb34'), { unit: 'px' }),
      range('ui.focusOffset', 3, 0, 8, 1, localized('mb79399dc8926'), { unit: 'px' }),
    ],
  },
  {
    // Issue #49: the stripe on the left of the experience cards lay on the border
    // of the card, and the summary took all the free height of a card, leaving a
    // gap in the middle of the text.
    id: 'cards',
    title: localized('mb7c97e692c0e'),
    lead: localized('m556e6f3b173a'),
    fields: [
      select(
        'cards.layout',
        'top',
        [
          option('top', 'Text at the top, tags at the bottom', 'Текст сверху, метки снизу'),
          option('content', 'Each card as high as its text', 'Высота карточки по тексту'),
          option('gap', 'Gap after the summary (as before)', 'Промежуток после описания (как раньше)'),
        ],
        localized('mbeefefd11479'),
        {
          hint: localized('m01e48c290463'),
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
        localized('m74da5c43bde5'),
      ),
      range('cards.stripeWidth', 3, 1, 12, 0.5, localized('m5d5a22a24fa0'), {
        unit: 'px',
        when: (s) => s['cards.stripe'] !== 'none',
      }),
      range('cards.stripeOpacity', 0.7, 0.1, 1, 0.05, localized('m530700267307'), {
        unit: '%',
        when: (s) => s['cards.stripe'] !== 'none',
      }),
      range('cards.stripeInset', 2, 0, 16, 1, localized('m0df128c03195'), {
        unit: 'px',
        when: (s) => s['cards.stripe'] === 'inset',
      }),
      range('cards.stripeEnds', 6, 0, 64, 1, localized('m46e9c0faa2e2'), {
        unit: 'px',
        when: (s) => s['cards.stripe'] === 'inset',
        hint: localized('m3243d2aafe47'),
      }),
    ],
  },
  {
    id: 'tables',
    title: localized('md5ce05235a41'),
    fields: [
      range('ui.tablePadding', 8, 2, 24, 1, localized('m07af60d33f0f'), { unit: 'px' }),
      range('ui.tableBorder', 1, 0, 4, 0.5, localized('m7b38a3b9a501'), { unit: 'px' }),
      range('ui.tableStripe', 0.03, 0, 0.3, 0.01, localized('m6f3fe65040fc'), { unit: '%' }),
      range('ui.tableHover', 0.08, 0, 0.4, 0.01, localized('m2bdfa3886e4e'), { unit: '%' }),
      toggle('ui.tableGrid', false, localized('m30d358838972')),
      toggle('ui.tableHeader', true, localized('mf0fdcd9478af')),
    ],
  },
  {
    id: 'accessibility',
    title: localized('m52c659757ffc'),
    fields: [
      select(
        'ui.transparency',
        'auto',
        [
          option('auto', 'Follow system', 'Как в системе'),
          option('reduce', 'Reduce transparency', 'Уменьшить прозрачность'),
          option('allow', 'Allow transparency', 'Разрешить прозрачность'),
        ],
        localized('ma790d5bacc0c'),
      ),
    ],
  },
];
