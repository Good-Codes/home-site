import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <main className="container mx-auto max-w-md px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Good Code
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        This link can only be used once and expires after one hour.
      </p>
      <div className="mt-8">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              This reset link is missing or invalid. Request a new one.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <Link
                href="/forgot-password"
                className="font-medium text-[#2f6f69] underline-offset-2 hover:underline dark:text-[#9ed9d2]"
              >
                Forgot password
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
