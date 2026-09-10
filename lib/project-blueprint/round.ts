/**
 * Public ZAR rounding for planning bands. No rates or margins.
 */

import type { MoneyRange } from "./types";

export type RoundingBand = {
  upToExclusive: number;
  step: number;
};

export const DEFAULT_ROUNDING_BANDS: RoundingBand[] = [
  { upToExclusive: 250_000, step: 5_000 },
  { upToExclusive: 500_000, step: 10_000 },
  { upToExclusive: 1_500_000, step: 25_000 },
  { upToExclusive: 3_000_000, step: 50_000 },
  { upToExclusive: Number.POSITIVE_INFINITY, step: 100_000 },
];

export function selectBand(
  midZar: number,
  bands: RoundingBand[] = DEFAULT_ROUNDING_BANDS,
): RoundingBand {
  const sorted = [...bands].sort((a, b) => a.upToExclusive - b.upToExclusive);
  for (const band of sorted) {
    if (midZar < band.upToExclusive) return band;
  }
  return sorted[sorted.length - 1] ?? { upToExclusive: Infinity, step: 100_000 };
}

export function roundToStep(
  value: number,
  step: number,
  mode: "nearest" | "up" | "down" = "nearest",
): number {
  if (step <= 0) return value;
  const q = value / step;
  if (mode === "up") return Math.ceil(q) * step;
  if (mode === "down") return Math.floor(q) * step;
  return Math.round(q) * step;
}

export function roundMoneyRange(
  range: MoneyRange,
  bands: RoundingBand[] = DEFAULT_ROUNDING_BANDS,
): MoneyRange {
  const mid = (range.low + range.likely + range.high) / 3;
  const step = selectBand(mid, bands).step;
  let low = roundToStep(range.low, step, "down");
  const likely = roundToStep(range.likely, step, "nearest");
  let high = roundToStep(range.high, step, "up");
  if (low > likely) low = likely;
  if (high < likely) high = likely;
  if (low === high) {
    high = low + step;
  }
  return { low, likely, high };
}
