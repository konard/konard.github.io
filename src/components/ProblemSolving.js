export default function ProblemSolving({ steps }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li key={s.step} className="step">
          <span className="step__index mono">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <h3><a href={s.url} target="_blank" rel="noopener noreferrer">{s.step}</a></h3>
            <p>{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
