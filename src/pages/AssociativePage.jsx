import Glyph from '../components/Glyph';
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
  ['stack', { en: 'Stack', ru: 'Стек' }],
  ['all', { en: 'All associative repositories', ru: 'Все ассоциативные репозитории' }],
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
        <p className="section__kicker">{t({ en: 'Associative technologies', ru: 'Ассоциативные технологии' })}</p>
        <h1 className="page-hero__title">{t({ en: 'The associative stack', ru: 'Ассоциативный стек' })}</h1>
        <p className="page-hero__lead">
          {t({
            en: `Since 2010: ${all.length} repositories that store, query and reason about data as links (${n(metaTheory.tldr)}). The stack below starts from the links meta-theory and goes up through notation, storage, tools and the Deep platform to the AI and applications: every project of linksplatform, link-foundation and link-assistant in one of its layers.`,
            ru: `С 2010 года: ${all.length} ${plural(all.length, lang, REPOSITORIES)}, которые хранят данные как связи, выполняют по ним запросы и рассуждают о них (${n(metaTheory.tldr)}). Стек ниже начинается с метатеории связей и поднимается через нотацию, хранилища, инструменты и платформу Deep к ИИ и приложениям: каждый проект linksplatform, link-foundation и link-assistant находится в одном из его слоёв.`,
          })}
        </p>
      </header>

      <Section
        id="stack"
        kicker={{ en: 'Layers', ru: 'Слои' }}
        title={{ en: 'From the theory to applications', ru: 'От теории до приложений' }}
      >
        <nav className="chips stack__index" aria-label={t({ en: 'Layers of the stack', ru: 'Слои стека' })}>
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

      <Section
        id="all"
        kicker={{ en: 'Catalog', ru: 'Каталог' }}
        title={{ en: 'All associative repositories', ru: 'Все ассоциативные репозитории' }}
      >
        <RepoList
          items={all}
          label={{ en: 'Associative repositories', ru: 'Ассоциативные репозитории' }}
          fieldOptions={assocFields}
          showKinds={false}
        />
      </Section>
    </Layout>
  );
}
