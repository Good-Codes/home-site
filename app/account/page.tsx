import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SavedEstimatesList } from "@/components/account/saved-estimates-list";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { listSavedProfileEstimates } from "@/lib/account/estimates";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/account");
  }

  const estimates = await listSavedProfileEstimates(session.user.id);

  return (
    <main className="container mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Good Code
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Account</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        Update your password and manage up to five saved estimates.
      </p>
      <dl className="mt-8 space-y-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Email
        </dt>
        <dd className="text-sm text-neutral-900 dark:text-neutral-100">
          {session.user.email ?? "—"}
        </dd>
      </dl>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Saved estimates</h2>
        <SavedEstimatesList estimates={estimates} />
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Password</h2>
        <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          You will stay signed in after the change.
        </p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
