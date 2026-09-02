"use client";

import { motion, useReducedMotion } from "framer-motion";

import { smoothEase } from "@/lib/motion";
import type { IntakeConcept, ProjectBlueprintAnswers } from "@/lib/project-blueprint/types";
import { buildReviewSummary } from "@/lib/project-blueprint/summary";
import { BrandButton, optionCardClass } from "./ui";
import { BlueprintVisual } from "./blueprint-visual";

type ReviewScreenProps = {
  answers: ProjectBlueprintAnswers;
  concept?: IntakeConcept | null;
  usedFallback?: boolean;
  onEditDescription: () => void;
  onBuildEstimate: () => void;
  calculating?: boolean;
  error?: string | null;
};

export function ReviewScreen({
  answers,
  concept,
  usedFallback = false,
  onEditDescription,
  onBuildEstimate,
  calculating = false,
  error = null,
}: ReviewScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const summary = buildReviewSummary(answers);

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: smoothEase }}
      className="space-y-10"
    >
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
          What we understood
        </p>
        <h2 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          {concept?.headline ?? "Review your blueprint"}
        </h2>
        <p className="max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
          {concept?.summary ??
            "Confirm the plain-language summary before we build your planning estimate."}
        </p>
      </header>

      <div className={optionCardClass}>
        <p className="text-lg font-medium leading-8 text-neutral-900 dark:text-neutral-100">
          {concept?.headline ?? summary.headline}
        </p>
        {concept?.whoItsFor ? (
          <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            For: {concept.whoItsFor}
          </p>
        ) : null}
        <div className="mt-6">
          <BlueprintVisual answers={answers} />
        </div>
      </div>

      {concept?.coreCapabilities?.length ? (
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Core capabilities
          </h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {concept.coreCapabilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-4">
        {summary.sections
          .filter((section) => section.id !== "overview")
          .map((section) => (
            <div
              key={section.id}
              className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {section.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {section.body}
              </p>
            </div>
          ))}
      </div>

      {summary.unknowns.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <h3 className="text-base font-semibold text-amber-950 dark:text-amber-100">
            Unknowns that widen the range
          </h3>
          <p className="mt-2 text-sm leading-6 text-amber-900/90 dark:text-amber-100/90">
            Not sure? We’ll include that uncertainty in the range rather than
            inventing precision.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-950 dark:text-amber-50">
            {summary.unknowns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Working assumptions
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {(concept?.assumptions?.length ? concept.assumptions : summary.assumptions).map(
            (item) => (
              <li key={item}>{item}</li>
            ),
          )}
        </ul>
      </div>

      {usedFallback ? (
        <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          We used a simpler review of your description. You can edit the idea
          and try again, or continue to a planning estimate with broader bands.
        </p>
      ) : null}

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <BrandButton
          type="button"
          onClick={onBuildEstimate}
          disabled={calculating}
          className="w-full sm:w-auto"
        >
          {calculating ? "Building estimate…" : "Build my estimate"}
        </BrandButton>
        <BrandButton
          type="button"
          variant="outline"
          onClick={onEditDescription}
          disabled={calculating}
        >
          Edit description
        </BrandButton>
      </div>
    </motion.div>
  );
}
