// Reproduces the issue-9 overlaps of the old ProblemSolvingDiagram (commit
// before the fix): fixed 200px word spacing and a right-aligned "Solution".
// JetBrains Mono advances 0.6 em per glyph.
const w = (text, size) => text.length * size * 0.6;
const R = 11;
const report = [];
// Old "Solution": x = 960, text-anchor end, 28px bold; final node at x = 830.
const solution = { x1: 960 - w('Solution', 28), x2: 960 };
report.push(
  `Solution spans ${solution.x1.toFixed(1)}–${solution.x2}, final node spans ${830 - R}–${830 + R}:` +
    ` ${solution.x1 < 830 + R ? 'OVERLAP (the S is behind the node)' : 'ok'}`,
);
// Old bottom row: centres at 200 + i*200, arrows from centre + 80 to centre + 118, 21px.
['decomposition', 'experiment', 'selection', 'composition'].forEach((word, i) => {
  const c = 200 + i * 200;
  const right = c + w(word, 21) / 2;
  const left = c - w(word, 21) / 2;
  const arrowIn = i ? c - 200 + 118 : -Infinity;
  if (i < 3)
    report.push(
      `${word} ends at ${right.toFixed(1)}, its arrow starts at ${c + 80}: ${right > c + 80 ? 'OVERLAP' : 'ok'}`,
    );
  if (i)
    report.push(
      `${word} starts at ${left.toFixed(1)}, previous arrow head at ${arrowIn}: ${left < arrowIn ? 'OVERLAP' : 'ok'}`,
    );
});
console.log(report.join('\n'));
