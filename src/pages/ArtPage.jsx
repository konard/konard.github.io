import Layout from '../components/Layout';
import { DataMark } from '../components/DataSources';
import RepoList, { RepoItem } from '../components/RepoList';
import NetworkGallery from '../components/NetworkGallery';
import Section from '../components/Section';
import { fields } from '../data/fields';
import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { byStars, inField, ownRepositories, repo } from './repos';

const SECTIONS = [
  ['art', { en: 'Art', ru: 'Искусство' }],
  ['symbols', { en: 'Link symbols', ru: 'Символы связей' }],
  ['other', { en: 'Other', ru: 'Прочее' }],
  ['all', { en: 'All', ru: 'Все' }],
];

export const ART = [
  [
    'konard/twittermatrix',
    {
      en: 'Real-time tweets as the “digital rain” of The Matrix; the rain in the background comes from it.',
      ru: 'Твиты в реальном времени как «цифровой дождь» из «Матрицы»; дождь на фоне взят оттуда.',
    },
  ],
  [
    'konard/links-visuals',
    {
      en: 'The visual language of links used by every symbol on this site.',
      ru: 'Визуальный язык связей, которым нарисован каждый символ на этом сайте.',
    },
  ],
  ['konard/fractal-interference', { en: 'Fractal interference patterns.', ru: 'Фрактальные интерференционные узоры.' }],
  ['konard/gravity-simulation', { en: 'Gravity in Rust + WebAssembly.', ru: 'Гравитация на Rust + WebAssembly.' }],
  ['konard/wave-simulation', { en: 'Wave simulations.', ru: 'Симуляции волн.' }],
  [
    'konard/high-performance-gaussian-splatting',
    {
      en: 'Gaussian splatting with dynamic level of detail.',
      ru: 'Гауссов сплэттинг с динамическим уровнем детализации.',
    },
  ],
  ['konard/anime-avatar', { en: 'A configurable 3D anime avatar.', ru: 'Настраиваемый 3D-аниме-аватар.' }],
  [
    'konard/voice-simulator',
    {
      en: 'A 3D acoustic model that produces a voice-like sound.',
      ru: 'Трёхмерная акустическая модель, издающая звук, похожий на голос.',
    },
  ],
  [
    'konard/audio-decomposer',
    {
      en: 'Decomposes audio down to single samples and MIDI notes.',
      ru: 'Раскладывает звук на отдельные сэмплы и MIDI-ноты.',
    },
  ],
  [
    'konard/numbers-vectorization',
    {
      en: 'SVG paths that closely match handwritten digits.',
      ru: 'SVG-контуры, близко повторяющие рукописные цифры.',
    },
  ],
  ['konard/rotating-yin-yang', { en: 'A rotating yin yang.', ru: 'Вращающийся инь-ян.' }],
  [
    'konard/distinct-colors',
    { en: 'Palettes of maximally distinct colors.', ru: 'Палитры максимально различимых цветов.' },
  ],
];

const EXPERIMENTS = {
  en: ['visual, audio and game experiment', 'visual, audio and game experiments'],
  ru: [
    'визуальный, звуковой и игровой эксперимент',
    'визуальных, звуковых и игровых эксперимента',
    'визуальных, звуковых и игровых экспериментов',
  ],
};
const REPOSITORIES = {
  en: ['repository that does', 'repositories that do'],
  ru: ['репозиторий, который не подходит', 'репозитория, которые не подходят', 'репозиториев, которые не подходят'],
};
const ART_LABEL = { en: 'Art', ru: 'Искусство' };
const OTHER_LABEL = { en: 'Other', ru: 'Прочее' };

const artFields = fields.filter((f) => ['art', 'other', 'web', 'research', 'education'].includes(f.id));
const artAndOther = ownRepositories.filter((r) => r.fields.includes('art') || r.fields.includes('other'));

/** Art and visual experiments, every symbol of 1–4 links, and repositories that fit no other field. */
export default function ArtPage() {
  const { lang, t } = useLang();
  const other = inField('other').sort(byStars);
  const art = inField('art').length;
  return (
    <Layout page="art" sections={SECTIONS}>
      <header className="page-hero" id="top">
        <p className="section__kicker">{t({ en: 'Art & other', ru: 'Искусство и прочее' })}</p>
        <h1 className="page-hero__title">{t({ en: 'Art & other projects', ru: 'Искусство и другие проекты' })}</h1>
        <p className="page-hero__lead">
          {t({
            en: `${art} ${plural(art, lang, EXPERIMENTS)}, the full alphabet of link symbols, and ${other.length} ${plural(other.length, lang, REPOSITORIES)} not fit any other field.`,
            ru: `${art} ${plural(art, lang, EXPERIMENTS)}, полный алфавит символов связей и ${other.length} ${plural(other.length, lang, REPOSITORIES)} ни к одной другой области.`,
          })}{' '}
          <DataMark />
        </p>
      </header>

      <Section id="art" kicker={{ en: 'Visual & audio', ru: 'Изображение и звук' }} title={ART_LABEL}>
        <ul className="repos repos--compact repos--grid" aria-label={t(ART_LABEL)}>
          {ART.map(([name, note]) => [repo(name), note])
            .filter(([r]) => r)
            .map(([r, note]) => (
              <RepoItem key={r.fullName} repo={r} note={note} />
            ))}
        </ul>
      </Section>

      <Section
        id="symbols"
        kicker={{ en: 'Links theory', ru: 'Теория связей' }}
        title={{ en: 'Every configuration of 1–4 links', ru: 'Все конфигурации из 1–4 связей' }}
      >
        <NetworkGallery />
      </Section>

      <Section id="other" kicker={{ en: 'Uncategorized', ru: 'Без категории' }} title={OTHER_LABEL}>
        <ul className="repos repos--compact repos--grid" aria-label={t(OTHER_LABEL)}>
          {other.map((r) => (
            <RepoItem key={r.fullName} repo={r} />
          ))}
        </ul>
      </Section>

      <Section
        id="all"
        kicker={{ en: 'Catalog', ru: 'Каталог' }}
        title={{ en: 'All art & other repositories', ru: 'Все репозитории искусства и прочего' }}
      >
        <RepoList
          items={artAndOther}
          label={{ en: 'Art and other repositories', ru: 'Репозитории искусства и прочего' }}
          fieldOptions={artFields}
          showKinds={false}
        />
      </Section>
    </Layout>
  );
}
