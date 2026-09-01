"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { smoothEase } from "@/lib/motion";
import { normalizeAnswers } from "@/lib/project-blueprint/answers";
import {
  canProceed,
  getNextStep,
  getPreviousStep,
  getVisibleSteps,
} from "@/lib/project-blueprint/branching/journey";
import { isWebsiteRoute } from "@/lib/project-blueprint/branching/rules";
import {
  getQuestionsForScreen,
  getReviewScreenMeta,
  getScreen,
  getVisibleFollowUps,
} from "@/lib/project-blueprint/questions/catalogue";
import { buildReviewSummary } from "@/lib/project-blueprint/summary";
import type {
  MoneyRange,
  PhaseBreakdownItem,
  ProjectBlueprintAnswers,
  PublicAssumption,
  PublicScenarioResult,
  ScenarioKind,
  ScreenId,
} from "@/lib/project-blueprint/types";
import { BrandButton, optionCardClass, optionCardSelectedClass } from "./ui";
import { ProjectBlueprintHero } from "./hero";
import { StepScreen } from "./step-screen";
import { SummaryRail } from "./summary-rail";
import { ReviewScreen } from "./review-screen";
import { ResultsView, type EstimateResultViewModel } from "./results-view";
import { DescribeMode } from "./describe-mode";
import { cn } from "@/lib/utils";

type Phase = "hero" | "mode" | "describe" | "journey" | "review" | "results";
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
    productSummary: String(raw.productSummary ?? summary.headline),
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
  };
}

export function ProjectBlueprintApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("hero");
  const [answers, setAnswers] = useState<ProjectBlueprintAnswers>(emptyAnswers);
  const [currentStep, setCurrentStep] = useState<ScreenId>("route");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [proceedHints, setProceedHints] = useState<string[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [result, setResult] = useState<EstimateResultViewModel | null>(null);
  const [resumeReady, setResumeReady] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const persistAnswers = useCallback(async (payload: ProjectBlueprintAnswers) => {
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/project-blueprint/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: payload,
          currentStep,
        }),
      });
      if (!response.ok) throw new Error("save failed");
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [currentStep]);

  const scheduleSave = useCallback(
    (payload: ProjectBlueprintAnswers) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persistAnswers(payload);
      }, SAVE_DEBOUNCE_MS);
    },
    [persistAnswers],
  );

  const updateAnswers = useCallback(
    (next: ProjectBlueprintAnswers) => {
      const normalised = normalizeAnswers(next);
      setAnswers(normalised);
      setProceedHints([]);
      scheduleSave(normalised);
    },
    [scheduleSave],
  );

  // Resume via ?resume=
  useEffect(() => {
    const token = searchParams.get("resume");
    if (!token || resumeReady) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/project-blueprint/session/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        if (data.answers) {
          const normalised = normalizeAnswers(data.answers);
          setAnswers(normalised);
          if (data.currentStep) setCurrentStep(data.currentStep as ScreenId);
          if (data.result) {
            setResult(normalizeEstimateResult(data.result, normalised));
            setPhase("results");
          } else if (data.phase === "review") {
            setPhase("review");
          } else {
            setPhase("journey");
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
  }, [searchParams, resumeReady]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const goNext = () => {
    const check = canProceed(currentStep, answers);
    if (!check.ok) {
      setProceedHints(check.reasons);
      return;
    }
    if (check.routesAway === "website_packages" || isWebsiteRoute(answers)) {
      router.push("/website-pricing");
      return;
    }

    const next = getNextStep(currentStep, answers);
    if (!next) return;
    if (next.isReview) {
      setPhase("review");
      setCurrentStep("review");
      scheduleSave(answers);
      return;
    }
    setCurrentStep(next.id);
    setProceedHints([]);
    scheduleSave(answers);
  };

  const goPrevious = () => {
    if (phase === "review") {
      const visible = getVisibleSteps(answers).filter((s) => !s.isReview);
      const last = visible[visible.length - 1];
      if (last) {
        setCurrentStep(last.id);
        setPhase("journey");
      }
      return;
    }
    const prev = getPreviousStep(currentStep, answers);
    if (prev) {
      setCurrentStep(prev.id);
      setProceedHints([]);
    } else {
      setPhase("mode");
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
        body: JSON.stringify({ answers }),
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
      setResult(normalizeEstimateResult(publicResult, answers));
      setPhase("results");
    } catch (err) {
      setCalcError(
        err instanceof Error ? err.message : "Estimate calculation failed.",
      );
    } finally {
      setCalculating(false);
    }
  };

  const screen = getScreen(currentStep);
  const questions =
    currentStep === "review" ? [] : getQuestionsForScreen(currentStep);
  const followUps =
    currentStep === "review" ? [] : getVisibleFollowUps(answers, currentStep);

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
            <ProjectBlueprintHero onStart={() => setPhase("mode")} />
          </motion.div>
        )}

        {phase === "mode" && (
          <motion.section
            key="mode"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.35, ease: smoothEase }}
            className="container mx-auto max-w-7xl px-6 py-16 sm:py-20"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
              Project Blueprint
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">
              How would you like to begin?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
              Both paths lead to the same planning estimate. Guided questions are
              always available if you prefer structure.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                className={cn(optionCardClass, optionCardSelectedClass, "h-full")}
                onClick={() => {
                  setPhase("journey");
                  setCurrentStep("route");
                }}
              >
                <span className="block text-lg font-semibold">Guided questions</span>
                <span className="mt-2 block text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  Answer practical cards about product shape, users, capabilities,
                  and delivery. About five to seven minutes.
                </span>
              </button>
              <button
                type="button"
                className={cn(optionCardClass, "h-full")}
                onClick={() => setPhase("describe")}
              >
                <span className="block text-lg font-semibold">Describe my idea</span>
                <span className="mt-2 block text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  Write a short description. We suggest likely scope for you to
                  confirm, then continue into the guided journey.
                </span>
              </button>
            </div>

            <div className="mt-8">
              <BrandButton type="button" variant="outline" onClick={() => setPhase("hero")}>
                Back
              </BrandButton>
            </div>
          </motion.section>
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
              onCancel={() => {
                setPhase("journey");
                setCurrentStep("route");
              }}
              onConfirm={({ answersPatch }) => {
                updateAnswers({ ...answers, ...answersPatch });
                setPhase("journey");
                setCurrentStep(answersPatch.route ? "context" : "route");
              }}
            />
          </motion.section>
        )}

        {(phase === "journey" || phase === "review") && (
          <motion.section
            key="journey"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto max-w-7xl px-6 pb-28 pt-10 sm:pt-14 lg:pb-16"
          >
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <div>
                {phase === "review" ? (
                  <ReviewScreen
                    answers={answers}
                    onEditSection={(screenId) => {
                      setCurrentStep(screenId);
                      setPhase("journey");
                    }}
                    onBuildEstimate={() => void buildEstimate()}
                    calculating={calculating}
                    error={calcError}
                  />
                ) : screen ? (
                  <StepScreen
                    screen={screen}
                    questions={questions}
                    followUps={followUps}
                    answers={answers}
                    onChange={updateAnswers}
                    blockedMessage={
                      proceedHints.length ? proceedHints.join(" ") : null
                    }
                  />
                ) : (
                  <p>Unknown step.</p>
                )}

                {phase === "journey" && (
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <BrandButton
                      type="button"
                      variant="outline"
                      onClick={goPrevious}
                    >
                      Back
                    </BrandButton>
                    <BrandButton type="button" onClick={goNext}>
                      {getNextStep(currentStep, answers)?.isReview
                        ? "Continue to review"
                        : isWebsiteRoute(answers)
                          ? "Continue to website packages"
                          : "Continue"}
                    </BrandButton>
                  </div>
                )}

                {phase === "journey" && proceedHints.length > 0 && (
                  <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-800 dark:text-amber-200" role="alert">
                    {proceedHints.map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                )}
              </div>

              <SummaryRail
                answers={answers}
                currentStep={phase === "review" ? "review" : currentStep}
                saveStatus={saveStatus}
              />
            </div>
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
              onRecalculate={() => {
                setPhase("review");
                setCurrentStep("review");
              }}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Keep review meta referenced for catalogue completeness tooling */}
      <span className="sr-only">{getReviewScreenMeta().title}</span>
    </div>
  );
}
