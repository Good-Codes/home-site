import { describe, expect, it } from "vitest";

import {
  formatZarAmount,
  formatZarRange,
} from "@/lib/project-blueprint/engine/round";

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
