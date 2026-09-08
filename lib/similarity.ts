export type PerfumeProfile = {
  notes: string[];
  accords: string[];
};

const ACCORD_WEIGHT = 2;

function intersectSize(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x)).length;
}

function unionSize(a: string[], b: string[]): number {
  return new Set([...a, ...b]).size;
}

/**
 * Weighted Jaccard similarity over notes and accords, 0..1.
 * Accords count double: they're a broader, more perceptible signal than a single note.
 */
export function similarity(a: PerfumeProfile, b: PerfumeProfile): number {
  const noteIntersection = intersectSize(a.notes, b.notes);
  const noteUnion = unionSize(a.notes, b.notes);
  const accordIntersection = intersectSize(a.accords, b.accords);
  const accordUnion = unionSize(a.accords, b.accords);

  const numerator = noteIntersection + ACCORD_WEIGHT * accordIntersection;
  const denominator = noteUnion + ACCORD_WEIGHT * accordUnion;

  if (denominator === 0) return 0;
  return numerator / denominator;
}
