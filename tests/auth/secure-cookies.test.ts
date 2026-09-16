import { afterEach, describe, expect, it } from "vitest";

import { useSecureAuthCookies } from "@/lib/auth/secure-cookies";

describe("useSecureAuthCookies", () => {
  const previous = {
    AUTH_URL: process.env.AUTH_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  afterEach(() => {
    restore("AUTH_URL", previous.AUTH_URL);
    restore("NEXTAUTH_URL", previous.NEXTAUTH_URL);
    if (previous.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previous.NODE_ENV;
    }
  });

  it("is off for local Docker HTTP even in production", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_URL = "http://127.0.0.1:3002";
    delete process.env.NEXTAUTH_URL;
    expect(useSecureAuthCookies()).toBe(false);
  });

  it("is on for https origins", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_URL = "https://www.goodcode.co.za";
    expect(useSecureAuthCookies()).toBe(true);
  });
});

function restore(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
