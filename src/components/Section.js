export default function Section({ id, kicker, title, children, className = '' }) {
  return (
    <section id={id} className={`section ${className}`} aria-labelledby={`${id}-title`}>
      <header className="section__header">
        {kicker && <span className="section__kicker">{kicker}</span>}
        <h2 id={`${id}-title`} className="section__title">{title}</h2>
      </header>
      {children}
    </section>
  );
}
