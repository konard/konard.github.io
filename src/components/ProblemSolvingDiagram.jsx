// SVG version of the hand-drawn "Universal Problem Solving Algorithm" by
// konard: a problem is decomposed into tasks, every task gets a test, every
// test gets several drafts, the drafts that pass are selected and composed
// back into the solution.
export const ORIGINAL_IMAGE = 'https://github.com/user-attachments/assets/1d91e911-9ba4-456e-a00a-14cdd60d9a0a';

const COLORS = { task: '#ef4444', test: '#eab308', draft: '#f8fafc', solution: '#22c55e', flow: '#3b82f6' };
const R = 11;

const PROBLEM = { x: 190, y: 330 };
const TASKS = [210, 450].map((y) => ({ x: 290, y }));
const SUBTASKS = [150, 270, 390, 510].map((y) => ({ x: 390, y }));
const TESTS = SUBTASKS.map(({ y }) => ({ x: 500, y }));
const DRAFTS = TESTS.flatMap(({ y }) => [y - 30, y + 30]).map((y) => ({ x: 610, y }));
const SELECTED = [
  { x: 730, y: 230, from: [0, 3] },
  { x: 730, y: 440, from: [5, 6] },
];
const SOLUTION = { x: 830, y: 335 };

/** Every arrow of the diagram as [from, to, kind]. */
export function edges() {
  const list = [];
  TASKS.forEach((t) => list.push([PROBLEM, t, 'task']));
  SUBTASKS.forEach((s, i) => list.push([TASKS[Math.floor(i / 2)], s, 'task']));
  TESTS.forEach((t, i) => list.push([SUBTASKS[i], t, 'test']));
  DRAFTS.forEach((d, i) => list.push([TESTS[Math.floor(i / 2)], d, 'draft']));
  SELECTED.forEach((s) => s.from.forEach((i) => list.push([DRAFTS[i], s, 'solution'])));
  SELECTED.forEach((s) => list.push([s, SOLUTION, 'solution']));
  return list;
}

const trim = (a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const k = (R + 4) / len;
  return [a.x + dx * k, a.y + dy * k, b.x - dx * k * 1.25, b.y - dy * k * 1.25];
};

const selectedDrafts = new Set(SELECTED.flatMap((s) => s.from));

function Row({ y, words }) {
  const kinds = ['task', 'test', 'draft', 'solution'];
  return (
    <g className="psd__row">
      {words.map((w, i) => {
        const x = 200 + i * 200;
        return (
          <g key={w}>
            <text x={x} y={y} fill={COLORS[kinds[i]]} textAnchor="middle">
              {w}
            </text>
            {i < words.length - 1 && (
              <line
                x1={x + 80}
                y1={y - 6}
                x2={x + 118}
                y2={y - 6}
                stroke={COLORS.flow}
                markerEnd="url(#psd-flow)"
                strokeWidth="2.5"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

export default function ProblemSolvingDiagram() {
  const nodes = [
    [PROBLEM, 'task'],
    ...TASKS.map((n) => [n, 'task']),
    ...SUBTASKS.map((n) => [n, 'task']),
    ...TESTS.map((n) => [n, 'test']),
    ...DRAFTS.map((n, i) => [n, selectedDrafts.has(i) ? 'draft' : 'draft-rejected']),
    ...SELECTED.map((n) => [n, 'solution']),
    [SOLUTION, 'solution'],
  ];
  return (
    <figure className="psd">
      <svg viewBox="0 0 1000 640" role="img" aria-labelledby="psd-title" aria-describedby="psd-desc">
        <title id="psd-title">Universal Problem Solving Algorithm</title>
        <desc id="psd-desc">
          Problem is decomposed into tasks, tasks get tests, tests get drafts, passing drafts are selected and composed
          into the solution: decomposition, experiment, selection, composition.
        </desc>
        <defs>
          {Object.entries(COLORS).map(([kind, color]) => (
            <marker
              key={kind}
              id={`psd-${kind}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M1 1 L9 5 L1 9" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
            </marker>
          ))}
        </defs>
        <Row y={58} words={['tasks', 'tests', 'drafts', 'solutions']} />
        <text x={40} y={340} className="psd__end" fill={COLORS.task}>
          Problem
        </text>
        <text x={960} y={345} className="psd__end" fill={COLORS.solution} textAnchor="end">
          Solution
        </text>
        <g className="psd__edges">
          {edges().map(([a, b, kind], i) => {
            const [x1, y1, x2, y2] = trim(a, b);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={COLORS[kind]}
                markerEnd={`url(#psd-${kind})`}
                style={{ animationDelay: `${(a.x - PROBLEM.x) / 220}s` }}
              />
            );
          })}
        </g>
        <g className="psd__nodes">
          {nodes.map(([n, kind], i) => (
            <circle
              key={i}
              cx={n.x}
              cy={n.y}
              r={R}
              stroke={COLORS[kind] || COLORS.draft}
              className={kind === 'draft-rejected' ? 'is-rejected' : undefined}
            />
          ))}
        </g>
        <Row y={612} words={['decomposition', 'experiment', 'selection', 'composition']} />
      </svg>
      <figcaption>
        After the{' '}
        <a href={ORIGINAL_IMAGE} target="_blank" rel="noopener noreferrer">
          original drawing
        </a>{' '}
        by konard. Dimmed drafts are the experiments that did not pass their tests.
      </figcaption>
    </figure>
  );
}
