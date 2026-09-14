import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { CustomerProfileForm } from "@/components/account/customer-profile-form";
import { userHasPassword } from "@/lib/auth/change-password";
import { isStaffRole } from "@/lib/auth/roles";
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
  if (isStaffRole(session.user.role)) {
    redirect("/admin/account");
  }

  const hasPassword = await userHasPassword(session.user.id);

  return (
    <main className="container mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Good Code
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Account</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        Keep your details up to date so estimates and follow-ups use the right
        contact information.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
        <CustomerProfileForm />
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Password</h2>
        {hasPassword ? (
          <>
            <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              You will stay signed in after the change.
            </p>
            <ChangePasswordForm />
          </>
        ) : (
          <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            You sign in with Google, GitHub, or Microsoft, so there is no
            password to change here.
          </p>
        )}
      </section>
    </main>
  );
}
