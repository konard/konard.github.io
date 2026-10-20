import { useState } from 'react';
import Layout from '../components/Layout';
import RepoList, { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import { formatNumber } from '../components/format';
import { fields } from '../data/fields';
import codes from '../links/configurations.json';
import { glyphId } from '../links/glyph';
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
  ['konard/links-animation', 'Animated links.'],
  ['konard/fractal-interference', 'Fractal interference patterns.'],
  ['konard/gravity-simulation', 'Gravity in Rust + WebAssembly.'],
  ['konard/wave-simulation', 'Wave simulations.'],
  ['konard/high-performance-gaussian-splatting', 'Gaussian splatting with dynamic level of detail.'],
  ['konard/anime-avatar', 'A configurable 3D anime avatar.'],
  ['konard/TheAnime', 'An attempt to create an open-source anime series.'],
  ['konard/voice-simulator', 'A 3D acoustic model that produces a voice-like sound.'],
  ['konard/audio-decomposer', 'Decomposes audio down to single samples and MIDI notes.'],
  ['konard/numbers-vectorization', 'SVG paths that closely match handwritten digits.'],
  ['konard/rotating-yin-yang', 'A rotating yin yang.'],
  ['konard/distinct-colors', 'Palettes of maximally distinct colors.'],
  ['konard/slava', 'A painter’s fair.'],
  ['links-games/master-plan', 'A plan for another game multiverse.'],
];

const COUNTS = [1, 2, 3, 4];
const PAGE = 480;
const artFields = fields.filter((f) => ['art', 'other', 'web', 'research', 'education'].includes(f.id));
const artAndOther = ownRepositories.filter((r) => r.fields.includes('art') || r.fields.includes('other'));

/** Every configuration of `n` links (1, 10, 129 or 2836 symbols), drawn from the shared sprite. */
export function SymbolGallery({ sprite = '/link-glyphs.svg' }) {
  const [n, setN] = useState(3);
  const [shown, setShown] = useState(PAGE);
  const list = codes[n];
  return (
    <div className="symbols">
      <div className="symbols__tabs" role="group" aria-label="Number of links">
        {COUNTS.map((k) => (
          <button
            key={k}
            type="button"
            className="button"
            aria-pressed={k === n}
            onClick={() => {
              setN(k);
              setShown(PAGE);
            }}
          >
            {k} {k === 1 ? 'link' : 'links'} <span className="mono">{formatNumber(codes[k].length)}</span>
          </button>
        ))}
      </div>
      <ul className="symbols__grid" aria-label={`Configurations of ${n} links`}>
        {list.slice(0, shown).map((code) => (
          <li key={code} title={code}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <use href={`${sprite}#${glyphId(code)}`} />
            </svg>
            <span className="mono">{code}</span>
          </li>
        ))}
      </ul>
      {list.length > shown && (
        <button type="button" className="button" onClick={() => setShown(shown + PAGE * 2)}>
          Show more ({formatNumber(list.length - shown)} left)
        </button>
      )}
    </div>
  );
}

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
        <p className="section__lead">
          Each symbol is one network of links where every link refers to links of the same network (a bar marks the
          source, an arrow the target). Isomorphic networks are drawn once, so 1–4 links give{' '}
          {formatNumber(COUNTS.reduce((sum, k) => sum + codes[k].length, 0))} different symbols, all of the same size.
          They are the alphabet of the rain in the background.
        </p>
        <SymbolGallery />
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
