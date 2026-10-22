// A CV built by buildCv, as one column of plain HTML: headings, paragraphs and
// lists in reading order, so the printed PDF is readable by ATS parsers.
const bare = (url) => url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');

function Link({ url, children }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children || bare(url)}
    </a>
  );
}

function CvSection({ id, title, children }) {
  return (
    <section className={`cv__section cv__section--${id}`} aria-labelledby={`cv-${id}`}>
      <h2 id={`cv-${id}`} className="cv__heading">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Header({ cv }) {
  const caps = cv.style === 'classic' || cv.style === 'compact';
  return (
    <header className="cv__header">
      <h1 className="cv__name">{caps ? cv.name.toUpperCase() : cv.name}</h1>
      <p className="cv__title">{cv.title}</p>
      <p className="cv__contacts">
        <span>{cv.location}</span>
        {cv.contacts.map((c) => (
          <span key={c.id}>
            {' · '}
            {c.label}: <Link url={c.url}>{c.text}</Link>
          </span>
        ))}
      </p>
    </header>
  );
}

function Strengths({ cv }) {
  return (
    <ul className="cv__strengths">
      {cv.strengths.map((s) => (
        <li key={s.label}>
          <strong>{s.label}:</strong> {s.items.join(', ')}
        </li>
      ))}
    </ul>
  );
}

function Job({ job, cv }) {
  const caps = cv.style === 'classic' || cv.style === 'compact';
  const where = [job.period, job.location].filter(Boolean).join(' | ');
  return (
    <article className="cv__job">
      <div className="cv__job-head">
        <h3 className="cv__company">
          {caps ? job.company.toUpperCase() : job.company}
          {cv.style !== 'classic' && <span className="cv__role-inline"> — {job.role}</span>}
        </h3>
        <span className="cv__where">{where}</span>
      </div>
      {cv.style === 'classic' && <p className="cv__role">{job.role}</p>}
      {job.bullets.length > 0 ? (
        <ul className="cv__bullets">
          {job.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : (
        cv.style !== 'compact' && <p className="cv__summary">{job.summary}</p>
      )}
      {cv.style === 'technical' && (
        <p className="cv__stack">
          <strong>{cv.labels.stackLine}:</strong> {job.tags.join(', ')}
        </p>
      )}
    </article>
  );
}

function Experience({ cv }) {
  return (
    <CvSection id="experience" title={cv.labels.experience}>
      {cv.jobs.map((job) => (
        <Job key={job.id} job={job} cv={cv} />
      ))}
      {cv.earlier && (
        <p className="cv__earlier">
          <strong>{cv.labels.earlier}:</strong> {cv.earlier}
        </p>
      )}
    </CvSection>
  );
}

function Products({ cv, title }) {
  const technical = cv.style === 'technical';
  return (
    <CvSection id="products" title={title}>
      <ul className="cv__list">
        {cv.products.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong>
            {cv.style !== 'compact' && <> — {p.summary}</>} <Link url={p.url} />
            {technical && p.packages.length > 0 && (
              <>
                {' · '}
                {cv.labels.packages}:{' '}
                {p.packages.map((pkg, i) => (
                  <span key={pkg.url}>
                    {i > 0 && ', '}
                    <Link url={pkg.url}>{pkg.registry}</Link>
                  </span>
                ))}
              </>
            )}
          </li>
        ))}
        {cv.registries.map((r) => (
          <li key={r.name}>
            <strong>{r.name}</strong>: {r.text} <Link url={r.url} />
          </li>
        ))}
      </ul>
    </CvSection>
  );
}

function Education({ cv }) {
  return (
    <CvSection id="education" title={cv.labels.education}>
      <ul className="cv__list">
        {cv.education.map((e) => (
          <li key={e.title}>
            <strong>{e.title}</strong> — {e.detail}, {e.period}
          </li>
        ))}
      </ul>
      <p className="cv__languages">
        <strong>{cv.labels.languages}:</strong> {cv.languages.join('; ')}
      </p>
    </CvSection>
  );
}

/** The CV document; `cv` comes from buildCv. */
export default function CvDocument({ cv }) {
  const { style } = cv;
  return (
    <article className={`cv cv--${style}`} lang={cv.lang} data-cv-style={style} data-cv-role={cv.role}>
      <Header cv={cv} />
      <CvSection id="profile" title={cv.labels.profile}>
        <p>{cv.profile}</p>
      </CvSection>
      <CvSection id="strengths" title={style === 'technical' ? cv.labels.stack : cv.labels.strengths}>
        <Strengths cv={cv} />
      </CvSection>
      {style === 'academic' && (
        <CvSection id="research" title={cv.labels.research}>
          <ul className="cv__list">
            {cv.publications.map((p) => (
              <li key={p.url}>
                {p.date.slice(0, 4)} — {p.title} ({p.venue}) <Link url={p.url} />
              </li>
            ))}
            {cv.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </CvSection>
      )}
      <Experience cv={cv} />
      <Products cv={cv} title={style === 'technical' ? cv.labels.projects : cv.labels.products} />
      {cv.practices.length > 0 && (
        <CvSection id="practices" title={cv.labels.practices}>
          <ul className="cv__list">
            {cv.practices.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </CvSection>
      )}
      <Education cv={cv} />
    </article>
  );
}
