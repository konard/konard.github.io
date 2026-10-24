import { describe, expect, it } from 'vitest';
import { centreCurrent, markEdges, watchEdges } from './edges';

// jsdom does no layout: give a list the sizes of a real one.
function list({ scroll = 0, client = 300, width = 900 } = {}) {
  const ul = document.createElement('ul');
  ul.innerHTML = '<li><a href="/">A</a></li><li><a href="/b/" aria-current="page">B</a></li>';
  Object.defineProperty(ul, 'clientWidth', { value: client });
  Object.defineProperty(ul, 'scrollWidth', { value: width });
  ul.scrollLeft = scroll;
  return ul;
}

describe('edges of a list that scrolls sideways', () => {
  it('marks only the edges with more of the list behind them', () => {
    const cases = [
      [{ scroll: 0 }, 'right'],
      [{ scroll: 300 }, 'left right'],
      [{ scroll: 600 }, 'left'],
      [{ width: 300 }, undefined],
    ];
    for (const [sizes, more] of cases) {
      const ul = list(sizes);
      markEdges(ul);
      expect(ul.dataset.more, JSON.stringify(sizes)).toBe(more);
    }
  });

  it('updates the mark when the list scrolls and stops after the cleanup', () => {
    const ul = list();
    const stop = watchEdges([ul]);
    expect(ul.dataset.more).toBe('right');
    ul.scrollLeft = 600;
    ul.dispatchEvent(new Event('scroll'));
    expect(ul.dataset.more).toBe('left');
    stop();
    ul.scrollLeft = 0;
    ul.dispatchEvent(new Event('scroll'));
    expect(ul.dataset.more).toBe('left');
  });

  it('centres the current link of a list that scrolls', () => {
    const ul = list();
    ul.getBoundingClientRect = () => ({ left: 0, width: 300 });
    ul.querySelector('[aria-current]').getBoundingClientRect = () => ({ left: 500, width: 100 });
    centreCurrent(ul);
    expect(ul.scrollLeft).toBe(400);
    const fits = list({ width: 300 });
    centreCurrent(fits);
    expect(fits.scrollLeft).toBe(0);
  });
});
