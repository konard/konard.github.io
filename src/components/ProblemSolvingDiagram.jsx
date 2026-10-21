// SVG version of the hand-drawn "Universal Problem Solving Algorithm" by
// konard: a problem is decomposed into tasks, every task gets a test, every
// test gets several drafts, the drafts that pass are selected and composed
// back into the solution.
//
// Every text has a fixed width (`textLength`, monospace advance 0.6 em), so
// the layout below is exact in every browser and font: labels and arrows are
// placed from the measured widths and never overlap each other or the nodes.
export const ORIGINAL_IMAGE = 'https://github.com/user-attachments/assets/1d91e911-9ba4-456e-a00a-14cdd60d9a0a';
export const ORIGINAL_REPOSITORY = 'https://github.com/konard/problem-solving';

const COLORS = { task: '#ef4444', test: '#eab308', draft: '#f8fafc', solution: '#22c55e', flow: '#3b82f6' };
export const WIDTH = 1000;
export const HEIGHT = 640;
export const R = 11;
const ROW_FONT = 21;
const END_FONT = 28;
const GAP = 16; // free space between a word and an arrow or a node
const FLOW = 40; // length of a blue arrow between two words

/** Width of `text` in a monospace font of `size` px (every glyph advances 0.6 em). */
export const textWidth = (text, size) => text.length * size * 0.6;

const LEFT = 172; // the Problem node; every other column is placed relative to it
const PROBLEM = { x: LEFT, y: 330 };
const TASKS = [210, 450].map((y) => ({ x: LEFT + 100, y }));
const SUBTASKS = [150, 270, 390, 510].map((y) => ({ x: LEFT + 200, y }));
const TESTS = SUBTASKS.map(({ y }) => ({ x: LEFT + 310, y }));
const DRAFTS = TESTS.flatMap(({ y }) => [y - 30, y + 30]).map((y) => ({ x: LEFT + 420, y }));
const SELECTED = [
  { x: LEFT + 540, y: 230, from: [0, 3] },
  { x: LEFT + 540, y: 440, from: [5, 6] },
];
const SOLUTION = { x: LEFT + 640, y: 330 };

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

const selectedDrafts = new Set(SELECTED.flatMap((s) => s.from));

/** Every node as [point, kind]. */
export const nodes = () => [
  [PROBLEM, 'task'],
  ...TASKS.map((n) => [n, 'task']),
  ...SUBTASKS.map((n) => [n, 'task']),
  ...TESTS.map((n) => [n, 'test']),
  ...DRAFTS.map((n, i) => [n, selectedDrafts.has(i) ? 'draft' : 'draft-rejected']),
  ...SELECTED.map((n) => [n, 'solution']),
  [SOLUTION, 'solution'],
];

/** An arrow from the edge of node `a` to the edge of node `b` (the head needs a little more room). */
export const trim = (a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const k = (R + 4) / len;
  return [a.x + dx * k, a.y + dy * k, b.x - dx * k * 1.25, b.y - dy * k * 1.25];
};

const KINDS = ['task', 'test', 'draft', 'solution'];

/**
 * A row of four words joined by arrows, centred in the drawing: every arrow
 * starts GAP after a word and ends GAP before the next one.
 */
export function rowLayout(words, y) {
  const widths = words.map((w) => textWidth(w, ROW_FONT));
  const total = widths.reduce((a, b) => a + b, 0) + (words.length - 1) * (FLOW + 2 * GAP);
  let x = (WIDTH - total) / 2;
  const items = [];
  words.forEach((word, i) => {
    const item = { word, kind: KINDS[i], x, y, width: widths[i] };
    x += widths[i];
    if (i < words.length - 1) {
      item.arrow = [x + GAP, x + GAP + FLOW];
      x += FLOW + 2 * GAP;
    }
    items.push(item);
  });
  return items;
}

/** The Problem and Solution labels, vertically centred on their nodes. */
export const ends = () => [
  {
    word: 'Problem',
    kind: 'task',
    x: PROBLEM.x - R - GAP - textWidth('Problem', END_FONT),
    y: PROBLEM.y,
    width: textWidth('Problem', END_FONT),
  },
  {
    word: 'Solution',
    kind: 'solution',
    x: SOLUTION.x + R + GAP,
    y: SOLUTION.y,
    width: textWidth('Solution', END_FONT),
  },
];

export const TOP = rowLayout(['tasks', 'tests', 'drafts', 'solutions'], 58);
export const BOTTOM = rowLayout(['decomposition', 'experiment', 'selection', 'composition'], 612);

function Label({ word, kind, x, y, width, size, className }) {
  return (
    <text
      x={x}
      y={y}
      fill={COLORS[kind]}
      fontSize={size}
      textLength={width}
      lengthAdjust="spacingAndGlyphs"
      dominantBaseline="central"
      className={className}
    >
      {word}
    </text>
  );
}

function Row({ items }) {
  return (
    <g className="psd__row">
      {items.map((item) => (
        <g key={item.word}>
          <Label {...item} size={ROW_FONT} />
          {item.arrow && (
            <line
              x1={item.arrow[0]}
              y1={item.y}
              x2={item.arrow[1]}
              y2={item.y}
              stroke={COLORS.flow}
              markerEnd="url(#psd-flow)"
              strokeWidth="2.5"
            />
          )}
        </g>
      ))}
    </g>
  );
}

export default function ProblemSolvingDiagram() {
  return (
    <figure className="psd">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="psd-title" aria-describedby="psd-desc">
        <title id="psd-title">Universal Problem Solving Algorithm</title>
        <desc id="psd-desc">
          A problem is decomposed into tasks, every task gets a test, every test gets several drafts, the drafts that
          pass are selected and composed into the solution: decomposition, experiment, selection, composition. Dimmed
          drafts did not pass their tests.
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
        <Row items={TOP} />
        {ends().map((item) => (
          <Label key={item.word} {...item} size={END_FONT} className="psd__end" />
        ))}
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
          {nodes().map(([n, kind], i) => (
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
        <Row items={BOTTOM} />
      </svg>
      <figcaption>
        <a href={ORIGINAL_IMAGE} target="_blank" rel="noopener noreferrer">
          Original drawing
        </a>{' '}
        ·{' '}
        <a href={ORIGINAL_REPOSITORY} target="_blank" rel="noopener noreferrer">
          konard/problem-solving
        </a>
      </figcaption>
    </figure>
  );
}
