// Fixed LCG seed, sampled without replacement within each link count.
export function randomNetworks() {
  let seed = 0x37c0de;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor((seed / 2 ** 32) * (n + 1));
  };
  const codes = [];
  for (const [n, count] of [
    [1, 4],
    [2, 4],
    [3, 6],
    [4, 6],
  ]) {
    const selected = new Set();
    for (let tries = 0; selected.size < count && tries < 1000; tries++) {
      selected.add(Array.from({ length: n * 2 }, () => next(n)).join(''));
    }
    if (selected.size !== count) throw new Error('Sampling budget exceeded');
    codes.push(...selected);
  }
  return codes;
}
