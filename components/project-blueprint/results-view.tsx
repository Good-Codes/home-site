"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { smoothEase } from "@/lib/motion";
import type {
  IntakeConcept,
  MoneyRange,
  PublicEstimateResult,
  PublicScenarioResult,
  ScenarioKind,
} from "@/lib/project-blueprint/types";
import { formatWeeks, formatZarRange } from "@/lib/project-blueprint/format";
import { BrandButton, optionCardClass, optionCardSelectedClass } from "./ui";
import { LeadForm } from "./lead-form";

/** Accept shared PublicEstimateResult plus engine-shaped extras from the API. */
export type EstimateResultViewModel = PublicEstimateResult & {
  recommendedNextStep?: string;
  concept?: IntakeConcept;
  discoveryFirst?: {
    recommended?: boolean;
    summary?: string;
    offering?: string[];
    discoveryRangeDisplay?: string;
  };
};

type ResultsViewProps = {
  result: EstimateResultViewModel;
  estimateId?: string | null;
  initiallySaved?: boolean;
  onRecalculate?: () => void;
};

function scenarioRange(scenario: PublicScenarioResult): string {
  return formatZarRange(scenario.range);
}

function confidenceLabel(level: string): string {
  if (level === "high") return "High confidence";
  if (level === "moderate") return "Moderate confidence";
  return "Early-stage estimate";
}

function asMoney(value: MoneyRange | { share: number }): MoneyRange | null {
  if ("low" in value && "high" in value) return value;
  return null;
}

export function ResultsView({
  result,
  estimateId,
  initiallySaved = false,
  onRecalculate,
}: ResultsViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeScenario, setActiveScenario] = useState<ScenarioKind>(
    result.recommendedScenario.id,
  );
  const [showLead, setShowLead] = useState(false);
  const [saved, setSaved] = useState(initiallySaved);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSaved(initiallySaved);
  }, [initiallySaved, estimateId]);

  const allScenarios: PublicScenarioResult[] = [
    result.recommendedScenario,
    ...result.alternativeScenarios.filter(
      (s) => s.id !== result.recommendedScenario.id,
    ),
  ];

  const selected =
    allScenarios.find((s) => s.id === activeScenario) ?? result.recommendedScenario;

  const nextStep =
    result.nextStepRecommendation ||
    result.recommendedNextStep ||
    "Book a short conversation so a Good Code specialist can review the scope.";

  const saveToProfile = async () => {
    if (!estimateId || saved || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/account/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.status === 409) {
        setSaveError(
          data.error ||
            "You already have 5 saved estimates. Delete one from your account to save another.",
        );
        return;
      }
      if (!response.ok) {
        setSaveError(data.error || "Unable to save this estimate right now.");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const discovery =
    result.discoveryRecommended || result.discoveryFirst?.recommended;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: smoothEase }}
      className="space-y-12"
    >
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
          Indicative planning estimate
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-4xl">
          {result.productSummary}
        </h2>
        {result.concept?.summary ? (
          <p className="max-w-2xl text-base leading-7 text-neutral-700 dark:text-neutral-300">
            {result.concept.summary}
          </p>
        ) : null}
        {result.concept?.whoItsFor ? (
          <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            For: {result.concept.whoItsFor}
          </p>
        ) : null}
        <p className="max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          This range is based on the scope and assumptions shown below. A Good
          Code specialist will review the technical details before issuing a
          formal quotation.
        </p>
      </header>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-8">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Recommended investment range
        </p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
          {scenarioRange(selected)}
        </p>
        <p className="mt-3 text-base text-neutral-600 dark:text-neutral-300">
          Likely delivery window:{" "}
          {formatWeeks(
            selected.timeline.minimumWeeks,
            selected.timeline.likelyWeeks,
            selected.timeline.maximumWeeks,
          )}
        </p>
        <p className="mt-2 text-sm font-medium text-[#2f6f69] dark:text-[#9ed9d2]">
          {confidenceLabel(result.confidence.level)}
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {result.confidence.explanation}
        </p>
        {result.usingPlaceholderConfiguration ? (
          <p className="mt-4 text-xs text-neutral-500">
            Indicative planning estimate — a specialist reviews the scope before
            a formal quotation.
          </p>
        ) : null}
      </div>

      {discovery ? (
        <div className="rounded-lg border border-[#67AFA7]/40 bg-[#67AFA7]/10 p-5">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Begin with discovery
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            {result.discoverySummary ||
              result.discoveryFirst?.summary ||
              "A discovery phase would let us replace open assumptions with verified requirements."}
          </p>
          {result.discoveryFirst?.discoveryRangeDisplay ? (
            <p className="mt-3 text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Discovery planning range: {result.discoveryFirst.discoveryRangeDisplay}
            </p>
          ) : null}
        </div>
      ) : null}

      {result.concept?.coreCapabilities?.length ? (
        <section className="space-y-3">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Concept we estimated
          </h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {result.concept.coreCapabilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {allScenarios.length > 1 ? (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Scope scenarios
          </h3>
          <div className="grid gap-3 md:grid-cols-3" role="tablist" aria-label="Estimate scenarios">
            {allScenarios.map((scenario) => {
              const active = scenario.id === selected.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveScenario(scenario.id)}
                  className={cn(
                    optionCardClass,
                    active && optionCardSelectedClass,
                    "h-full",
                  )}
                >
                  <span className="block text-base font-semibold">{scenario.name}</span>
                  <span className="mt-2 block text-lg font-semibold text-[#2f6f69] dark:text-[#9ed9d2]">
                    {scenarioRange(scenario)}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {scenario.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {result.phaseBreakdown.length > 0 ? (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Cost by phase
          </h3>
          <ul className="space-y-3">
            {result.phaseBreakdown.map((phase) => {
              const money = asMoney(phase.allocation);
              const share =
                "share" in phase.allocation ? phase.allocation.share : null;
              return (
                <li
                  key={phase.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-3 dark:border-white/10"
                >
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {phase.name}
                    </p>
                    {phase.description ? (
                      <p className="text-sm text-neutral-500">{phase.description}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {money
                      ? formatZarRange(money)
                      : share !== null
                        ? `${Math.round(share * 100)}%`
                        : "—"}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Biggest cost drivers
        </h3>
        <ul className="grid gap-3 md:grid-cols-2">
          {result.costDrivers.map((driver) => (
            <li key={driver.id} className={optionCardClass}>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                {driver.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {driver.explanation}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Assumptions
          </h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {result.assumptions.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Exclusions
          </h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {result.exclusions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {result.confidence.unknowns.length > 0 && (
            <>
              <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                What would improve confidence
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {(result.confidence.improvements.length
                  ? result.confidence.improvements
                  : result.confidence.unknowns
                ).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-white/10 dark:bg-white/[0.03]">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Recommended next step
        </h3>
        <p className="mt-2 max-w-2xl text-base leading-7 text-neutral-700 dark:text-neutral-300">
          {nextStep}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <BrandButton type="button" onClick={() => setShowLead(true)}>
            Email me this estimate
          </BrandButton>
          <BrandButton
            type="button"
            variant="outline"
            disabled={!estimateId || saved || saving}
            onClick={() => void saveToProfile()}
          >
            {saved
              ? "Saved to your profile"
              : saving
                ? "Saving…"
                : "Save to my profile"}
          </BrandButton>
          <BrandButton href="/contact-us" variant="outline">
            Talk to the team
          </BrandButton>
          {onRecalculate ? (
            <BrandButton type="button" variant="outline" onClick={onRecalculate}>
              Adjust the idea
            </BrandButton>
          ) : null}
        </div>
        {saveError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {saveError}{" "}
            <Link
              href="/account"
              className="font-medium underline-offset-2 hover:underline"
            >
              Open account
            </Link>
          </p>
        ) : null}
      </section>

      {showLead ? (
        <LeadForm
          estimateId={result.estimateId}
          onClose={() => setShowLead(false)}
        />
      ) : null}
    </motion.div>
  );
}
