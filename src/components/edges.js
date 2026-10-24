// A list that scrolls sideways (the pages and the sections in the top bar) fades
// out at an edge only while there is more of it behind that edge (issue #15).

/** Sets `data-more` of a scrolling list to "left", "right", both or nothing. */
export function markEdges(list) {
  const more = [];
  if (list.scrollLeft > 1) more.push('left');
  if (list.scrollLeft + list.clientWidth < list.scrollWidth - 1) more.push('right');
  if (more.length) list.dataset.more = more.join(' ');
  else delete list.dataset.more;
}

/** Scrolls a list sideways so that its current link is in the middle. */
export function centreCurrent(list) {
  const current = list.querySelector('[aria-current="page"]');
  if (!current || list.scrollWidth <= list.clientWidth) return;
  const [box, link] = [list.getBoundingClientRect(), current.getBoundingClientRect()];
  list.scrollLeft += link.left - box.left - (box.width - link.width) / 2;
}

/** Keeps the edges of the lists marked while they scroll and the window resizes; returns the cleanup. */
export function watchEdges(lists) {
  const update = () => lists.forEach(markEdges);
  update();
  lists.forEach((list) => list.addEventListener('scroll', update, { passive: true }));
  window.addEventListener('resize', update);
  return () => {
    lists.forEach((list) => list.removeEventListener('scroll', update));
    window.removeEventListener('resize', update);
  };
}
