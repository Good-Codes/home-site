import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { safeCallbackPath } from "@/lib/auth/callback-url";
import { oauthErrorMessage } from "@/lib/auth/oauth-errors";
import { enabledOAuthProviders } from "@/lib/auth/enabled-oauth-providers";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next ? safeCallbackPath(params.next) : "";

  return (
    <main className="container mx-auto max-w-md px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Good Code
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        Use your account to open the custom software estimator or the staff
        inbox.
      </p>
      <div className="mt-8">
        <LoginForm
          nextPath={nextPath}
          oauthProviders={enabledOAuthProviders()}
          oauthError={oauthErrorMessage(params.error)}
        />
      </div>
    </main>
  );
}
