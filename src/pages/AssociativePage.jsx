import { localized } from '../i18n/localizer.js';
import Glyph from '../components/Glyph';
import { DataMark } from '../components/DataSources';
import Layout from '../components/Layout';
import RepoList, { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import { useLang } from '../i18n/prefs';
import { useNotation } from '../links/notation';
import { plural } from '../i18n/plural';
import { fields } from '../data/fields';
import { STACK } from '../data/stack';
import { metaTheory } from '../data/theory';
import { inField, repo } from './repos';

export { STACK };

const SECTIONS = [
  ['stack', localized('m2bfca692a47b')],
  ['all', localized('m70e1cc1c5e4a')],
];

const REPOSITORIES = { en: ['repository', 'repositories'], ru: ['репозиторий', 'репозитория', 'репозиториев'] };

const assocFields = fields.filter((f) =>
  ['associative', 'data', 'systems', 'ai', 'languages', 'research'].includes(f.id),
);

/** The associative stack from the links meta-theory up to the applications (src/data/stack.js). */
export default function AssociativePage() {
  const { lang, t } = useLang();
  const { n } = useNotation();
  const all = inField('associative');
  return (
    <Layout page="associative" sections={SECTIONS}>
      <header className="page-hero" id="top">
        <p className="section__kicker">{t(localized('me4e2ce610593'))}</p>
        <h1 className="page-hero__title">{t(localized('m114edf2dad78'))}</h1>
        <p className="page-hero__lead">
          {t({
            en: `Since 2010: ${all.length} repositories that store, query and reason about data as links (${n(metaTheory.tldr)}). The stack below starts from the links meta-theory and goes up through notation, storage, tools and the Deep platform to the AI and applications: every project of linksplatform, link-foundation and link-assistant in one of its layers.`,
            ru: `С 2010 года: ${all.length} ${plural(all.length, lang, REPOSITORIES)}, которые хранят данные как связи, выполняют по ним запросы и рассуждают о них (${n(metaTheory.tldr)}). Стек ниже начинается с метатеории связей и поднимается через нотацию, хранилища, инструменты и платформу Deep к ИИ и приложениям: каждый проект linksplatform, link-foundation и link-assistant находится в одном из его слоёв.`,
          })}{' '}
          <DataMark />
        </p>
      </header>

      <Section id="stack" kicker={localized('meeb0b7d64c58')} title={localized('mfdfe155c6b1c')}>
        <nav className="chips stack__index" aria-label={t(localized('m95b0662f8aaa'))}>
          {STACK.map((layer, i) => (
            <a key={layer.id} className="chip" href={`#layer-${layer.id}`}>
              {i + 1}. {t(layer.title)} <span className="muted">{layer.repos.length}</span>
            </a>
          ))}
        </nav>
        <ol className="stack">
          {STACK.map((layer) => (
            <li key={layer.id} className="stack__layer" id={`layer-${layer.id}`}>
              <div className="stack__head">
                <Glyph code={layer.glyph} size={44} />
                <div>
                  <h3>{t(layer.title)}</h3>
                  <p className="muted">{n(t(layer.summary))}</p>
                </div>
              </div>
              <ul className="repos repos--compact" aria-label={t(layer.title)}>
                {layer.repos
                  .map(([name, note]) => [repo(name), note])
                  .filter(([r]) => r)
                  .map(([r, note]) => (
                    <RepoItem key={r.fullName} repo={r} note={note} />
                  ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="all" kicker={localized('mb51413f8e9ce')} title={localized('m70e1cc1c5e4a')}>
        <RepoList items={all} label={localized('m3a77da2504fe')} fieldOptions={assocFields} showKinds={false} />
      </Section>
    </Layout>
  );
}
