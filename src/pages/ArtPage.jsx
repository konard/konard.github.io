import Layout from '../components/Layout';
import RepoList, { RepoItem } from '../components/RepoList';
import NetworkGallery from '../components/NetworkGallery';
import Section from '../components/Section';
import { fields } from '../data/fields';
import { byStars, inField, ownRepositories, repo } from './repos';

const SECTIONS = [
  ['art', 'Art'],
  ['symbols', 'Link symbols'],
  ['other', 'Other'],
  ['all', 'All'],
];

export const ART = [
  [
    'konard/twittermatrix',
    'Real-time tweets as the “digital rain” of The Matrix; the rain in the background comes from it.',
  ],
  ['konard/links-visuals', 'The visual language of links used by every symbol on this site.'],
  ['konard/fractal-interference', 'Fractal interference patterns.'],
  ['konard/gravity-simulation', 'Gravity in Rust + WebAssembly.'],
  ['konard/wave-simulation', 'Wave simulations.'],
  ['konard/high-performance-gaussian-splatting', 'Gaussian splatting with dynamic level of detail.'],
  ['konard/anime-avatar', 'A configurable 3D anime avatar.'],
  ['konard/voice-simulator', 'A 3D acoustic model that produces a voice-like sound.'],
  ['konard/audio-decomposer', 'Decomposes audio down to single samples and MIDI notes.'],
  ['konard/numbers-vectorization', 'SVG paths that closely match handwritten digits.'],
  ['konard/rotating-yin-yang', 'A rotating yin yang.'],
  ['konard/distinct-colors', 'Palettes of maximally distinct colors.'],
];

const artFields = fields.filter((f) => ['art', 'other', 'web', 'research', 'education'].includes(f.id));
const artAndOther = ownRepositories.filter((r) => r.fields.includes('art') || r.fields.includes('other'));

/** Art and visual experiments, every symbol of 1–4 links, and repositories that fit no other field. */
export default function ArtPage() {
  const other = inField('other').sort(byStars);
  return (
    <Layout page="art" sections={SECTIONS}>
      <header className="page-hero" id="top">
        <p className="section__kicker">Art & other</p>
        <h1 className="page-hero__title">Art & other projects</h1>
        <p className="page-hero__lead">
          {inField('art').length} visual, audio and game experiments, the full alphabet of link symbols, and{' '}
          {other.length} repositories that do not fit any other field.
        </p>
      </header>

      <Section id="art" kicker="Visual & audio" title="Art">
        <ul className="repos repos--compact repos--grid" aria-label="Art">
          {ART.map(([name, note]) => [repo(name), note])
            .filter(([r]) => r)
            .map(([r, note]) => (
              <RepoItem key={r.fullName} repo={r} note={note} />
            ))}
        </ul>
      </Section>

      <Section id="symbols" kicker="Links theory" title="Every configuration of 1–4 links">
        <NetworkGallery />
      </Section>

      <Section id="other" kicker="Uncategorized" title="Other">
        <ul className="repos repos--compact repos--grid" aria-label="Other">
          {other.map((r) => (
            <RepoItem key={r.fullName} repo={r} />
          ))}
        </ul>
      </Section>

      <Section id="all" kicker="Catalog" title="All art & other repositories">
        <RepoList items={artAndOther} label="Art and other repositories" fieldOptions={artFields} showKinds={false} />
      </Section>
    </Layout>
  );
}
