import { useEffect, useRef } from 'react';
import { useSettings } from '../settings/store';
import { startNebula } from '../visuals/nebula';
import { pickerFor, startRain } from '../visuals/rain';

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Whether the background moves: the motion setting, or the system preference in the automatic mode. */
export const moves = (mode, reduced = prefersReducedMotion()) => (mode === 'auto' ? !reduced : mode === 'on');

/** Options of the universe layer from the settings (see src/settings/schema.js). */
export const nebulaOptions = (s) => ({
  scale: s['nebula.resolution'],
  fps: s['nebula.fps'],
  speed: s['nebula.speed'],
  gas: s['nebula.gas'],
  hue: s['nebula.hue'],
  stars: s['nebula.stars'],
  starBrightness: s['nebula.starBrightness'],
  twinkle: s['nebula.twinkle'],
  vignette: s['nebula.vignette'],
});

/** Options of the rain from the settings; the grid cell size is shared with the grid layer. */
export const rainOptions = (s, animate) => ({
  grid: s['grid.size'],
  period: animate ? s['grid.period'] * 1000 : 0,
  visible: s['rain.on'],
  step: s['rain.step'],
  fade: s['rain.fade'],
  glow: s['rain.glow'],
  glowColor: s['rain.glowColor'],
  lineWidth: s['rain.lineWidth'],
  speeds: s['rain.speeds'],
  density: s['rain.density'],
  restart: s['rain.restart'],
  pick: pickerFor({ minLinks: s['rain.minLinks'], maxLinks: s['rain.maxLinks'], real: s['rain.real'] }),
});

/**
 * The page background, bottom to top: the universe (nebula and stars), a grid,
 * and the rain of link networks, two symbols per grid cell. All infographics
 * are drawn on top of it. Every layer follows the settings at once (issue #13):
 * the layers are started again only when the motion or the universe is
 * switched on or off, everything else is changed while they run.
 */
export default function Cosmos() {
  const settings = useSettings();
  const nebula = useRef(null);
  const grid = useRef(null);
  const rain = useRef(null);
  const nebulaRun = useRef(null);
  const rainRun = useRef(null);
  const latest = useRef(settings);
  const animate = moves(settings['motion.mode']);
  const universe = settings['nebula.on'];

  useEffect(() => {
    latest.current = settings;
    nebulaRun.current?.update(nebulaOptions(settings));
    rainRun.current?.update(rainOptions(settings, animate));
  }, [settings, animate]);

  useEffect(() => {
    if (!universe) return undefined;
    const stop = startNebula(nebula.current, { ...nebulaOptions(latest.current), animate });
    nebulaRun.current = stop;
    return () => {
      stop();
      nebulaRun.current = null;
    };
  }, [animate, universe]);

  useEffect(() => {
    const onDrift = (pixels) => {
      if (grid.current) grid.current.style.transform = `translateY(${pixels.toFixed(2)}px)`;
    };
    if (grid.current) grid.current.style.transform = '';
    const stop = startRain(rain.current, { ...rainOptions(latest.current, animate), onDrift, animate });
    rainRun.current = stop;
    return () => {
      stop();
      rainRun.current = null;
    };
  }, [animate]);

  return (
    <div className="cosmos" aria-hidden="true">
      {universe && <canvas ref={nebula} className="cosmos__universe" />}
      <div ref={grid} className="cosmos__grid" />
      <canvas ref={rain} className="cosmos__rain" />
    </div>
  );
}
