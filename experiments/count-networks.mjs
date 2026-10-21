// Counts networks of 1–4 real links with the zero link: all labelled codes
// and renaming classes (Burnside vs brute force).
import {
  classCount,
  networkCount,
  representatives,
  mathNotation,
  linksNotation,
  codeAt,
} from '../src/links/configurations.js';
for (let n = 1; n <= 4; n++) {
  const t = Date.now();
  const reps = representatives(n);
  console.log(
    n,
    networkCount(n),
    classCount(n),
    reps.length,
    `${Date.now() - t}ms`,
    mathNotation(codeAt(n, 5)),
    linksNotation(codeAt(n, 5)).join(' '),
  );
}
