import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { formatNumber } from './format';
import { DataMark } from './DataSources';

const REPOSITORIES = { en: ['repository', 'repositories'], ru: ['репозиторий', 'репозитория', 'репозиториев'] };
// «в N репозиториях»: the prepositional case after «в».
const IN_REPOSITORIES = { en: ['repository', 'repositories'], ru: ['репозитории', 'репозиториях', 'репозиториях'] };

// Skills-list names of languages GitHub detects under its linguist names
// (issue #47): without them a language is counted and drawn twice.
export const LINGUIST_NAMES = {
  'Shell / Bash': ['Shell'],
  'Coq / Rocq': ['Coq', 'Rocq Prover'],
  Batch: ['Batchfile'],
  CUDA: ['Cuda'],
  'PL/pgSQL': ['PLpgSQL'],
};

/** Languages of the skills list that GitHub did not detect under any of their names. */
export function undetectedLanguages(languages, extra) {
  const detected = new Set(languages.map((l) => l.name));
  return extra.filter((name) => ![name, ...(LINGUIST_NAMES[name] || [])].some((n) => detected.has(n)));
}

/**
 * Every language GitHub detected in original repositories, sized by the
 * number of repositories using it, plus languages known from other sources
 * (CodersRank, Habr Career, gists) that GitHub does not detect.
 */
export default function LanguageCloud({ languages, extra = [], favorites = [] }) {
  const max = Math.log(Math.max(...languages.map((l) => l.count)) + 1);
  const sorted = [...languages].sort((a, b) => a.name.localeCompare(b.name));
  const others = undetectedLanguages(languages, extra);
  const { lang, t } = useLang();
  const number = (v) => formatNumber(v, lang);
  const total = number(languages.length);
  return (
    <div className="cloud">
      <p className="chart__caption">
        {t({
          en: `All ${total} languages detected by GitHub${others.length > 0 ? ` and ${others.length} more from the skills list` : ''}. Size shows how many repositories use the language.`,
          ru: `Языки, найденные GitHub, — всего ${total}${others.length > 0 ? `, и ещё ${others.length} из списка навыков` : ''}. Размер показывает, в скольких репозиториях используется язык.`,
        })}
        <DataMark />
      </p>
      <ul className="cloud__list" aria-label={t({ en: 'All languages', ru: 'Все языки' })}>
        {sorted.map((l) => (
          <li
            key={l.name}
            className={favorites.includes(l.name) ? 'is-favorite' : undefined}
            style={{ '--weight': (Math.log(l.count + 1) / max).toFixed(3), '--color': l.color || 'var(--text-2)' }}
            title={`${l.name}: ${number(l.count)} ${plural(l.count, lang, REPOSITORIES)}, ${t({
              en: `primary in ${number(l.primary)}`,
              ru: `основной в ${number(l.primary)} ${plural(l.primary, 'ru', IN_REPOSITORIES)}`,
            })}`}
          >
            {l.name}
            <span className="cloud__count">{number(l.count)}</span>
          </li>
        ))}
        {others.map((name) => (
          <li
            key={name}
            className="is-extra"
            title={`${name}: ${t({ en: 'known from the skills list', ru: 'из списка навыков' })}`}
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
