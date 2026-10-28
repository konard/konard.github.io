// Sound design (issue #15: "we should fully support sound design and all
// other configuration options from all previous issues"; issue #13 asked for
// the style of konard/immortality, whose interface has sounds). The sounds are
// synthesized by src/sound/engine.js, which is loaded only when sound is on.
// Every interaction has up to four sounds, played at random, in turn or all
// together, and its own level. Only scripts read these settings (`css: false`).
import { option, range, select, toggle } from './fields.js';

/** The sounds of src/sound/library.js: id, name and character in English and Russian. */
export const SOUNDS = [
  ['quartz', 'Quartz', 'glassy high tick', 'Кварц', 'стеклянный высокий тик'],
  ['cobalt', 'Cobalt', 'square blip falling a fifth', 'Кобальт', 'квадратный сигнал, падающий на квинту'],
  ['comet', 'Comet', 'rising triangle sweep', 'Комета', 'восходящий треугольный свип'],
  ['ion', 'Ion', 'minimal sine tick', 'Ион', 'короткий синусоидальный тик'],
  ['halo', 'Halo', 'soft rounded drop', 'Гало', 'мягкая округлая капля'],
  ['tide', 'Tide', 'low rising swell', 'Прилив', 'низкая нарастающая волна'],
  ['mica', 'Mica', 'burst of key-like ticks', 'Слюда', 'очередь щелчков, как клавиши'],
  ['nova', 'Nova', 'double rising power-up chirp', 'Нова', 'двойной восходящий сигнал включения'],
  ['zephyr', 'Zephyr', 'airy upward whoosh', 'Зефир', 'воздушный взлетающий шорох'],
  ['ember', 'Ember', 'band-passed static crackle', 'Уголь', 'треск помех'],
  ['prism', 'Prism', 'FM bell with shimmer', 'Призма', 'колокольчик с переливом'],
  ['glacier', 'Glacier', 'crystalline two-note interval', 'Ледник', 'кристальный интервал из двух нот'],
  ['pulsar', 'Pulsar', 'sub-bass thump with a click', 'Пульсар', 'низкий удар со щелчком'],
  ['orbit', 'Orbit', 'stereo ping-pong blips', 'Орбита', 'сигналы, прыгающие между каналами'],
  ['vapor', 'Vapor', 'falling filtered breath', 'Пар', 'затихающий выдох'],
  ['cinder', 'Cinder', 'sparse crackling grains', 'Окалина', 'редкие потрескивания'],
  ['tungsten', 'Tungsten', 'inharmonic metallic ping', 'Вольфрам', 'металлический звон'],
  ['helix', 'Helix', 'arpeggiated triad sparkle', 'Спираль', 'искристое арпеджио'],
  ['drift', 'Drift', 'detuned falling pad blip', 'Дрейф', 'расстроенный падающий сигнал'],
  ['basalt', 'Basalt', 'deep woody knock', 'Базальт', 'глубокий деревянный стук'],
  ['flint', 'Flint', 'crisp mechanical switch', 'Кремень', 'чёткий механический переключатель'],
  ['opal', 'Opal', 'soft marimba mallet', 'Опал', 'мягкий удар маримбы'],
  ['lumen', 'Lumen', 'bright major-third chime', 'Люмен', 'светлый перезвон большой терции'],
  ['sonar', 'Sonar', 'ping with an echo tail', 'Сонар', 'сигнал с эхом'],
  ['vesper', 'Vesper', 'slow evening pad swell', 'Веспер', 'медленная вечерняя волна'],
  ['relay', 'Relay', 'latching double click', 'Реле', 'двойной щелчок защёлки'],
  ['raindrop', 'Raindrop', 'a drop of the link rain', 'Капля', 'капля дождя связей'],
  ['link', 'Link', 'two notes a fifth apart that join', 'Связь', 'две ноты через квинту, соединяющиеся в одну'],
  ['glass', 'Glass', 'a tap on a glass panel', 'Стекло', 'стук по стеклянной панели'],
  ['warp', 'Warp', 'falling sweep over rising air', 'Варп', 'падающий свип над нарастающим воздухом'],
  ['byte', 'Byte', 'eight quick bits', 'Байт', 'восемь быстрых битов'],
];

export const SOUND_IDS = SOUNDS.map(([id]) => id);

const SOUND_OPTIONS = [
  option('none', 'No sound', 'Без звука'),
  ...SOUNDS.map(([id, en, enCharacter, ru, ruCharacter]) =>
    option(id, `${en} — ${enCharacter}`, `${ru} — ${ruCharacter}`),
  ),
];

/** The interactions of the site that can sound, with the sounds they play by default. */
export const SOUND_EVENTS = [
  ['hover', 'Pointing at a link or a button', 'Наведение на ссылку или кнопку', ['quartz']],
  ['activate', 'Pressing a button or a link', 'Нажатие на кнопку или ссылку', ['cobalt', 'relay']],
  ['toggle', 'Switches', 'Переключатели', ['flint']],
  ['select', 'Choices, tabs and sliders', 'Выбор, вкладки и ползунки', ['comet']],
  ['scan', 'Moving over a chart', 'Движение по графику', ['ion']],
  ['open', 'Opening', 'Открытие', ['zephyr']],
  ['close', 'Closing', 'Закрытие', ['vapor']],
  ['type', 'Typing', 'Набор текста', []],
  ['intro', 'Switching the sound on', 'Включение звука', ['nova']],
  ['notify', 'Messages', 'Сообщения', ['lumen']],
];

/** The tabs of the section: the interactions by kind, so the section stays short. */
export const SOUND_TABS = [
  ['pointer', 'Pointing', 'Наведение', ['hover', 'scan']],
  ['press', 'Pressing', 'Нажатия', ['activate', 'toggle', 'select']],
  ['panels', 'Panels and text', 'Панели и текст', ['open', 'close', 'type']],
  ['messages', 'Messages', 'Сообщения', ['intro', 'notify']],
];
const tabOf = (event) => `sound-${SOUND_TABS.find(([, , , events]) => events.includes(event))[0]}`;

/** At most this many sounds per interaction (immortality has the same limit of slots, shown one by one). */
export const SOUND_SLOTS = [1, 2, 3, 4];

const on = (s) => s['sound.on'];
const sound = { css: false, when: on };

/** The settings of one interaction: up to four sounds, each shown once the one before is chosen, and a level. */
function eventFields([event, en, ru, sounds]) {
  const slot = (n) => `sound.${event}${n}`;
  const tab = tabOf(event);
  return [
    ...SOUND_SLOTS.map((n) =>
      select(
        slot(n),
        sounds[n - 1] || 'none',
        SOUND_OPTIONS,
        n === 1 ? { en, ru } : { en: `${en}, sound ${n}`, ru: `${ru}, звук ${n}` },
        {
          ...sound,
          tab,
          preview: 'sound',
          when: (s) => on(s) && SOUND_SLOTS.slice(0, n - 1).every((m) => s[slot(m)] !== 'none'),
        },
      ),
    ),
    range(
      `sound.${event}Level`,
      1,
      0,
      2,
      0.05,
      { en: `${en}: level`, ru: `${ru}: громкость` },
      { ...sound, tab, unit: '%', when: (s) => on(s) && s[slot(1)] !== 'none' },
    ),
  ];
}

export const SOUND_SECTION = {
  id: 'sound',
  title: { en: 'Sound', ru: 'Звук' },
  lead: {
    en: 'Sounds of the interface, synthesized in the browser (no files are loaded), as in konard/immortality. Every interaction (in the tabs below) can play up to four sounds; ▶ plays one. The sound starts only after you press something on the page.',
    ru: 'Звуки интерфейса, синтезируемые в браузере (без загрузки файлов), как в konard/immortality. Каждое действие (во вкладках ниже) может играть до четырёх звуков; ▶ проигрывает звук. Звук начинается только после нажатия на что-нибудь на странице.',
  },
  tabs: SOUND_TABS.map(([id, en, ru]) => ({ id: `sound-${id}`, label: { en, ru } })),
  fields: [
    toggle('sound.on', false, { en: 'Sounds of the interface', ru: 'Звуки интерфейса' }, { css: false }),
    range('sound.volume', 1, 0, 2, 0.05, { en: 'Volume', ru: 'Громкость' }, { ...sound, unit: '%' }),
    select(
      'sound.mode',
      'random',
      [
        option('random', 'One of them at random', 'Один из них случайно'),
        option('cycle', 'Each in turn', 'По очереди'),
        option('layer', 'All together', 'Все вместе'),
      ],
      { en: 'Several sounds of an interaction', ru: 'Несколько звуков действия' },
      sound,
    ),
    select(
      'sound.tone',
      'neutral',
      [
        option('warm', 'Warm (softer highs)', 'Тёплый (мягче высокие)'),
        option('neutral', 'Neutral', 'Нейтральный'),
        option('bright', 'Bright (more air)', 'Яркий (больше воздуха)'),
      ],
      { en: 'Tone', ru: 'Тембр' },
      sound,
    ),
    range('sound.reverb', 0.2, 0, 1, 0.05, { en: 'Room echo', ru: 'Эхо комнаты' }, { ...sound, unit: '%' }),
    range(
      'sound.room',
      1.4,
      0.3,
      4,
      0.1,
      { en: 'Size of the room', ru: 'Размер комнаты' },
      {
        ...sound,
        unit: 's',
        when: (s) => on(s) && s['sound.reverb'] > 0,
        hint: { en: 'How long the echo lasts.', ru: 'Сколько длится эхо.' },
      },
    ),
    range(
      'sound.pitch',
      15,
      0,
      100,
      5,
      { en: 'Pitch variation', ru: 'Разброс высоты' },
      {
        ...sound,
        unit: 'cents',
        hint: {
          en: 'A random detune of every play, so repeated sounds do not feel mechanical.',
          ru: 'Случайная расстройка каждого звука, чтобы повторы не звучали механически.',
        },
      },
    ),
    toggle('sound.stereo', true, { en: 'Sound from where the pointer is', ru: 'Звук со стороны указателя' }, sound),
    range(
      'sound.width',
      0.6,
      0,
      1,
      0.05,
      { en: 'Stereo width', ru: 'Ширина стерео' },
      { ...sound, unit: '%', when: (s) => on(s) && s['sound.stereo'] },
    ),
    range(
      'sound.gap',
      80,
      0,
      500,
      10,
      { en: 'Shortest pause between hover sounds', ru: 'Наименьшая пауза между звуками наведения' },
      { ...sound, unit: 'ms' },
    ),
    ...SOUND_EVENTS.flatMap(eventFields),
  ],
};
