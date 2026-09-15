import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="container mx-auto max-w-md px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Good Code
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Forgot password
      </h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        Enter the email for your account. If it matches an active account, we
        will send a link to choose a new password.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
