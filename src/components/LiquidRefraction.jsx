import { useEffect, useSyncExternalStore } from 'react';
import { useSettings } from '../settings/store';

/**
 * The SVG filter that bends what is behind the liquid glass (issue #13):
 * turbulence noise displaces the backdrop, as thick glass would. Only
 * Chromium applies SVG filters in backdrop-filter, so the filter is rendered,
 * and <html> marked with data-refracts for skins.liquid.css, there only.
 */
export const supportsRefraction = () => typeof navigator !== 'undefined' && 'userAgentData' in navigator;
const reduced = () => window.matchMedia?.('(prefers-reduced-transparency: reduce)');
const subscribe = (listener) => {
  const media = reduced();
  media?.addEventListener?.('change', listener);
  return () => media?.removeEventListener?.('change', listener);
};
const snapshot = () => reduced()?.matches || false;

export default function LiquidRefraction() {
  const settings = useSettings();
  const reduce = useSyncExternalStore(subscribe, snapshot, () => false);
  const on =
    settings['skin.name'] === 'liquid' &&
    settings['liquid.refraction'] &&
    settings['liquid.opacity'] > 0 &&
    settings['ui.transparency'] !== 'reduce' &&
    !(settings['ui.transparency'] === 'auto' && reduce) &&
    supportsRefraction();

  useEffect(() => {
    if (!on) return undefined;
    const root = document.documentElement;
    root.dataset.refracts = '';
    return () => delete root.dataset.refracts;
  }, [on]);

  if (!on) return null;
  return (
    <svg className="liquid-refraction" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="liquid-refraction" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence
          type="fractalNoise"
          baseFrequency={settings['liquid.refractionDetail'] / 1000}
          numOctaves={settings['liquid.refractionOctaves']}
          seed={settings['liquid.refractionSeed']}
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation={settings['liquid.refractionSmoothing']} result="soft" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="soft"
          scale={settings['liquid.refractionScale']}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
