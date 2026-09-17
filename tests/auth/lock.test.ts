import { describe, expect, it } from "vitest";

import { isAccountLocked } from "@/lib/auth/lock";

describe("isAccountLocked", () => {
  it("treats an admin lock as locked", () => {
    expect(isAccountLocked({ adminLocked: true, lockedUntil: null })).toBe(true);
  });

  it("treats a future lockout as locked", () => {
    expect(
      isAccountLocked({
        adminLocked: false,
        lockedUntil: new Date(Date.now() + 60_000),
      }),
    ).toBe(true);
  });

  it("treats an expired lockout as unlocked", () => {
    expect(
      isAccountLocked({
        adminLocked: false,
        lockedUntil: new Date(Date.now() - 1_000),
      }),
    ).toBe(false);
  });
});
