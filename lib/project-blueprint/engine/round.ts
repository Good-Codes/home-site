import type { MoneyRange, RoundingBand, ThreePoint } from "./types";

/**
 * Public rounding bands (ZAR):
 * - Small: nearest R5,000 / R10,000
 * - Medium: nearest R25,000 / R50,000
 * - Large: nearest R100,000
 */

export function selectBand(
  midZar: number,
  bands: RoundingBand[],
): RoundingBand {
  const sorted = [...bands].sort((a, b) => a.upToExclusive - b.upToExclusive);
  for (const band of sorted) {
    if (midZar < band.upToExclusive) return band;
  }
  return sorted[sorted.length - 1] ?? { upToExclusive: Infinity, step: 100_000 };
}

export function roundToStep(value: number, step: number, mode: "nearest" | "up" | "down" = "nearest"): number {
  if (step <= 0) return value;
  const q = value / step;
  if (mode === "up") return Math.ceil(q) * step;
  if (mode === "down") return Math.floor(q) * step;
  return Math.round(q) * step;
}

export function roundMoneyRange(
  range: ThreePoint,
  bands: RoundingBand[],
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

/** Format a ZAR amount like R85k, R1.2m — no false precision. */
export function formatZarAmount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const m = value / 1_000_000;
    const rounded = Math.round(m * 10) / 10;
    const text =
      Number.isInteger(rounded) || Math.abs(rounded - Math.round(rounded)) < 0.05
        ? `${Math.round(rounded)}`
        : rounded.toFixed(1).replace(/\.0$/, "");
    return `R${text}m`;
  }
  if (abs >= 10_000) {
    const k = Math.round(value / 1_000);
    return `R${k}k`;
  }
  if (abs >= 1_000) {
    const k = Math.round((value / 1_000) * 10) / 10;
    return `R${k}k`;
  }
  return `R${Math.round(value).toLocaleString("en-ZA")}`;
}

/** Format ranges like R1.2m–R1.6m */
export function formatZarRange(range: MoneyRange): string {
  return `${formatZarAmount(range.low)}–${formatZarAmount(range.high)}`;
}
