import { useEffect, useRef } from 'react';
import { startNebula } from '../visuals/nebula';
import { startRain } from '../visuals/rain';

/** Size of a background grid cell in CSS pixels; the rain puts two symbols into each cell. */
const GRID = 64;

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The page background, bottom to top: the universe (nebula and stars), a grid,
 * and the rain of link networks, two symbols per grid cell. All infographics
 * are drawn on top of it.
 */
export default function Cosmos() {
  const nebula = useRef(null);
  const grid = useRef(null);
  const rain = useRef(null);

  useEffect(() => {
    const animate = !prefersReducedMotion();
    const onDrift = (pixels) => {
      if (grid.current) grid.current.style.transform = `translateY(${pixels.toFixed(2)}px)`;
    };
    const stops = [
      startNebula(nebula.current, { animate }),
      startRain(rain.current, { grid: GRID, period: animate ? 24000 : 0, onDrift, animate }),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  return (
    <div className="cosmos" aria-hidden="true">
      <canvas ref={nebula} className="cosmos__universe" />
      <div ref={grid} className="cosmos__grid" />
      <canvas ref={rain} className="cosmos__rain" />
    </div>
  );
}
