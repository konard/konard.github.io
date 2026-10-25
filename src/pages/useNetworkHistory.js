import { useEffect, useLayoutEffect, useState } from 'react';
import { replaceAddress } from '../history';

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
  // Bind before paint: a first touch must not fall between mounting the input
  // and installing passive effects (observable in mobile WebKit).
  useLayoutEffect(() => {
    const active = new Set();
    let control = null;
    const kind = (type) => (type.startsWith('pointer') ? 'pointer' : type.startsWith('touch') ? 'touch' : 'keyboard');
    const start = (event) => {
      if (continuous(event.target) && (event.type !== 'keydown' || SLIDER_KEYS.includes(event.key))) {
        control = event.target;
        active.add(kind(event.type));
        networkDebug('interaction started', { type: event.type, control: event.target.id });
        setInteracting(true);
      }
    };
    const end = (event) => {
      if (!active.size) return;
      if (event.type === 'blur') active.clear();
      else if (event.type === 'focusout') {
        if (event.target !== control) return;
        active.delete('keyboard');
        if (control.type === 'color') active.clear();
      } else {
        if (event.type === 'keyup' && !SLIDER_KEYS.includes(event.key)) return;
        if (event.type.startsWith('touch') && event.touches?.length) return;
        active.delete(kind(event.type));
      }
      networkDebug('interaction ended', { type: event.type, remaining: [...active] });
      setInteracting(active.size > 0);
    };
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
      const error = replaceAddress(`${window.location.pathname}${query}${window.location.hash}`);
      if (error) {
        networkDebug('address write failed', { name: error.name, message: error.message, failures });
        // A rate-limited or temporarily inactive document must never take down the editor.
        if (failures < 5) timer = setTimeout(write, 1000 * 2 ** failures++);
      } else networkDebug('address saved', query);
    };
    timer = setTimeout(write, 400);
    return () => clearTimeout(timer);
  }, [query, interacting]);
}
