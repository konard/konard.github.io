import { useEffect } from 'react';
import { useSettings } from '../settings/store';

/**
 * The SVG filter that bends what is behind the liquid glass (issue #13):
 * turbulence noise displaces the backdrop, as thick glass would. Only
 * Chromium applies SVG filters in backdrop-filter, so the filter is rendered,
 * and <html> marked with data-refracts for skins.liquid.css, there only.
 */
export const supportsRefraction = () => typeof navigator !== 'undefined' && 'userAgentData' in navigator;

export default function LiquidRefraction() {
  const settings = useSettings();
  const on = settings['skin.name'] === 'liquid' && settings['liquid.refraction'] && supportsRefraction();

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
          numOctaves="2"
          seed="13"
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
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
