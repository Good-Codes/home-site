import type { ThreePoint } from "./types";

/**
 * PERT three-point helpers.
 *
 * expected = (L + 4M + H) / 6
 * variance = ((H - L) / 6)²
 */

export function pertExpected(low: number, likely: number, high: number): number {
  return (low + 4 * likely + high) / 6;
}

export function pertVariance(low: number, high: number): number {
  const spread = (high - low) / 6;
  return spread * spread;
}

export function pertStdDev(low: number, high: number): number {
  return (high - low) / 6;
}

export function pertExpectedFrom(point: ThreePoint): number {
  return pertExpected(point.low, point.likely, point.high);
}

export function pertVarianceFrom(point: ThreePoint): number {
  return pertVariance(point.low, point.high);
}

/**
 * Normal-approximation percentiles from PERT mean/variance.
 * P50 ≈ mean; P80 ≈ mean + 0.8416212335729143 · σ
 */
const Z_P80 = 0.8416212335729143;

export function approximateP50(expected: number, _variance: number): number {
  return expected;
}

export function approximateP80(expected: number, variance: number): number {
  const sigma = Math.sqrt(Math.max(0, variance));
  return expected + Z_P80 * sigma;
}

export function sumThreePoint(points: ThreePoint[]): ThreePoint {
  return points.reduce(
    (acc, p) => ({
      low: acc.low + p.low,
      likely: acc.likely + p.likely,
      high: acc.high + p.high,
    }),
    { low: 0, likely: 0, high: 0 },
  );
}

export function scaleThreePoint(point: ThreePoint, factor: number): ThreePoint {
  return {
    low: point.low * factor,
    likely: point.likely * factor,
    high: point.high * factor,
  };
}

/**
 * Widen only the high side (and optionally stretch low slightly toward likely)
 * so uncertainty increases range without inventing false optimism.
 */
export function widenThreePoint(point: ThreePoint, widenFactor: number): ThreePoint {
  if (widenFactor <= 1) return { ...point };
  const mid = point.likely;
  const lowSpread = mid - point.low;
  const highSpread = point.high - mid;
  return {
    low: Math.max(0, mid - lowSpread * Math.sqrt(widenFactor)),
    likely: mid,
    high: mid + highSpread * widenFactor,
  };
}

/** Mulberry32 — deterministic seeded PRNG for optional Monte Carlo. */
export function createSeededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derive a numeric seed from a hex/base checksum string. */
export function seedFromChecksum(checksum: string): number {
  let h = 2166136261;
  for (let i = 0; i < checksum.length; i++) {
    h ^= checksum.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Sample a PERT-beta-like value using a triangular approximation on [L,H]
 * with mode M — deterministic given rng.
 */
export function sampleTriangular(
  low: number,
  likely: number,
  high: number,
  rng: () => number,
): number {
  if (high <= low) return likely;
  const u = rng();
  const c = (likely - low) / (high - low);
  if (u < c) {
    return low + Math.sqrt(u * (high - low) * (likely - low));
  }
  return high - Math.sqrt((1 - u) * (high - low) * (high - likely));
}

export function monteCarloPercentiles(
  samples: number[],
  percentiles: number[],
): number[] {
  if (samples.length === 0) return percentiles.map(() => 0);
  const sorted = [...samples].sort((a, b) => a - b);
  return percentiles.map((p) => {
    const idx = Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
    );
    return sorted[idx]!;
  });
}

/**
 * Optional Monte Carlo over independent triangular samples of cost components.
 * Seed must come from answers+config checksum for determinism.
 */
export function runCostMonteCarlo(
  components: ThreePoint[],
  iterations: number,
  seed: number,
): { p50: number; p80: number; mean: number } {
  const rng = createSeededRng(seed);
  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    let total = 0;
    for (const c of components) {
      total += sampleTriangular(c.low, c.likely, c.high, rng);
    }
    samples.push(total);
  }
  const [p50, p80] = monteCarloPercentiles(samples, [50, 80]);
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  return { p50: p50!, p80: p80!, mean };
}
