/**
 * Client-safe ZAR display helpers. No rates or commercial internals.
 */

import type { MoneyRange } from "./types";

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
    return `R${Math.round(value / 1_000)}k`;
  }
  if (abs >= 1_000) {
    const k = Math.round((value / 1_000) * 10) / 10;
    return `R${k}k`;
  }
  return `R${Math.round(value).toLocaleString("en-ZA")}`;
}

export function formatZarRange(range: MoneyRange, display?: string): string {
  if (display?.trim()) return display;
  return `${formatZarAmount(range.low)}–${formatZarAmount(range.high)}`;
}

export function formatWeeks(min: number, likely: number, max?: number): string {
  if (max && max !== likely) {
    return `${min}–${max} weeks (likely around ${likely})`;
  }
  if (min === likely) return `about ${likely} weeks`;
  return `${min}–${likely} weeks`;
}
