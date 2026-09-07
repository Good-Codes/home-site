import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?next=/account");
  }

  return (
    <main className="container mx-auto max-w-md px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Good Code
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Account</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        Update your password. You will stay signed in after the change.
      </p>
      <dl className="mt-8 space-y-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Email
        </dt>
        <dd className="text-sm text-neutral-900 dark:text-neutral-100">
          {session.user.email ?? "—"}
        </dd>
      </dl>
      <div className="mt-8">
        <ChangePasswordForm />
      </div>
    </main>
  );
}
