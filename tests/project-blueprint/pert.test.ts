import { describe, expect, it } from "vitest";

import {
  approximateP50,
  approximateP80,
  pertExpected,
  pertStdDev,
  pertVariance,
} from "@/lib/project-blueprint/engine/pert";

describe("pertExpected", () => {
  it("uses the classic (L + 4M + H) / 6 formula", () => {
    expect(pertExpected(10, 20, 40)).toBeCloseTo((10 + 4 * 20 + 40) / 6, 10);
    expect(pertExpected(0, 0, 0)).toBe(0);
    expect(pertExpected(100, 100, 100)).toBe(100);
  });
});

describe("pertVariance", () => {
  it("uses ((H - L) / 6)^2", () => {
    expect(pertVariance(10, 40)).toBeCloseTo(((40 - 10) / 6) ** 2, 10);
    expect(pertVariance(5, 5)).toBe(0);
  });
});

describe("pertStdDev and percentiles", () => {
  it("stdDev is (H - L) / 6", () => {
    expect(pertStdDev(10, 40)).toBeCloseTo(5, 10);
  });

  it("P50 is the expected value; P80 adds ~0.84 sigma", () => {
    const expected = pertExpected(10, 20, 40);
    const variance = pertVariance(10, 40);
    expect(approximateP50(expected, variance)).toBe(expected);
    expect(approximateP80(expected, variance)).toBeCloseTo(
      expected + 0.8416212335729143 * Math.sqrt(variance),
      10,
    );
  });
});
