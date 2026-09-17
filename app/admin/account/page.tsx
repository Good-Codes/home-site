import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  AccountCard,
  AccountPageHeader,
  ReadonlyField,
} from "@/components/account/account-chrome";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { userHasPassword } from "@/lib/auth/change-password";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Admin account",
  robots: { index: false, follow: false },
};

export default async function AdminAccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/admin/account");
  }

  const hasPassword = await userHasPassword(session.user.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <AccountPageHeader
        title="Account"
        description="Your staff sign-in for the estimate inbox."
      />

      <AccountCard title="Sign-in">
        <ReadonlyField
          label="Email"
          value={session.user.email ?? "—"}
          hint="This is your staff login and cannot be changed here."
        />
      </AccountCard>

      {hasPassword ? (
        <AccountCard
          title="Password"
          description="Use a long password. You will stay signed in after the change."
        >
          <ChangePasswordForm endpoint="/api/admin/account/password" />
        </AccountCard>
      ) : (
        <AccountCard title="Password">
          <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            You sign in with Google, GitHub, or Microsoft. A password can be
            set from Users if you need email sign-in.
          </p>
        </AccountCard>
      )}
    </div>
  );
}
