// Changing one gap normally affects only that link's pair scores. A reference
// gap can also change the fitted scale: then every existing image-unit middle
// cut must be rescored. Keep that uncommon case exact as well.
import { pairCost, visiblePolyline } from './collisions';
import { curveTransform } from './glyph';

export class GapScoreCache {
  constructor(curves, shape) {
    this.curves = curves;
    this.shape = shape;
    this.middles = curves.map((curve) => curve.middle.at);
    Object.assign(this, this.fullState(curveTransform(curves, shape).scale));
  }

  fullState(scale) {
    const lines = this.curves.map((curve, i) => visiblePolyline(curve, this.shape, i, scale));
    const pairs = lines.map(() => Array(lines.length).fill(0));
    let total = 0;
    for (let i = 0; i < lines.length; i++)
      for (let j = i + 1; j < lines.length; j++) {
        pairs[i][j] = pairs[j][i] = pairCost(lines[i], lines[j], this.middles);
        total += pairs[i][j];
      }
    return { scale, lines, pairs, total };
  }

  measure(i, curve) {
    const previous = this.curves[i];
    this.curves[i] = curve;
    const scale = curve === previous ? this.scale : curveTransform(this.curves, this.shape).scale;
    const cuts = this.curves.some(
      (_, j) =>
        (this.shape.linkGaps[j]?.[2] ?? this.shape.middleGapStart) > 0 ||
        (this.shape.linkGaps[j]?.[3] ?? this.shape.middleGapEnd) > 0,
    );
    let state;
    if (scale !== this.scale && cuts) state = this.fullState(scale);
    else {
      const line = visiblePolyline(curve, this.shape, i, scale);
      const pairRow = this.lines.map((other, j) => (i === j ? 0 : pairCost(line, other, this.middles)));
      const sum = (values) => values.reduce((a, b) => a + b, 0);
      state = { scale, line, pairRow, total: this.total - sum(this.pairs[i]) + sum(pairRow) };
    }
    this.curves[i] = previous;
    return { ...state, i, curve };
  }

  accept(state) {
    const { i, curve, scale, total } = state;
    this.curves[i] = curve;
    this.scale = scale;
    this.total = total;
    if (state.lines) {
      this.lines = state.lines;
      this.pairs = state.pairs;
    } else {
      this.lines[i] = state.line;
      state.pairRow.forEach((cost, j) => {
        this.pairs[i][j] = this.pairs[j][i] = cost;
      });
    }
  }
}
