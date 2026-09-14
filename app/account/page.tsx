import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  AccountCard,
  AccountPageHeader,
} from "@/components/account/account-chrome";
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
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <AccountPageHeader
        eyebrow="Good Code"
        title="Account"
        description="Keep your details up to date so estimates and follow-ups use the right contact information."
      />

      <div className="mt-10 space-y-6">
        <AccountCard
          title="Profile"
          description="Your business card for planning estimates. Optional fields can stay blank."
        >
          <CustomerProfileForm />
        </AccountCard>

        <AccountCard
          title="Password"
          description={
            hasPassword
              ? "You will stay signed in after the change."
              : "You sign in with Google, GitHub, or Microsoft, so there is no password to change here."
          }
        >
          {hasPassword ? <ChangePasswordForm /> : null}
        </AccountCard>
      </div>
    </main>
  );
}
