"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  OAUTH_PROVIDER_LABELS,
  type OAuthProviderId,
} from "@/lib/auth/oauth-providers";

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.55-5.17 3.55-8.65Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.47 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.3A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.3V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.33.6 4.57 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
      <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

function ProviderIcon({ provider }: { provider: OAuthProviderId }) {
  if (provider === "google") return <GoogleMark />;
  if (provider === "github") return <GitHubMark />;
  return <MicrosoftMark />;
}

export function OAuthButtons({
  providers,
  nextPath,
}: {
  providers: OAuthProviderId[];
  nextPath: string;
}) {
  if (providers.length === 0) return null;

  const callbackUrl = nextPath
    ? `/auth/continue?next=${encodeURIComponent(nextPath)}`
    : "/auth/continue";

  return (
    <div className="flex gap-3">
      {providers.map((provider) => {
        const label = OAUTH_PROVIDER_LABELS[provider];
        return (
          <Button
            key={provider}
            type="button"
            variant="outline"
            className="h-11 flex-1 border-neutral-300 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-white/[0.06]"
            aria-label={label}
            title={label}
            onClick={() => {
              void signIn(provider, { callbackUrl });
            }}
          >
            <ProviderIcon provider={provider} />
          </Button>
        );
      })}
    </div>
  );
}

export function AuthMethodDivider() {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-neutral-200 dark:bg-white/15" />
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        or
      </span>
      <span className="h-px flex-1 bg-neutral-200 dark:bg-white/15" />
    </div>
  );
}
