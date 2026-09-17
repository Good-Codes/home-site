import { describe, expect, it } from "vitest";

import {
  ACCOUNT_DELETED_PATH,
  isProfileNudgeHiddenPath,
  isProtectedCustomerAccountPath,
} from "@/lib/account/paths";

describe("account paths", () => {
  it("protects the customer account area without capturing the deleted confirmation", () => {
    expect(isProtectedCustomerAccountPath("/account")).toBe(true);
    expect(isProtectedCustomerAccountPath("/account/estimates/abc")).toBe(true);
    expect(isProtectedCustomerAccountPath(ACCOUNT_DELETED_PATH)).toBe(false);
    expect(isProtectedCustomerAccountPath("/")).toBe(false);
  });

  it("hides the profile nudge on account, auth, and admin screens", () => {
    expect(isProfileNudgeHiddenPath("/")).toBe(false);
    expect(isProfileNudgeHiddenPath("/custom-software-estimator")).toBe(false);
    expect(isProfileNudgeHiddenPath("/account")).toBe(true);
    expect(isProfileNudgeHiddenPath("/account/estimates/abc")).toBe(true);
    expect(isProfileNudgeHiddenPath(ACCOUNT_DELETED_PATH)).toBe(true);
    expect(isProfileNudgeHiddenPath("/login")).toBe(true);
    expect(isProfileNudgeHiddenPath("/admin/project-blueprint")).toBe(true);
  });
});
