import { afterEach, describe, expect, it } from "vitest";

import { enabledOAuthProviders } from "@/lib/auth/enabled-oauth-providers";

const KEYS = [
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
  "AUTH_MICROSOFT_ENTRA_ID_ID",
  "AUTH_MICROSOFT_ENTRA_ID_SECRET",
] as const;

describe("enabledOAuthProviders", () => {
  const previous = new Map<string, string | undefined>();

  afterEach(() => {
    for (const key of KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    previous.clear();
  });

  function setEnv(values: Partial<Record<(typeof KEYS)[number], string>>) {
    for (const key of KEYS) {
      if (!previous.has(key)) {
        previous.set(key, process.env[key]);
      }
      const next = values[key];
      if (next === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = next;
      }
    }
  }

  it("returns nothing when secrets are missing", () => {
    setEnv({});
    expect(enabledOAuthProviders()).toEqual([]);
  });

  it("includes only providers with both id and secret", () => {
    setEnv({
      AUTH_GOOGLE_ID: "google-id",
      AUTH_GOOGLE_SECRET: "google-secret",
      AUTH_GITHUB_ID: "github-id",
    });
    expect(enabledOAuthProviders()).toEqual(["google"]);
  });
});
