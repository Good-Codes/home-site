import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getOwnedCalculatedEstimate } from "@/lib/account/estimates";
import { sanitizePublicResult } from "@/lib/project-blueprint/estimate/sanitize-public";
import { ResultsView } from "@/components/project-blueprint/results-view";
import type { EstimateResultViewModel } from "@/components/project-blueprint/results-view";
import { parseIntakeConcept } from "@/lib/project-blueprint/types";
import { isStaffRole } from "@/lib/auth/roles";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Saved estimate",
  robots: { index: false, follow: false },
};

export default async function SavedEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/account");
  }
  if (isStaffRole(session.user.role)) {
    redirect("/admin/account");
  }

  const { id } = await params;
  const estimate = await getOwnedCalculatedEstimate({
    userId: session.user.id,
    estimateId: id,
    requireSavedToProfile: true,
  });
  const latest = estimate?.results[0];
  if (!estimate || !latest?.publicResult || typeof latest.publicResult !== "object") {
    notFound();
  }

  const result: EstimateResultViewModel = {
    ...sanitizePublicResult(latest.publicResult as Record<string, unknown>),
    concept: parseIntakeConcept(estimate.concept),
  };

  return (
    <main className="container mx-auto max-w-7xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Saved estimate
      </p>
      <ResultsView
        result={result}
        estimateId={estimate.id}
        savedToProfile
        showDelete
      />
    </main>
  );
}
