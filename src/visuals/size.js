// Background canvases take their size from CSS (issue #13). Safari may run
// `<script type="module">` before the stylesheet is applied (WebKit bug 261655,
// https://bugs.webkit.org/show_bug.cgi?id=261655), so the first measurement can
// be the default canvas size of 300×150; when the stylesheet arrives the canvas
// grows without a window resize event, and its small bitmap would be stretched
// over the whole screen. A ResizeObserver on the canvas itself catches that;
// the window resize event is still needed for changes of devicePixelRatio
// (browser zoom, moving the window to another screen).

/** Device pixels per CSS pixel, at most 2: sharper is not visible on a background. */
export const pixelRatio = () => Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);

/** Calls `onResize()` whenever `element` or the window changes size; returns a function that stops watching. */
export function watchSize(element, onResize) {
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => onResize()) : null;
  observer?.observe(element);
  window.addEventListener('resize', onResize);
  return () => {
    observer?.disconnect();
    window.removeEventListener('resize', onResize);
  };
}
