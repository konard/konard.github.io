export default function ProblemSolving({ steps, notes = [] }) {
  return (
    <>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s.step} className="step">
            <span className="step__index mono">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.step}
                </a>
              </h3>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      {notes.length > 0 && (
        <dl className="ps-notes">
          {notes.map((note) => (
            <div key={note.title} className={note.links ? 'ps-note ps-note--wide' : 'ps-note'}>
              <dt>{note.title}</dt>
              <dd>
                <p>{note.text}</p>
                {note.links && (
                  <ul>
                    {note.links.map(([repo, text]) => (
                      <li key={repo}>
                        <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer">
                          {repo}
                        </a>
                        : {text}
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
