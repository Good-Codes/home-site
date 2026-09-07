import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";
import { safeCallbackPath } from "@/lib/auth/callback-url";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
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
        Sign up to describe your product and receive a planning estimate.
      </p>
      <div className="mt-8">
        <SignupForm nextPath={nextPath} />
      </div>
    </main>
  );
}
