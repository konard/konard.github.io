import { tr, useLang } from '../i18n/prefs';

/** The steps of the universal problem solving algorithm and the notes about it (`{ en, ru }` texts). */
export default function ProblemSolving({ steps, notes = [] }) {
  const { t } = useLang();
  return (
    <>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s.url} className="step">
            <span className="step__index mono">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {t(s.step)}
                </a>
              </h3>
              <p>{t(s.text)}</p>
            </div>
          </li>
        ))}
      </ol>
      {notes.length > 0 && (
        <dl className="ps-notes">
          {notes.map((note) => (
            <div key={tr(note.title, 'en')} className={note.links ? 'ps-note ps-note--wide' : 'ps-note'}>
              <dt>{t(note.title)}</dt>
              <dd>
                <p>{t(note.text)}</p>
                {note.links && (
                  <ul>
                    {note.links.map(([repo, text]) => (
                      <li key={repo}>
                        <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer">
                          {repo}
                        </a>
                        : {t(text)}
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}
