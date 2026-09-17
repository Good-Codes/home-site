import { describe, expect, it } from "vitest";

import { postAuthRedirect, safeCallbackPath } from "@/lib/auth/callback-url";
import { defaultPostLoginPath } from "@/lib/auth/roles";

describe("defaultPostLoginPath", () => {
  it("sends customers to the home page", () => {
    expect(defaultPostLoginPath("CUSTOMER")).toBe("/");
    expect(defaultPostLoginPath(undefined)).toBe("/");
  });

  it("sends staff to the estimate inbox", () => {
    expect(defaultPostLoginPath("ADMIN")).toBe("/admin/project-blueprint");
  });
});

describe("postAuthRedirect", () => {
  it("uses the role default when next is missing", () => {
    expect(postAuthRedirect(null, "CUSTOMER")).toBe("/");
    expect(postAuthRedirect("", "ADMIN")).toBe("/admin/project-blueprint");
  });

  it("keeps a safe next path so gated pages still resume", () => {
    expect(postAuthRedirect("/custom-software-estimator", "CUSTOMER")).toBe(
      "/custom-software-estimator",
    );
    expect(postAuthRedirect("/account", "CUSTOMER")).toBe("/account");
  });

  it("rejects unsafe next values and falls back by role", () => {
    expect(postAuthRedirect("https://evil.example", "CUSTOMER")).toBe("/");
    expect(postAuthRedirect("//evil.example", "ADMIN")).toBe(
      "/admin/project-blueprint",
    );
  });
});

describe("safeCallbackPath", () => {
  it("falls back to home when the path is missing or unsafe", () => {
    expect(safeCallbackPath(undefined)).toBe("/");
    expect(safeCallbackPath("https://evil.example")).toBe("/");
  });
});
