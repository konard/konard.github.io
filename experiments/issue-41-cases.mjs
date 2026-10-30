export const reported = [
  { code: '0222', turns: '0 -30' },
  { code: '0112', turns: '0 0,-30 0' },
  { code: '0001', turns: '0 0,0 -30' },
  { code: '2002', turns: '-30 0' },
];

// Twenty distinct cases: all four one-link networks, eight each for 2/3 links.
// A fixed seed and finite sampling budget keep the original sample reproducible.
export function randomNetworks() {
  let seed = 0x41c0de;
  const codes = [];
  for (const [n, count] of [
    [1, 4],
    [2, 8],
    [3, 8],
  ]) {
    const selected = new Set();
    for (let attempt = 0; selected.size < count && attempt < 1000; attempt++) {
      const code = Array.from({ length: n * 2 }, () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return Math.floor((seed / 2 ** 32) * (n + 1));
      }).join('');
      selected.add(code);
    }
    if (selected.size !== count) throw new Error('Sampling budget exceeded');
    codes.push(...selected);
  }
  return codes;
}
