import React from "react";
import type { Metadata } from "next";

import { auth } from "@/auth";
import Contact from "@/components/contact";
import { listSavedEstimates } from "@/lib/account/estimates";
import { isStaffRole } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Good Code. Tell us about your project and receive a free quote for web, mobile, or cloud development.",
};

export default async function ContactPage() {
  const session = await auth();
  const savedEstimates =
    session?.user?.id && !isStaffRole(session.user.role)
      ? await listSavedEstimates(session.user.id)
      : [];

  return (
    <main>
      <Contact savedEstimates={savedEstimates} />
    </main>
  );
}
