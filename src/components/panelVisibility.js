// Keep the number of live backdrop-filter surfaces proportional to the viewport,
// including when a gallery, feed or repository list grows by thousands of items.
export const PANEL_SELECTOR = '.symbols__grid > li, .repo, .post';
export function watchPanelVisibility(root) {
  if (!root || typeof IntersectionObserver === 'undefined') return () => {};
  const observed = new Set();
  const debug = () => {
    try {
      if (localStorage.getItem('ui.debug') === '1')
        console.debug('[ui.panels]', {
          total: observed.size,
          active: [...observed].filter((n) => n.dataset.inViewport === 'true').length,
        });
    } catch {
      /* storage may be disabled */
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) target.dataset.inViewport = 'true';
        else delete target.dataset.inViewport;
      });
      debug();
    },
    { rootMargin: '200px 0px' },
  );
  const add = (node) => {
    if (node.nodeType !== 1) return;
    const panels = [...node.querySelectorAll(PANEL_SELECTOR)];
    if (node.matches(PANEL_SELECTOR)) panels.unshift(node);
    for (const panel of panels)
      if (!observed.has(panel)) {
        observed.add(panel);
        observer.observe(panel);
      }
  };
  root.dataset.panelVisibility = 'on';
  add(root);
  const mutations = new MutationObserver((entries) => {
    for (const entry of entries) entry.addedNodes.forEach(add);
    for (const panel of observed)
      if (!root.contains(panel)) {
        observer.unobserve(panel);
        observed.delete(panel);
      }
  });
  mutations.observe(root, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    mutations.disconnect();
    delete root.dataset.panelVisibility;
    for (const panel of observed) delete panel.dataset.inViewport;
  };
}
