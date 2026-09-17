/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";

import {
  PROFILE_NUDGE_DISMISS_KEY_PREFIX,
  readProfileNudgeDismissed,
  writeProfileNudgeDismissed,
} from "@/lib/account/profile-nudge";

describe("profile nudge dismissal", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("defaults to showing the nudge", () => {
    expect(readProfileNudgeDismissed("user-1")).toBe(false);
  });

  it("persists dismissal for that user only", () => {
    writeProfileNudgeDismissed("user-1");
    expect(readProfileNudgeDismissed("user-1")).toBe(true);
    expect(readProfileNudgeDismissed("user-2")).toBe(false);
    expect(
      window.sessionStorage.getItem(
        `${PROFILE_NUDGE_DISMISS_KEY_PREFIX}user-1`,
      ),
    ).toBe("1");
  });
});
