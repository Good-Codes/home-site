"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { smoothEase } from "@/lib/motion";
import { normalizeAnswers } from "@/lib/project-blueprint/answers";
import { buildReviewSummary } from "@/lib/project-blueprint/summary";
import type {
  IntakeConcept,
  MoneyRange,
  PhaseBreakdownItem,
  ProjectBlueprintAnswers,
  PublicAssumption,
  PublicScenarioResult,
  ScenarioKind,
} from "@/lib/project-blueprint/types";
import { ProjectBlueprintHero } from "./hero";
import { ReviewScreen } from "./review-screen";
import { ResultsView, type EstimateResultViewModel } from "./results-view";
import { DescribeMode } from "./describe-mode";

type Phase = "hero" | "describe" | "review" | "results";
type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVE_DEBOUNCE_MS = 700;

function emptyAnswers(): ProjectBlueprintAnswers {
  return normalizeAnswers({});
}

function asScenarioKind(id: string): ScenarioKind {
  if (id === "scale" || id === "scale_ready") return "scale";
  if (id === "lean") return "lean";
  return "recommended";
}

function moneyRange(value: unknown): MoneyRange {
  if (
    value &&
    typeof value === "object" &&
    "low" in value &&
    "likely" in value &&
    "high" in value
  ) {
    const v = value as MoneyRange;
    return { low: Number(v.low) || 0, likely: Number(v.likely) || 0, high: Number(v.high) || 0 };
  }
  return { low: 0, likely: 0, high: 0 };
}

/** Normalise calculate API payloads into the shared public result shape. */
function normalizeEstimateResult(
  raw: Record<string, unknown>,
  answers: ProjectBlueprintAnswers,
  concept?: IntakeConcept | null,
): EstimateResultViewModel {
  const summary = buildReviewSummary(answers);
  const recommendedRaw = (raw.recommendedScenario ?? {}) as Record<string, unknown>;
  const alternativesRaw = Array.isArray(raw.alternativeScenarios)
    ? (raw.alternativeScenarios as Record<string, unknown>[])
    : [];

  const mapScenario = (s: Record<string, unknown>): PublicScenarioResult => ({
    id: asScenarioKind(String(s.id ?? "recommended")),
    name: String(s.name ?? "Scenario"),
    summary: String(s.summary ?? s.description ?? ""),
    includedCapabilityIds: Array.isArray(s.includedCapabilityIds)
      ? (s.includedCapabilityIds as string[])
      : Array.isArray(s.includedCapabilities)
        ? (s.includedCapabilities as string[])
        : [],
    excludedCapabilityIds: Array.isArray(s.excludedCapabilityIds)
      ? (s.excludedCapabilityIds as string[])
      : undefined,
    range: moneyRange(s.range),
    timeline: {
      minimumWeeks: Number((s.timeline as { minimumWeeks?: number } | undefined)?.minimumWeeks) || 0,
      likelyWeeks: Number((s.timeline as { likelyWeeks?: number } | undefined)?.likelyWeeks) || 0,
      maximumWeeks: (s.timeline as { maximumWeeks?: number } | undefined)?.maximumWeeks,
    },
  });

  const recommended = mapScenario(recommendedRaw);

  const phasesRaw = Array.isArray(raw.phaseBreakdown)
    ? (raw.phaseBreakdown as Record<string, unknown>[])
    : [];

  const phaseBreakdown: PhaseBreakdownItem[] = phasesRaw.map((phase, index) => {
    const allocation =
      phase.allocation && typeof phase.allocation === "object"
        ? (phase.allocation as MoneyRange | { share: number })
        : phase.range
          ? moneyRange(phase.range)
          : { share: Number(phase.shareOfLikely) || 0 };
    return {
      id: String(phase.id ?? phase.phase ?? `phase-${index}`),
      name: String(phase.name ?? phase.phase ?? `Phase ${index + 1}`),
      description:
        typeof phase.description === "string" ? phase.description : undefined,
      allocation,
    };
  });

  const driversRaw = Array.isArray(raw.costDrivers)
    ? (raw.costDrivers as Record<string, unknown>[])
    : [];

  const confidenceRaw = (raw.confidence ?? {}) as Record<string, unknown>;
  const assumptionsRaw = Array.isArray(raw.assumptions) ? raw.assumptions : [];

  const assumptions: PublicAssumption[] = assumptionsRaw.map((item, index) => {
    if (typeof item === "string") {
      return { id: `assumption-${index}`, text: item };
    }
    const obj = item as Record<string, unknown>;
    return {
      id: String(obj.id ?? `assumption-${index}`),
      text: String(obj.text ?? ""),
      source: obj.source as PublicAssumption["source"],
    };
  });

  const discoveryFirst = raw.discoveryFirst as
    | EstimateResultViewModel["discoveryFirst"]
    | undefined;

  return {
    estimateId: String(raw.estimateId ?? "pending"),
    pricingVersion: String(raw.pricingVersion ?? "unknown"),
    currency: "ZAR",
    generatedAt: String(raw.generatedAt ?? new Date().toISOString()),
    productSummary: String(
      concept?.headline ?? raw.productSummary ?? summary.headline,
    ),
    recommendedScenario: recommended,
    alternativeScenarios: alternativesRaw.map((s) => mapScenario(s)),
    phaseBreakdown,
    costDrivers: driversRaw.map((driver, index) => ({
      id: String(driver.id ?? `driver-${index}`),
      title: String(driver.title ?? driver.label ?? "Cost driver"),
      explanation: String(driver.explanation ?? ""),
      relatedAnswerKeys: Array.isArray(driver.relatedAnswerKeys)
        ? (driver.relatedAnswerKeys as string[])
        : undefined,
    })),
    confidence: {
      level:
        confidenceRaw.level === "high" ||
        confidenceRaw.level === "moderate" ||
        confidenceRaw.level === "early"
          ? confidenceRaw.level
          : "early",
      explanation: String(
        confidenceRaw.explanation ??
          "Confidence reflects how complete and certain the answers are.",
      ),
      unknowns: Array.isArray(confidenceRaw.unknowns)
        ? (confidenceRaw.unknowns as string[])
        : summary.unknowns,
      improvements: Array.isArray(confidenceRaw.improvements)
        ? (confidenceRaw.improvements as string[])
        : [],
    },
    assumptions,
    exclusions: Array.isArray(raw.exclusions)
      ? (raw.exclusions as string[])
      : [],
    discoveryRecommended: Boolean(
      raw.discoveryRecommended ?? discoveryFirst?.recommended,
    ),
    discoverySummary:
      typeof raw.discoverySummary === "string"
        ? raw.discoverySummary
        : discoveryFirst?.summary,
    nextStepRecommendation: String(
      raw.nextStepRecommendation ??
        raw.recommendedNextStep ??
        "Talk with a Good Code specialist to refine this into a reviewed quotation.",
    ),
    usingPlaceholderConfiguration: Boolean(raw.usingPlaceholderConfiguration),
    recommendedNextStep:
      typeof raw.recommendedNextStep === "string"
        ? raw.recommendedNextStep
        : undefined,
    discoveryFirst,
    concept: concept ?? undefined,
  };
}

export function ProjectBlueprintApp() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("hero");
  const [answers, setAnswers] = useState<ProjectBlueprintAnswers>(emptyAnswers);
  const [concept, setConcept] = useState<IntakeConcept | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [result, setResult] = useState<EstimateResultViewModel | null>(null);
  const [resumeReady, setResumeReady] = useState(false);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [savedToProfile, setSavedToProfile] = useState(false);
  const [canResume, setResumeAvailable] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const estimateIdRef = useRef<string | null>(null);
  const conceptRef = useRef(concept);

  useEffect(() => {
    estimateIdRef.current = estimateId;
  }, [estimateId]);

  useEffect(() => {
    conceptRef.current = concept;
  }, [concept]);

  const persistAnswers = useCallback(async (payload: ProjectBlueprintAnswers) => {
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/project-blueprint/estimates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId: estimateIdRef.current ?? undefined,
          answers: payload,
          lastScreen: "review",
          concept: conceptRef.current,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        estimateId?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "save failed");
      if (typeof data.estimateId === "string") {
        estimateIdRef.current = data.estimateId;
        setEstimateId(data.estimateId);
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, []);

  const scheduleSave = useCallback(
    (payload: ProjectBlueprintAnswers) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persistAnswers(payload);
      }, SAVE_DEBOUNCE_MS);
    },
    [persistAnswers],
  );

  useEffect(() => {
    if (resumeReady) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/project-blueprint/estimates");
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled || !data.estimate) return;
        setEstimateId(data.estimate.id);
        setSavedToProfile(Boolean(data.estimate.savedToProfileAt));
        if (data.estimate.answers) {
          const normalised = normalizeAnswers(data.estimate.answers);
          setAnswers(normalised);
          if (data.estimate.concept) {
            setConcept(data.estimate.concept);
          }
          if (data.estimate.results?.[0]?.publicResult) {
            setResult(
              normalizeEstimateResult(
                data.estimate.results[0].publicResult,
                normalised,
                data.estimate.concept,
              ),
            );
            setResumeAvailable(true);
          } else if (normalised.ideaText) {
            setResumeAvailable(true);
          }
        }
      } catch {
        // Stay on hero if resume fails
      } finally {
        if (!cancelled) setResumeReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeReady]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const startNewEstimate = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    estimateIdRef.current = null;
    setEstimateId(null);
    setAnswers(emptyAnswers());
    setConcept(null);
    setUsedFallback(false);
    setResult(null);
    setCalcError(null);
    setSavedToProfile(false);
    setResumeAvailable(false);
    setPhase("describe");
  };

  const continueLastEstimate = () => {
    if (result) {
      setPhase("results");
      return;
    }
    if (answers.ideaText) {
      setPhase("review");
    } else {
      setPhase("describe");
    }
  };

  const buildEstimate = async () => {
    setCalculating(true);
    setCalcError(null);
    try {
      await persistAnswers(answers);
      const response = await fetch("/api/project-blueprint/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          concept,
          estimateId: estimateIdRef.current ?? undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "We could not build the estimate. Please try again.",
        );
      }
      const publicResult =
        (data.publicResult as Record<string, unknown> | undefined) ??
        (data.result as Record<string, unknown> | undefined) ??
        (data as Record<string, unknown>);
      if (typeof data.estimateId === "string") {
        setEstimateId(data.estimateId);
      }
      setResult(normalizeEstimateResult(publicResult, answers, concept));
      setPhase("results");
    } catch (err) {
      setCalcError(
        err instanceof Error ? err.message : "Estimate calculation failed.",
      );
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100">
      <AnimatePresence mode="wait">
        {phase === "hero" && (
          <motion.div
            key="hero"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3, ease: smoothEase }}
          >
            <ProjectBlueprintHero
              onStart={startNewEstimate}
              onContinue={canResume ? continueLastEstimate : undefined}
            />
          </motion.div>
        )}

        {phase === "describe" && (
          <motion.section
            key="describe"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            className="container mx-auto max-w-7xl px-6 py-16 sm:py-20"
          >
            <DescribeMode
              initialText={answers.ideaText ?? ""}
              onCancel={() => setPhase("hero")}
              onWebsiteHandoff={() => router.push("/website-pricing")}
              onReady={({ answers: nextAnswers, concept: nextConcept, usedFallback: fallback }) => {
                const normalised = normalizeAnswers(nextAnswers);
                setAnswers(normalised);
                setConcept(nextConcept);
                setUsedFallback(fallback);
                scheduleSave(normalised);
                setPhase("review");
              }}
            />
          </motion.section>
        )}

        {phase === "review" && (
          <motion.section
            key="review"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto max-w-7xl px-6 pb-28 pt-10 sm:pt-14 lg:pb-16"
          >
            <ReviewScreen
              answers={answers}
              concept={concept}
              usedFallback={usedFallback}
              onEditDescription={() => setPhase("describe")}
              onBuildEstimate={() => void buildEstimate()}
              calculating={calculating}
              error={calcError}
            />
            {saveStatus === "error" ? (
              <p className="mt-4 text-sm text-neutral-500">
                Progress could not be saved just now. You can still continue.
              </p>
            ) : null}
          </motion.section>
        )}

        {phase === "results" && result && (
          <motion.section
            key="results"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto max-w-7xl px-6 py-16 sm:py-20"
          >
            <ResultsView
              result={result}
              estimateId={estimateId}
              initiallySaved={savedToProfile}
              onRecalculate={() => {
                setPhase("review");
              }}
            />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
