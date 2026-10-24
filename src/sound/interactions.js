// Which interaction of the page plays which sound (issue #15). One set of
// listeners on the document covers every page: pointing at and pressing links
// and buttons, switches, choices and sliders, moving over charts, opening and
// closing <details>, typing, and the cues components send with `cue()` from
// ./options.js (messages, opening panels).
import { createPlayer } from './engine';
import { CUE } from './options';

const INTERACTIVE = 'a[href], button, summary, select, input, textarea, label, [role="tab"], [role="radio"]';
const TEXT =
  'textarea, input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="url"]';

/** The interaction of a click on `element`, or null when the click is not on a control. */
export function clickEvent(element) {
  const control = element?.closest?.('a[href], button, summary, [role="tab"], [role="radio"], input');
  if (!control || control.disabled) return null;
  const own = control.closest('[data-sound]')?.dataset.sound;
  if (own) return own; // a control that names its sound: data-sound="open"
  if (control.matches('summary')) return null; // the toggle event of <details> sounds it
  if (control.matches('input')) {
    return control.type === 'checkbox' ? 'toggle' : control.type === 'radio' ? 'select' : null;
  }
  if (control.matches('[role="tab"], [role="radio"]')) return 'select';
  if (control.hasAttribute('aria-pressed')) return 'toggle';
  return 'activate';
}

/**
 * Starts the sounds with `options` (soundOptions in ./options.js); returns
 * `update(options)` and `stop()`. `player` is replaceable in tests.
 */
export function startSound(options, { player = createPlayer(options), now = () => performance.now() } = {}) {
  let current = options;
  let hovered = null;
  const last = {};
  const play = (event, gap = 0) => {
    const time = now();
    if (gap && time - (last[event] ?? -Infinity) < gap) return;
    last[event] = time;
    player.trigger(event);
  };

  const listeners = [
    [
      'pointermove',
      (event) => {
        player.setPan((event.clientX / Math.max(1, window.innerWidth)) * 2 - 1);
        if (event.target?.closest?.('[data-tooltip-root]')) play('scan', 90);
      },
    ],
    [
      'pointerover',
      (event) => {
        // A touch has no hover; its click sounds instead.
        if (event.pointerType === 'touch' || event.pointerType === 'pen') return;
        const element = event.target?.closest?.(INTERACTIVE) ?? null;
        if (element === hovered) return;
        hovered = element;
        if (element && !element.disabled) play('hover', current.gap);
      },
    ],
    [
      'click',
      (event) => {
        player.setPan((event.clientX / Math.max(1, window.innerWidth)) * 2 - 1 || 0);
        const kind = clickEvent(event.target);
        if (kind) play(kind);
      },
    ],
    [
      'input',
      (event) => {
        const target = event.target;
        if (target?.matches?.('input[type="range"]')) play('select', 70);
        else if (target?.matches?.(TEXT)) play('type', 30);
      },
    ],
    [
      'change',
      (event) => {
        if (event.target?.matches?.('select, input[type="color"]')) play('select');
      },
    ],
    [
      'toggle',
      (event) => {
        if (event.target?.matches?.('details')) play(event.target.open ? 'open' : 'close');
      },
    ],
  ];
  listeners.forEach(([type, listener]) => document.addEventListener(type, listener, { capture: true, passive: true }));
  const onCue = (event) => play(event.detail);
  const onHidden = () => document.hidden && player.suspend();
  window.addEventListener(CUE, onCue);
  document.addEventListener('visibilitychange', onHidden);

  return {
    update(next) {
      current = next;
      player.configure(next);
    },
    /** Plays one sound (the ▶ buttons of the settings). */
    preview: (id) => player.play(id),
    play,
    stop() {
      listeners.forEach(([type, listener]) => document.removeEventListener(type, listener, { capture: true }));
      window.removeEventListener(CUE, onCue);
      document.removeEventListener('visibilitychange', onHidden);
      player.close();
    },
  };
}
