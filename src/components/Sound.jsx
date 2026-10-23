import { useEffect, useRef } from 'react';
import { soundOptions } from '../sound/options';
import { useSettings } from '../settings/store';

const loadSound = () => import('../sound/interactions').then((module) => module.startSound);

let session = null;

/** Plays one sound now (the ▶ buttons of the settings page); nothing when sound is off. */
export const previewSound = (id) => session?.preview(id) ?? false;

/**
 * The sounds of the interface (issue #15). Their code is loaded only when
 * sound is switched on, so the default page does not download it; switching
 * it on plays the `intro` sound, switching it off stops everything.
 */
export default function Sound() {
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
    loadSound().then((start) => {
      if (gone) return;
      own = start(soundOptions(latest.current));
      session = own;
      if (switchedOn) own.play('intro');
    });
    return () => {
      gone = true;
      own?.stop();
      if (session === own) session = null;
    };
  }, [on]);

  return null;
}
