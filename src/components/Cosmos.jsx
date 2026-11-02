import { useEffect, useRef } from 'react';
import { STAR_KEYS, STAR_LAYERS } from '../settings/schema.layers';
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
  zoom: s['nebula.zoom'],
  starSize: s['nebula.starSize'],
  starColor: s['nebula.starColor'],
  color1: s['nebula.color1'],
  color2: s['nebula.color2'],
  color3: s['nebula.color3'],
  color4: s['nebula.color4'],
});

/** Options of the star layers (issue #15): `layers[0]` is `stars1.*` and so on. */
export const starsOptions = (s) => ({
  fps: s['stars.fps'],
  layers: STAR_LAYERS.map((n) => Object.fromEntries(STAR_KEYS.map((key) => [key, s[`stars${n}.${key}`]]))),
});

/** Whether any star layer is on, so its code is needed. */
export const starsShown = (s) => STAR_LAYERS.some((n) => s[`stars${n}.on`]);

const BEAM_KEYS = ['direction', 'style', 'count', 'speed', 'length', 'width', 'color', 'glow', 'pause', 'snap', 'both'];

/** Options of the beams (issue #15); they run on the lines of the grid. */
export const beamsOptions = (s) => ({
  grid: s['grid.size'],
  gridWidth: s['grid.width'],
  ...Object.fromEntries(BEAM_KEYS.map((key) => [key, s[`beams.${key}`]])),
});

/**
 * One picker per choice of links, so the rain sees the same picker until the
 * choice changes (issue #49: nothing is drawn again for other settings).
 */
let picker = null;
const pickerOf = (minLinks, maxLinks, real) => {
  const key = `${minLinks} ${maxLinks} ${real}`;
  if (picker?.key !== key) picker = Object.assign(pickerFor({ minLinks, maxLinks, real }), { key });
  return picker;
};

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
  padding: s['rain.padding'],
  speeds: s['rain.speeds'],
  density: s['rain.density'],
  restart: s['rain.restart'],
  pick: pickerOf(s['rain.minLinks'], s['rain.maxLinks'], s['rain.real']),
});

/**
 * What a layer is given, as text: a layer is updated only when it changes, so
 * a border, a colour of the interface or any other setting the layer does not
 * read never draws the background again (issue #49).
 */
export const optionsKey = (options) =>
  JSON.stringify(options, (key, value) => (typeof value === 'function' ? (value.key ?? 'function') : value));

/** Sends `options` to the running layer `run` when they differ from what it was last given. */
const send = (sent, name, run, options) => {
  const key = optionsKey(options);
  if (sent.current[name] === key) return;
  sent.current[name] = key;
  if (run.current) trace('update', name);
  run.current?.update(options);
};

/**
 * Trace of the background (issue #49): `localStorage['cosmos.debug'] = '1'`
 * logs every layer that starts, every pause and resume and every update.
 */
const tracing = () => {
  try {
    return window.localStorage?.getItem('cosmos.debug') === '1';
  } catch {
    return false;
  }
};
const trace = (...args) => tracing() && console.debug('[cosmos]', ...args);

/**
 * Starts a background layer whose code is loaded only when it is shown
 * (issue #15: the default page does not download what it does not draw).
 */
function useLazyLayer(shown, animate, canvas, run, load, options) {
  useEffect(() => {
    if (!shown) return undefined;
    let stop = null;
    let gone = false;
    load().then((start) => {
      if (gone || !canvas.current) return;
      stop = start(canvas.current, { ...options(), animate: animate.current });
      run.current = stop;
    });
    return () => {
      gone = true;
      stop?.();
      run.current = null;
    };
    // `options` and `animate` are refs to the latest settings; the layer starts again only when it is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);
}

const loadStars = () => import('../visuals/stars').then((module) => module.startStars);
const loadBeams = () => import('../visuals/beams').then((module) => module.startBeams);

/**
 * The page background, bottom to top: the universe (nebula and stars), up to
 * four layers of stars, a grid, beams running along it, and the rain of link
 * networks, two symbols per grid cell. All infographics are drawn on top of it.
 * Every layer follows the settings at once (issue #13): a layer is started
 * only when it is switched on; the motion only stops or starts the running
 * layers on their next frame, without drawing anything again (issue #49), and
 * a layer hears of the settings only when the options it reads change.
 */
export default function Cosmos() {
  const settings = useSettings();
  const nebula = useRef(null);
  const stars = useRef(null);
  const grid = useRef(null);
  const beams = useRef(null);
  const rain = useRef(null);
  const nebulaRun = useRef(null);
  const starsRun = useRef(null);
  const beamsRun = useRef(null);
  const rainRun = useRef(null);
  const latest = useRef(settings);
  const sent = useRef({});
  const animate = moves(settings['motion.mode']);
  const moving = useRef(animate);
  const universe = settings['nebula.on'];
  const starry = starsShown(settings);
  const beaming = settings['beams.on'];

  useEffect(() => {
    latest.current = settings;
    send(sent, 'nebula', nebulaRun, nebulaOptions(settings));
    send(sent, 'stars', starsRun, starsOptions(settings));
    send(sent, 'beams', beamsRun, beamsOptions(settings));
    send(sent, 'rain', rainRun, rainOptions(settings, animate));
  }, [settings, animate]);

  useEffect(() => {
    if (moving.current === animate) return;
    moving.current = animate;
    trace(animate ? 'resume' : 'pause');
    [nebulaRun, starsRun, beamsRun, rainRun].forEach((run) => run.current?.animate?.(animate));
  }, [animate]);

  useEffect(() => {
    if (!universe) return undefined;
    trace('start nebula');
    const stop = startNebula(nebula.current, { ...nebulaOptions(latest.current), animate: moving.current });
    nebulaRun.current = stop;
    return () => {
      stop();
      nebulaRun.current = null;
    };
  }, [universe]);

  useLazyLayer(starry, moving, stars, starsRun, loadStars, () => starsOptions(latest.current));
  useLazyLayer(beaming, moving, beams, beamsRun, loadBeams, () => beamsOptions(latest.current));

  useEffect(() => {
    // The grid and the beams on its lines drift down together with the rain.
    const onDrift = (pixels) => {
      const shift = `translateY(${pixels.toFixed(2)}px)`;
      if (grid.current) grid.current.style.transform = shift;
      if (beams.current) beams.current.style.transform = shift;
    };
    if (grid.current) grid.current.style.transform = '';
    trace('start rain');
    const animated = moving.current;
    const stop = startRain(rain.current, { ...rainOptions(latest.current, animated), onDrift, animate: animated });
    rainRun.current = stop;
    return () => {
      stop();
      rainRun.current = null;
    };
  }, []);

  return (
    <div className="cosmos" aria-hidden="true">
      {universe && <canvas ref={nebula} className="cosmos__universe" />}
      {starry && <canvas ref={stars} className="cosmos__stars" />}
      <div ref={grid} className="cosmos__grid" />
      {beaming && <canvas ref={beams} className="cosmos__beams" />}
      <canvas ref={rain} className="cosmos__rain" />
    </div>
  );
}
