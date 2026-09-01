"use client";

import { motion, useReducedMotion } from "framer-motion";

import { smoothEase } from "@/lib/motion";
import type { ProjectBlueprintAnswers, ScreenId } from "@/lib/project-blueprint/types";
import { buildReviewSummary } from "@/lib/project-blueprint/summary";
import { BrandButton, optionCardClass } from "./ui";
import { BlueprintVisual } from "./blueprint-visual";

type ReviewScreenProps = {
  answers: ProjectBlueprintAnswers;
  onEditSection: (screenId: ScreenId) => void;
  onBuildEstimate: () => void;
  calculating?: boolean;
  error?: string | null;
};

export function ReviewScreen({
  answers,
  onEditSection,
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
          Review
        </p>
        <h2 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          Review your blueprint
        </h2>
        <p className="max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
          Confirm the plain-language summary before we build your planning
          estimate. You can edit any section.
        </p>
      </header>

      <div className={optionCardClass}>
        <p className="text-lg font-medium leading-8 text-neutral-900 dark:text-neutral-100">
          {summary.headline}
        </p>
        <div className="mt-6">
          <BlueprintVisual answers={answers} />
        </div>
      </div>

      <div className="space-y-4">
        {summary.sections
          .filter((section) => section.id !== "overview")
          .map((section) => (
            <div
              key={section.id}
              className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {section.body}
                  </p>
                </div>
                {section.id !== "overview" && (
                  <button
                    type="button"
                    onClick={() => onEditSection(section.id as ScreenId)}
                    className="text-sm font-medium text-[#2f6f69] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7] dark:text-[#9ed9d2]"
                  >
                    Edit {section.title.toLowerCase()}
                  </button>
                )}
              </div>
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
          {summary.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      <BrandButton
        type="button"
        onClick={onBuildEstimate}
        disabled={calculating}
        className="w-full sm:w-auto"
      >
        {calculating ? "Building estimate…" : "Build my estimate"}
      </BrandButton>
    </motion.div>
  );
}
