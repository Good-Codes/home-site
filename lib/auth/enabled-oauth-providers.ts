import "server-only";

import {
  type OAuthProviderId,
} from "./oauth-providers";

function envPair(idKey: string, secretKey: string): boolean {
  return Boolean(process.env[idKey]?.trim() && process.env[secretKey]?.trim());
}

export function enabledOAuthProviders(): OAuthProviderId[] {
  const enabled: OAuthProviderId[] = [];
  if (envPair("AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET")) {
    enabled.push("google");
  }
  if (envPair("AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET")) {
    enabled.push("github");
  }
  if (
    envPair("AUTH_MICROSOFT_ENTRA_ID_ID", "AUTH_MICROSOFT_ENTRA_ID_SECRET")
  ) {
    enabled.push("microsoft-entra-id");
  }
  return enabled;
}
