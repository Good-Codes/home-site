import { describe, expect, it } from "vitest";

import { formatZarAmount, formatZarRange } from "@/lib/project-blueprint/format";
import { roundMoneyRange } from "@/lib/project-blueprint/round";

describe("formatZarRange", () => {
  it("formats million and thousand bands without false precision", () => {
    expect(formatZarAmount(1_200_000)).toBe("R1.2m");
    expect(formatZarAmount(85_000)).toBe("R85k");
    expect(formatZarRange({ low: 1_200_000, likely: 1_400_000, high: 1_600_000 })).toBe(
      "R1.2m\u2013R1.6m",
    );
    expect(formatZarRange({ low: 80_000, likely: 95_000, high: 120_000 })).toBe(
      "R80k\u2013R120k",
    );
  });
});

describe("roundMoneyRange", () => {
  it("rounds a planning band onto public steps", () => {
    const rounded = roundMoneyRange({
      low: 163_200,
      likely: 247_800,
      high: 381_100,
    });
    expect(rounded.low % 5_000).toBe(0);
    expect(rounded.likely % 5_000).toBe(0);
    expect(rounded.high % 5_000).toBe(0);
    expect(rounded.low).toBeLessThanOrEqual(rounded.likely);
    expect(rounded.likely).toBeLessThanOrEqual(rounded.high);
  });
});
