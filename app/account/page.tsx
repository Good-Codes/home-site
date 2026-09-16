import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  AccountCard,
  AccountPageHeader,
} from "@/components/account/account-chrome";
import { SavedEstimatesList } from "@/components/account/saved-estimates-list";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { CustomerProfileForm } from "@/components/account/customer-profile-form";
import { DeleteAccountCard } from "@/components/account/delete-account-card";
import { listSavedEstimates } from "@/lib/account/estimates";
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
  const savedEstimates = await listSavedEstimates(session.user.id);

  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <AccountPageHeader
        eyebrow="Good Code"
        title="Account"
        description="Keep your details up to date so estimates and follow-ups use the right contact information."
      />

      <div className="mt-10 space-y-6">
        <AccountCard
          title="Saved estimates"
          description="Keep up to five planning estimates here. Removing one only hides it from this list — it stays in the Good Code inbox."
        >
          <SavedEstimatesList estimates={savedEstimates} />
        </AccountCard>

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

        <AccountCard
          title="Delete account"
          description="This cannot be undone. Estimates stay with Good Code."
        >
          <DeleteAccountCard />
        </AccountCard>
      </div>
    </main>
  );
}
