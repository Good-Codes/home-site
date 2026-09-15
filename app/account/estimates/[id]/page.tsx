import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getOwnedCalculatedEstimate } from "@/lib/account/estimates";
import { sanitizePublicResult } from "@/lib/project-blueprint/estimate/sanitize-public";
import { ResultsView } from "@/components/project-blueprint/results-view";
import type { EstimateResultViewModel } from "@/components/project-blueprint/results-view";
import type { IntakeConcept } from "@/lib/project-blueprint/types";
import { isStaffRole } from "@/lib/auth/roles";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Saved estimate",
  robots: { index: false, follow: false },
};

function asConcept(value: unknown): IntakeConcept | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const headline = typeof row.headline === "string" ? row.headline : "";
  if (!headline) return undefined;
  return {
    headline,
    summary: typeof row.summary === "string" ? row.summary : "",
    whoItsFor: typeof row.whoItsFor === "string" ? row.whoItsFor : "",
    coreCapabilities: Array.isArray(row.coreCapabilities)
      ? row.coreCapabilities.filter((item): item is string => typeof item === "string")
      : [],
    assumptions: Array.isArray(row.assumptions)
      ? row.assumptions.filter((item): item is string => typeof item === "string")
      : [],
  };
}

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
    concept: asConcept(estimate.concept),
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
