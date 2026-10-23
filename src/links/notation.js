// The notation of the links theory (issue #13). The English draft 0.0.2 of
// link-foundation/meta-theory writes links as L → L²; the draft 0.0.3 renames
// L (link) to R (reference) and A (association) to L (link), so the formula
// becomes R → R² (drafts/0.0.3/article/10-changelog.md). The site keeps L → L²
// by default; the "theory.notation" setting switches every formula on it.
import { useCallback } from 'react';
import { useSettings } from '../settings/store';

export const NOTATIONS = ['L', 'R'];

/** The formula L → L² (or L ↦ L²) inside a text, in the notation of draft 0.0.3. */
export const toReferences = (text) => text.replace(/(^|[^\p{L}])L ([→↦]) L²/gu, '$1R $2 R²');

/** `text` in the given notation; a `{ L, R }` object picks its variant. */
export function notate(text, notation) {
  if (text && typeof text === 'object' && 'L' in text) return text[notation] ?? text.L;
  return notation === 'R' && typeof text === 'string' ? toReferences(text) : text;
}

/** `{ notation, n }`: the chosen notation and `n(text)`, which writes the theory's formulas in it. */
export function useNotation() {
  const notation = useSettings()['theory.notation'];
  const n = useCallback((text) => notate(text, notation), [notation]);
  return { notation, n };
}
