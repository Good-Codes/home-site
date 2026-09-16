import { afterEach, describe, expect, it } from "vitest";

import {
  checkAuthRateLimit,
  clientKeyFromHeaders,
  resetAuthRateLimitForTests,
} from "@/lib/auth/rate-limit";

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("clientKeyFromHeaders", () => {
  it("prefers x-real-ip over a spoofed x-forwarded-for", () => {
    const withSpoof = clientKeyFromHeaders(
      headers({
        "x-real-ip": "203.0.113.10",
        "x-forwarded-for": "9.9.9.9, 203.0.113.10",
      }),
    );
    const realOnly = clientKeyFromHeaders(
      headers({ "x-real-ip": "203.0.113.10" }),
    );
    const spoofOnly = clientKeyFromHeaders(
      headers({ "x-forwarded-for": "9.9.9.9" }),
    );
    expect(withSpoof).toBe(realOnly);
    expect(withSpoof).not.toBe(spoofOnly);
  });

  it("uses the last x-forwarded-for hop when x-real-ip is absent", () => {
    const chain = clientKeyFromHeaders(
      headers({ "x-forwarded-for": "9.9.9.9, 198.51.100.7" }),
    );
    const lastOnly = clientKeyFromHeaders(
      headers({ "x-forwarded-for": "198.51.100.7" }),
    );
    const firstOnly = clientKeyFromHeaders(
      headers({ "x-forwarded-for": "9.9.9.9" }),
    );
    expect(chain).toBe(lastOnly);
    expect(chain).not.toBe(firstOnly);
  });

  it("returns a stable HMAC and never the raw IP", () => {
    const first = clientKeyFromHeaders(
      headers({ "x-real-ip": "203.0.113.10" }),
    );
    const second = clientKeyFromHeaders(
      headers({ "x-real-ip": "203.0.113.10" }),
    );
    const other = clientKeyFromHeaders(
      headers({ "x-real-ip": "203.0.113.11" }),
    );
    expect(first).toBe(second);
    expect(first).not.toBe(other);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain("203.0.113.10");
  });

  it("does not use a shared anonymous bucket when headers are missing", () => {
    const mozilla = clientKeyFromHeaders(
      headers({
        "user-agent": "Mozilla/5.0 TestA",
        "accept-language": "en-ZA",
      }),
    );
    const other = clientKeyFromHeaders(
      headers({
        "user-agent": "Mozilla/5.0 TestB",
        "accept-language": "en-ZA",
      }),
    );
    expect(mozilla).not.toBe("anonymous");
    expect(other).not.toBe("anonymous");
    expect(mozilla).not.toBe(other);
    expect(mozilla).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("checkAuthRateLimit", () => {
  afterEach(() => {
    resetAuthRateLimitForTests();
  });

  it("keeps IP and email buckets independent with a custom max", () => {
    for (let i = 0; i < 3; i += 1) {
      expect(checkAuthRateLimit("signup:ip:office", 3)).toBe(true);
    }
    expect(checkAuthRateLimit("signup:ip:office", 3)).toBe(false);
    expect(checkAuthRateLimit("signup:email:ada@example.com")).toBe(true);
  });

  it("still caps the default login-style key at 10", () => {
    for (let i = 0; i < 10; i += 1) {
      expect(checkAuthRateLimit("login:key:ada@example.com")).toBe(true);
    }
    expect(checkAuthRateLimit("login:key:ada@example.com")).toBe(false);
  });
});
