import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Admin account",
  robots: { index: false, follow: false },
};

export default async function AdminAccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?next=/admin/account");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Account
        </h1>
        <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Update your admin password. You will stay signed in after the change.
        </p>
      </header>
      <dl className="space-y-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Email
        </dt>
        <dd className="text-sm text-neutral-900 dark:text-neutral-100">
          {session.user.email ?? "—"}
        </dd>
      </dl>
      <ChangePasswordForm endpoint="/api/admin/account/password" />
    </div>
  );
}
