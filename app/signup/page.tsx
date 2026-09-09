import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";
import { safeCallbackPath } from "@/lib/auth/callback-url";
import { oauthErrorMessage } from "@/lib/auth/oauth-errors";
import { enabledOAuthProviders } from "@/lib/auth/enabled-oauth-providers";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const oauthProviders = enabledOAuthProviders();
  const nextPath = params.next ? safeCallbackPath(params.next) : "";

  return (
    <main className="container mx-auto max-w-md px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Good Code
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Create an account
      </h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        {oauthProviders.length > 0
          ? "Continue with Google, GitHub, or Microsoft — or create an email account to describe your product and receive a planning estimate."
          : "Sign up to describe your product and receive a planning estimate."}
      </p>
      <div className="mt-8">
        <SignupForm
          nextPath={nextPath}
          oauthProviders={oauthProviders}
          oauthError={oauthErrorMessage(params.error)}
        />
      </div>
    </main>
  );
}
