import type { Metadata } from "next";

import { AccountDeleted } from "@/components/account/account-deleted";

export const metadata: Metadata = {
  title: "Profile removed",
  description: "Your Good Code profile has been deleted.",
  robots: { index: false, follow: false },
};

export default function AccountDeletedPage() {
  return (
    <main>
      <AccountDeleted />
    </main>
  );
}
