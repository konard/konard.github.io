import { useEffect, useRef } from 'react';
import codes from '../links/configurations.json';
import { startNebula } from '../visuals/nebula';
import { startRain } from '../visuals/rain';

// Every configuration of 1–4 links, the alphabet of the rain.
const ALPHABET = [1, 2, 3, 4].flatMap((n) => codes[n]);

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The page background, bottom to top: the universe (nebula and stars), a grid,
 * and the rain of link symbols. All infographics are drawn on top of it.
 */
export default function Cosmos() {
  const nebula = useRef(null);
  const rain = useRef(null);

  useEffect(() => {
    const animate = !prefersReducedMotion();
    const stops = [startNebula(nebula.current, { animate }), startRain(rain.current, { codes: ALPHABET, animate })];
    return () => stops.forEach((stop) => stop());
  }, []);

  return (
    <div className="cosmos" aria-hidden="true">
      <canvas ref={nebula} className="cosmos__universe" />
      <div className="cosmos__grid" />
      <canvas ref={rain} className="cosmos__rain" />
    </div>
  );
}
