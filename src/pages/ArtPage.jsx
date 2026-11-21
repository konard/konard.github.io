import { localized } from '../i18n/localizer.js';
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
  ['art', localized('mc3ade8d55b2e')],
  ['symbols', localized('m4efc6d452a22')],
  ['other', localized('mecfa8c4a7cbe')],
  ['all', localized('m910bdb26a8b9')],
];

export const ART = [
  ['konard/twittermatrix', localized('m61d0c96db178')],
  ['konard/links-visuals', localized('m49dc0a093906')],
  ['konard/fractal-interference', localized('m1bdc1de69f19')],
  ['konard/gravity-simulation', localized('ma843953b8e65')],
  ['konard/wave-simulation', localized('m0f6285990821')],
  ['konard/high-performance-gaussian-splatting', localized('m4cfabe96729d')],
  ['konard/anime-avatar', localized('m1cad26a483aa')],
  ['konard/voice-simulator', localized('mc5a5c391e89e')],
  ['konard/audio-decomposer', localized('m72e93e07c63d')],
  ['konard/numbers-vectorization', localized('me0d709bd1291')],
  ['konard/rotating-yin-yang', localized('mb821589081e7')],
  ['konard/distinct-colors', localized('mbb3ee3ecb6cc')],
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
const ART_LABEL = localized('mc3ade8d55b2e');
const OTHER_LABEL = localized('mecfa8c4a7cbe');

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
        <p className="section__kicker">{t(localized('m358ec6322de0'))}</p>
        <h1 className="page-hero__title">{t(localized('m6121c19b6228'))}</h1>
        <p className="page-hero__lead">
          {t({
            en: `${art} ${plural(art, lang, EXPERIMENTS)}, the full alphabet of link symbols, and ${other.length} ${plural(other.length, lang, REPOSITORIES)} not fit any other field.`,
            ru: `${art} ${plural(art, lang, EXPERIMENTS)}, полный алфавит символов связей и ${other.length} ${plural(other.length, lang, REPOSITORIES)} ни к одной другой области.`,
          })}{' '}
          <DataMark />
        </p>
      </header>

      <Section id="art" kicker={localized('m40f2a0c35b47')} title={ART_LABEL}>
        <ul className="repos repos--compact repos--grid" aria-label={t(ART_LABEL)}>
          {ART.map(([name, note]) => [repo(name), note])
            .filter(([r]) => r)
            .map(([r, note]) => (
              <RepoItem key={r.fullName} repo={r} note={note} />
            ))}
        </ul>
      </Section>

      <Section id="symbols" kicker={localized('mcead92e26de2')} title={localized('mf0b150b21dfd')}>
        <NetworkGallery />
      </Section>

      <Section id="other" kicker={localized('maee9c75bae50')} title={OTHER_LABEL}>
        <ul className="repos repos--compact repos--grid" aria-label={t(OTHER_LABEL)}>
          {other.map((r) => (
            <RepoItem key={r.fullName} repo={r} />
          ))}
        </ul>
      </Section>

      <Section id="all" kicker={localized('mb51413f8e9ce')} title={localized('mecf32dd2f588')}>
        <RepoList items={artAndOther} label={localized('mbefafd01dc25')} fieldOptions={artFields} showKinds={false} />
      </Section>
    </Layout>
  );
}
