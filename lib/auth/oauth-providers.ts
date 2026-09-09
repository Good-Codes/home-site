export const OAUTH_PROVIDER_IDS = [
  "google",
  "github",
  "microsoft-entra-id",
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDER_IDS)[number];

export const OAUTH_PROVIDER_LABELS: Record<OAuthProviderId, string> = {
  google: "Google",
  github: "GitHub",
  "microsoft-entra-id": "Microsoft",
};

