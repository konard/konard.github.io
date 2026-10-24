import { useEffect, useState } from 'react';

/** Opt-in tracing: localStorage.setItem('network.debug', 'true'). */
export function networkDebug(event, detail) {
  try {
    if (localStorage.getItem('network.debug') === 'true') console.debug(`[network] ${event}`, detail);
  } catch {
    // Storage can be unavailable in a private browser.
  }
}

const SLIDER_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
const continuous = (target) => target?.matches?.('input[type="range"], input[type="color"]');

/** Live state stays in React; history is a debounced, best-effort persistence layer. */
export function useNetworkHistory(query) {
  const [interacting, setInteracting] = useState(false);
  useEffect(() => {
    const start = (event) => {
      if (continuous(event.target) && (event.type !== 'keydown' || SLIDER_KEYS.includes(event.key)))
        setInteracting(true);
    };
    const end = () => setInteracting(false);
    const starts = ['pointerdown', 'touchstart', 'keydown'];
    const ends = ['pointerup', 'pointercancel', 'touchend', 'touchcancel', 'keyup', 'focusout'];
    starts.forEach((name) => document.addEventListener(name, start));
    ends.forEach((name) => document.addEventListener(name, end));
    window.addEventListener('blur', end);
    return () => {
      starts.forEach((name) => document.removeEventListener(name, start));
      ends.forEach((name) => document.removeEventListener(name, end));
      window.removeEventListener('blur', end);
    };
  }, []);

  useEffect(() => {
    if (interacting) return;
    let timer;
    let failures = 0;
    const write = () => {
      if (window.location.search === query) return;
      try {
        window.history.replaceState(
          window.history.state,
          '',
          `${window.location.pathname}${query}${window.location.hash}`,
        );
        networkDebug('address saved', query);
      } catch (error) {
        networkDebug('address write failed', { name: error.name, message: error.message, failures });
        // A rate-limited or temporarily inactive document must never take down the editor.
        if (failures < 5) timer = setTimeout(write, 1000 * 2 ** failures++);
      }
    };
    timer = setTimeout(write, 400);
    return () => clearTimeout(timer);
  }, [query, interacting]);
}
