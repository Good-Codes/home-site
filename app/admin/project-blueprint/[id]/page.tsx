"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { BrandButton } from "@/components/project-blueprint/ui";
import type { AdminEstimateDetail } from "@/lib/project-blueprint/admin/demo-data";
import { formatZarRange, formatWeeks } from "@/lib/project-blueprint/format";

export default function AdminEstimateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [estimate, setEstimate] = useState<AdminEstimateDetail | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/admin/project-blueprint/estimates/${encodeURIComponent(id)}`,
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Unable to load estimate.",
          );
        }
        if (cancelled) return;
        setEstimate(data.estimate ?? null);
        setWarning(typeof data.warning === "string" ? data.warning : null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load estimate.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading estimate…</p>;
  }

  if (error || !estimate) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error ?? "Estimate not found."}
        </p>
        <BrandButton href="/admin/project-blueprint" variant="outline">
          Back to inbox
        </BrandButton>
      </div>
    );
  }

  const recommended = estimate.publicResult.recommendedScenario;
  const rangeText = formatZarRange(
    recommended.range,
    (recommended as { rangeDisplay?: string }).rangeDisplay,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
            Estimate detail
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {estimate.answersSummary.headline}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {estimate.id} · {estimate.status.replace(/_/g, " ")} ·{" "}
            {new Date(estimate.createdAt).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <BrandButton href="/admin/project-blueprint" variant="outline">
            Inbox
          </BrandButton>
          <BrandButton href={`/admin/project-blueprint/${estimate.id}/quote`}>
            Request quote
          </BrandButton>
        </div>
      </div>

      {warning || estimate.usingPlaceholderConfiguration ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
          role="status"
        >
          {warning ??
            "PLACEHOLDER rates — do not treat this planning estimate as calibrated commercial pricing."}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold">Client</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Name</dt>
              <dd>{estimate.client.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Email</dt>
              <dd>{estimate.client.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Company</dt>
              <dd>{estimate.client.company ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Phone</dt>
              <dd>{estimate.client.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Preferred next step</dt>
              <dd className="capitalize">
                {estimate.client.preferredNextStep?.replace(/_/g, " ") ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold">Public result</h2>
          <p className="mt-4 text-3xl font-semibold tracking-tight">{rangeText}</p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            {formatWeeks(
              recommended.timeline.minimumWeeks,
              recommended.timeline.likelyWeeks,
              recommended.timeline.maximumWeeks,
            )}{" "}
            · Confidence: {estimate.publicResult.confidence.level}
          </p>
          <p className="mt-4 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            {estimate.publicResult.nextStepRecommendation}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold">Answers summary</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {estimate.answersSummary.sections.map((section) => (
            <div key={section.id}>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {section.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {section.body}
              </p>
            </div>
          ))}
        </div>
        {estimate.answersSummary.unknowns.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold">Unknowns</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
              {estimate.answersSummary.unknowns.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold">Risk flags</h2>
        {estimate.riskFlags.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No risk flags raised.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {estimate.riskFlags.map((flag) => (
              <li key={flag.id} className="text-sm">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {flag.title}
                </p>
                <p className="mt-1 leading-6 text-neutral-600 dark:text-neutral-300">
                  {flag.explanation}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
