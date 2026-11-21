import { localized } from '../i18n/localizer.js';
import Layout from '../components/Layout';
import MetaTheory from '../components/MetaTheory';
import NetworkGallery from '../components/NetworkGallery';
import ProblemSolving from '../components/ProblemSolving';
import ProblemSolvingDiagram from '../components/ProblemSolvingDiagram';
import RepoList, { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import { tr, useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { fields } from '../data/fields';
import { problemSolving, problemSolvingNotes } from '../data/profile';
import { metaTheory } from '../data/theory';
import { inField, ownRepositories, repo } from './repos';

const SECTIONS = [
  ['theory', localized('mcead92e26de2')],
  ['symbols', localized('m4efc6d452a22')],
  ['method', localized('m7262347a903e')],
  ['highlights', localized('m0b62f7a16997')],
  ['laws', localized('m0c6737d74312')],
  ['all', localized('mb13065ae5fb8')],
];

// The research repositories worth a look first, grouped by question.
export const HIGHLIGHTS = [
  {
    title: localized('mb5e5360dd182'),
    repos: [
      ['konard/p-vs-np', localized('m4a96e7047a3c')],
      ['konard/tsp', localized('md97fedc02045')],
      ['konard/subset-sum', localized('m71bc27d40000')],
      ['konard/sat', localized('m9e5b1e4e31e2')],
      ['konard/hash-inversion', localized('m031c7641d8c0')],
      ['link-foundation/network-isomorphism-solver', localized('m33eb0ff993ae')],
    ],
  },
  {
    title: localized('m3b34a5997bf7'),
    repos: [
      ['konard/physical-unified-theory', localized('m2869b7b7e383')],
      ['konard/gravity-simulation', localized('md7f6ccc459b0')],
      ['konard/wave-simulation', localized('m1d3a83a6bbdc')],
      ['konard/fractal-interference', localized('m87c13e7fee54')],
      ['konard/solar-thermophotovoltaic-cell', localized('mfbcaee3824e5')],
      ['konard/spacecraft', localized('mfe4b3d89b203')],
    ],
  },
  {
    title: localized('mfaa733ada403'),
    repos: [
      ['link-foundation/meta-theory', localized('m19936cfa6e10')],
      ['deep-foundation/deep-theory', localized('mf787140f7fe2')],
      ['link-foundation/relative-meta-logic', localized('m2a935a94c27b')],
      ['konard/sets-paradox', localized('meeced6cc9390')],
      ['konard/primes', localized('m6fd65586115b')],
      ['konard/golden-ratio', localized('mb0448d94bf20')],
    ],
  },
  {
    title: localized('m340572ff6f5c'),
    repos: [
      ['konard/problem-solving', localized('m8a8a7fc0e868')],
      ['link-assistant/formal-ai', localized('m99590493d1e7')],
      ['linksplatform/Solver', localized('m7d078ae7225e')],
      ['link-foundation/rules-inference', localized('m8c3dbfe7dcb9')],
      ['link-foundation/grammar-inference', localized('me96ced4689f3')],
      ['konard/immortality', localized('m61778644b522')],
    ],
  },
];

// Laws treated as data: codices as datasets, verdicts as training data, bots on top.
export const LAWS = [
  ['deep-foundation/russian-laws', localized('m3467d0247bfa')],
  ['konard/russian-law', localized('mc9e320ea8842')],
  ['konard/verdicts', localized('m6105061999f7')],
  ['link-assistant/semantic-primes', localized('m783982ee680a')],
  ['konard/price-power-law-inference', localized('m4a44305c08a3')],
  ['deep-foundation/russian-laws-bot', localized('m26ee5060d022')],
  ['konard/verdicts-bot', localized('mf20dbaba8cee')],
  ['link-assistant/legal', localized('m207c3f998d72')],
  ['konard/3-ndfl', localized('mbcac4202bdad')],
];

const RESEARCH_REPOSITORIES = {
  en: ['research repository', 'research repositories'],
  ru: ['исследовательский репозиторий', 'исследовательских репозитория', 'исследовательских репозиториев'],
};
const PROJECTS = { en: ['project', 'projects'], ru: ['проект', 'проекта', 'проектов'] };

const researchFields = fields.filter((f) => ['research', 'legal', 'associative', 'ml', 'ai'].includes(f.id));
const research = ownRepositories.filter((r) => r.fields.includes('research') || r.fields.includes('legal'));

function Picks({ list, label }) {
  const { t } = useLang();
  return (
    <ul className="repos repos--compact" aria-label={t(label)}>
      {list
        .map(([name, note]) => [repo(name), note])
        .filter(([r]) => r)
        .map(([r, note]) => (
          <RepoItem key={r.fullName} repo={r} note={note} />
        ))}
    </ul>
  );
}

const LAWS_TITLE = localized('mb094054e0c0b');

/** Research: the links theory, the problem solving method, open problems, physics and laws as data science. */
export default function ResearchPage() {
  const { lang, t } = useLang();
  const researchCount = inField('research').length;
  const legalCount = inField('legal').length;
  return (
    <Layout page="research" sections={SECTIONS}>
      <header className="page-hero" id="top">
        <p className="section__kicker">{t(localized('mb5571de8acf7'))}</p>
        <h1 className="page-hero__title">{t(localized('mca86c130f6a8'))}</h1>
        <p className="page-hero__lead">
          {t({
            en: `${researchCount} research repositories: a meta-theory of links that can describe any data, a universal algorithm to solve any problem, experiments with P vs NP and the travelling salesman problem, physics simulations and ${legalCount} projects that treat laws as data.`,
            ru: `${researchCount} ${plural(researchCount, lang, RESEARCH_REPOSITORIES)}: метатеория связей, способная описать любые данные, универсальный алгоритм решения любых задач, эксперименты с P vs NP и задачей коммивояжёра, физические симуляции и ${legalCount} ${plural(legalCount, lang, PROJECTS)}, в которых законы — это данные.`,
          })}
        </p>
      </header>

      <Section id="theory" kicker={localized('m2f38d6b950bd')} title={localized('mcadcef1d4c2f')}>
        <MetaTheory theory={metaTheory} detailed />
      </Section>

      <Section id="symbols" kicker={localized('mcead92e26de2')} title={localized('mf0b150b21dfd')}>
        <NetworkGallery />
      </Section>

      <Section id="method" kicker={localized('m2fde7b12b848')} title={localized('mcdc1470065ca')}>
        <p className="section__lead">{t(localized('mc4ad5a8cdd3a'))}</p>
        <ProblemSolvingDiagram />
        <ProblemSolving steps={problemSolving} notes={problemSolvingNotes} />
      </Section>

      <Section id="highlights" kicker={localized('mc26377684d70')} title={localized('m227f3e9be927')}>
        <div className="profession-grid">
          {HIGHLIGHTS.map((h) => (
            <article key={tr(h.title, 'en')} className="profession">
              <h3>{t(h.title)}</h3>
              <Picks list={h.repos} label={h.title} />
            </article>
          ))}
        </div>
      </Section>

      <Section id="laws" kicker={localized('ma74ffca8d032')} title={LAWS_TITLE}>
        <p className="section__lead">{t(localized('mfdf5aed55b94'))}</p>
        <Picks list={LAWS} label={LAWS_TITLE} />
      </Section>

      <Section id="all" kicker={localized('mb51413f8e9ce')} title={localized('m33f2c0ab51f3')}>
        <RepoList items={research} label={localized('m1d9d3bbd6b7f')} fieldOptions={researchFields} showKinds={false} />
      </Section>
    </Layout>
  );
}
