import { afterEach, describe, expect, it, vi } from "vitest";

import { useSecureAuthCookies } from "@/lib/auth/secure-cookies";

describe("useSecureAuthCookies", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is off for local Docker HTTP even in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_URL", "http://127.0.0.1:3002");
    vi.stubEnv("NEXTAUTH_URL", "");
    expect(useSecureAuthCookies()).toBe(false);
  });

  it("is on for https origins", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_URL", "https://www.goodcode.co.za");
    expect(useSecureAuthCookies()).toBe(true);
  });
});
