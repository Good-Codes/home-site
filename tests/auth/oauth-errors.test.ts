import { describe, expect, it } from "vitest";

import { oauthErrorMessage } from "@/lib/auth/oauth-errors";

describe("oauthErrorMessage", () => {
  it("maps known Auth.js and app error codes", () => {
    expect(oauthErrorMessage("oauth_email")).toMatch(/verified email/i);
    expect(oauthErrorMessage("oauth_denied")).toMatch(/isn’t available/i);
    expect(oauthErrorMessage("Configuration")).toMatch(/not configured/i);
    expect(oauthErrorMessage("OAuthCallback")).toMatch(/didn’t complete/i);
  });

  it("ignores unrelated errors", () => {
    expect(oauthErrorMessage("CredentialsSignin")).toBeNull();
    expect(oauthErrorMessage(undefined)).toBeNull();
  });
});
