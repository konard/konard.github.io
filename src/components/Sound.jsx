import { useEffect, useRef } from 'react';
import { soundOptions } from '../sound/options';
import { useSettings } from '../settings/store';

const loadSound = () => import('../sound/interactions').then((module) => module.startSound);

let session = null;

/** Plays one sound now (the ▶ buttons of the settings page); nothing when sound is off. */
export const previewSound = (id) => session?.preview(id) ?? false;

/**
 * The sounds of the interface (issue #15). Their code is loaded only when
 * sound is switched on. Issue #39 enables it by default; browser audio starts
 * only after an interaction. Switching it on plays `intro`; off stops it.
 */
export default function Sound({ load = loadSound }) {
  const settings = useSettings();
  const on = settings['sound.on'];
  const latest = useRef(settings);
  const wasOn = useRef(on);

  useEffect(() => {
    latest.current = settings;
    session?.update(soundOptions(settings));
  }, [settings]);

  useEffect(() => {
    if (!on) {
      wasOn.current = false;
      return undefined;
    }
    let gone = false;
    let own = null;
    const switchedOn = !wasOn.current;
    wasOn.current = true;
    load()
      .then((start) => {
        if (gone) return;
        own = start(soundOptions(latest.current));
        session = own;
        if (switchedOn) own.play('intro');
      })
      .catch((error) => {
        // Navigation may abort an optional module fetch (notably in WebKit).
        // A failed audio download must never become an uncaught page error.
        if (!gone) console.warn('Interface sound is unavailable.', error);
      });
    return () => {
      gone = true;
      own?.stop();
      if (session === own) session = null;
    };
  }, [on, load]);

  return null;
}
