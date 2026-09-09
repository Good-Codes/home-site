import "server-only";

import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

import { enabledOAuthProviders } from "./enabled-oauth-providers";
import { pickVerifiedGithubEmail } from "./oauth";

export function buildOAuthProviders(): Provider[] {
  const enabled = new Set(enabledOAuthProviders());
  const providers: Provider[] = [];

  if (enabled.has("google")) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!.trim(),
        clientSecret: process.env.AUTH_GOOGLE_SECRET!.trim(),
      }),
    );
  }

  if (enabled.has("github")) {
    providers.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID!.trim(),
        clientSecret: process.env.AUTH_GITHUB_SECRET!.trim(),
        userinfo: {
          url: "https://api.github.com/user",
          async request({ tokens }: { tokens: { access_token?: string } }) {
            const accessToken = tokens.access_token ?? "";
            const headers = {
              Authorization: `Bearer ${accessToken}`,
              "User-Agent": "authjs",
            };
            const profile = (await fetch("https://api.github.com/user", {
              headers,
            }).then((response) => response.json())) as Record<string, unknown>;

            const emailsResponse = await fetch("https://api.github.com/user/emails", {
              headers,
            });
            if (emailsResponse.ok) {
              const verifiedEmail = pickVerifiedGithubEmail(
                await emailsResponse.json(),
              );
              if (verifiedEmail) {
                profile.email = verifiedEmail;
                profile.email_verified = true;
              } else {
                profile.email = null;
                profile.email_verified = false;
              }
            } else if (!profile.email) {
              profile.email_verified = false;
            }

            return profile;
          },
        },
      }),
    );
  }

  if (enabled.has("microsoft-entra-id")) {
    const issuer = process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER?.trim();
    providers.push(
      MicrosoftEntraID({
        clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!.trim(),
        clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!.trim(),
        ...(issuer ? { issuer } : {}),
      }),
    );
  }

  return providers;
}
