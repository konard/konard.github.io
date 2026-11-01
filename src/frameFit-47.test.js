// Issue #47: "we should be able to configure CORNERS OF THE FRAME based on
// conditions like minimum/maximum height/width of the UI element".
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { levelOf, limitsOf, outside, watchFrameFit } from './frameFit';
import { FIT_LEVELS, fitCss, scaled } from './skins.frames.fit';
import { CSS_RULES, DEFAULTS, RULES } from './settings/schema';
import { levelKey } from './settings/schema.skins';

const FUTURE = { ...DEFAULTS, 'skin.name': 'futuristic', 'future.frame': 'custom' };

describe('limits of the size of an element (issue #47)', () => {
  it('has limits and a scale of the corners for every level', () => {
    for (const level of FIT_LEVELS) {
      for (const name of ['FitMinWidth', 'FitMaxWidth', 'FitMinHeight', 'FitMaxHeight']) {
        expect(RULES, levelKey(level, name)).toHaveProperty([levelKey(level, name)]);
        // Only the script reads the limits: no variable on <html>.
        expect(CSS_RULES).not.toHaveProperty([levelKey(level, name)]);
      }
      expect(CSS_RULES).toHaveProperty([levelKey(level, 'FitScale')]);
    }
    expect(RULES['corner.buttonFitScale']).toEqual({ d: 0.5, min: 0, max: 1 });
  });

  it('measures nothing until a level of the custom frame has limits', () => {
    expect(limitsOf(DEFAULTS)).toBeNull();
    expect(limitsOf(FUTURE)).toBeNull();
    expect(limitsOf({ ...FUTURE, 'skin.name': 'glass', 'corner.buttonFitMaxHeight': 30 })).toBeNull();
    expect(limitsOf({ ...FUTURE, 'future.frame': 'chamfer', 'corner.buttonFitMaxHeight': 30 })).toBeNull();
    expect(limitsOf({ ...FUTURE, 'corner.buttonFitMaxHeight': 30, 'corner.fitMinWidth': 200 })).toEqual({
      panel: [200, 0, 0, 0],
      button: [0, 0, 0, 30],
    });
    // Tables keep their border by default, so their limits draw nothing.
    expect(limitsOf({ ...FUTURE, 'corner.tableFitMinWidth': 200 })).toBeNull();
  });

  it('tells a size outside the limits, 0 being no limit', () => {
    expect(outside([0, 0, 0, 0], 10, 10)).toBe(false);
    expect(outside([100, 0, 0, 0], 99, 10)).toBe(true);
    expect(outside([100, 0, 0, 0], 100, 10)).toBe(false);
    expect(outside([0, 300, 0, 0], 301, 10)).toBe(true);
    expect(outside([0, 0, 40, 0], 500, 39.5)).toBe(true);
    expect(outside([0, 0, 0, 40], 500, 41)).toBe(true);
    expect(outside([100, 300, 20, 40], 200, 30)).toBe(false);
  });

  it('knows the level of an element', () => {
    document.body.innerHTML = `
      <div class="card" id="panel"><div class="card" id="block"></div><button id="button">b</button></div>
      <input id="field"><a class="chip" id="chip">c</a><p id="other"></p>`;
    const level = (id) => levelOf(document.getElementById(id));
    expect([level('panel'), level('block'), level('button'), level('field'), level('chip'), level('other')]).toEqual([
      'panel',
      'block',
      'button',
      'field',
      'chip',
      null,
    ]);
  });
});

describe('marks of the elements outside the limits (issue #47)', () => {
  const real = globalThis.ResizeObserver;
  afterEach(() => {
    globalThis.ResizeObserver = real;
    document.body.innerHTML = '';
  });

  /** A ResizeObserver that reports the sizes of `sizes` when the test calls `report()`. */
  function fakeObserver(sizes) {
    const observers = [];
    globalThis.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.targets = new Set();
        observers.push(this);
      }
      observe(target) {
        this.targets.add(target);
      }
      unobserve(target) {
        this.targets.delete(target);
      }
      disconnect() {
        this.targets.clear();
      }
    };
    return {
      observers,
      report: () =>
        observers.forEach((observer) =>
          observer.callback(
            [...observer.targets].map((target) => ({
              target,
              borderBoxSize: [{ inlineSize: sizes[target.id][0], blockSize: sizes[target.id][1] }],
            })),
          ),
        ),
    };
  }

  it('marks the small buttons only while the setting asks for it', async () => {
    document.body.innerHTML =
      '<div class="card" id="panel"><button id="small">s</button><button id="big">b</button></div>';
    const fake = fakeObserver({ panel: [600, 300], small: [60, 24], big: [200, 44], added: [50, 20] });
    let settings = { ...FUTURE, 'corner.buttonFitMinHeight': 32 };
    const listeners = new Set();
    const stop = watchFrameFit(
      () => settings,
      (listener) => (listeners.add(listener), () => listeners.delete(listener)),
    );
    fake.report();
    const fit = (id) => document.getElementById(id).getAttribute('data-fx-fit');
    expect([fit('panel'), fit('small'), fit('big')]).toEqual([null, 'button', null]);

    // A button that a new page adds is measured too.
    const added = document.createElement('button');
    added.id = 'added';
    document.querySelector('.card').append(added);
    await new Promise((resolve) => setTimeout(resolve));
    fake.report();
    expect(fit('added')).toBe('button');

    // Without limits the marks go away and nothing is measured.
    settings = FUTURE;
    listeners.forEach((listener) => listener());
    expect([fit('small'), fit('added')]).toEqual([null, null]);
    expect(fake.observers.every((observer) => observer.targets.size === 0)).toBe(true);
    stop();
  });
});

describe('the stylesheet of the marked elements (issue #47)', () => {
  it('is up to date', () => {
    expect(readFileSync(join(__dirname, 'skins.frames.fit.css'), 'utf8') === fitCss()).toBe(true);
    expect(readFileSync(join(__dirname, 'skins.future.css'), 'utf8')).toContain("@import './skins.frames.fit.css';");
  });

  it('scales the corners and keeps the edges', () => {
    expect(scaled('var(--fxp-tl-x) var(--fxp-ew-top) var(--fx-tl-w)', 'p', 'F')).toBe(
      'calc(var(--fxp-tl-x) * F) var(--fxp-ew-top) var(--fx-tl-w)',
    );
    expect(scaled('var(--fxbutton-br-arm) var(--fxb-br-arm)', 'button', 'F')).toBe(
      'calc(var(--fxbutton-br-arm) * F) var(--fxb-br-arm)',
    );
  });

  it('draws a marked element of every level with the fit scale of its level', () => {
    const css = fitCss();
    expect(css).toContain("[data-future-frame='custom'] [data-fx-fit='panel'] {");
    expect(css).toContain('calc(var(--fxp-tl-0x) * var(--corner-fit-scale, 1))');
    expect(css).toContain("[data-corner-blocks='own'] [data-fx-fit='block'] {");
    expect(css).toContain('calc(var(--fxblock-tl-0x) * var(--corner-block-fit-scale, 1))');
    // A control is one attribute more specific than the rule of its frame.
    expect(css).toContain(
      ":root:root:root[data-skin-name='futuristic'][data-future-frame='custom'][data-corner-button-corners='same']:not([data-corner-controls='border']) .button[data-fx-fit='button']",
    );
    expect(css).toContain('calc(var(--fxc-tl-0x) * var(--corner-button-fit-scale, 1))');
    expect(css).toContain('calc(var(--fxchip-tl-0x) * var(--corner-chip-fit-scale, 1))');
  });
});
