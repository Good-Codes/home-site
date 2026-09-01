"use client";

import { useState } from "react";
import { PanelBottom } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProjectBlueprintAnswers, ScreenId } from "@/lib/project-blueprint/types";
import { buildReviewSummary } from "@/lib/project-blueprint/summary";
import { getStepProgress } from "@/lib/project-blueprint/branching/journey";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BlueprintVisual } from "./blueprint-visual";

type SummaryRailProps = {
  answers: ProjectBlueprintAnswers;
  currentStep: ScreenId;
  saveStatus: "idle" | "saving" | "saved" | "error";
  className?: string;
};

function SummaryBody({
  answers,
  currentStep,
  saveStatus,
}: Omit<SummaryRailProps, "className">) {
  const summary = buildReviewSummary(answers);
  const progress = getStepProgress(currentStep, answers);

  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Progress saved"
        : saveStatus === "error"
          ? "Save failed — will retry"
          : "Ready to save";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f6f69] dark:text-[#9ed9d2]">
          Your blueprint
        </p>
        <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
          {summary.headline}
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>
            Step {progress.currentIndex + 1} of {progress.total}
          </span>
          <span aria-live="polite">{saveLabel}</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10"
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Estimator progress"
        >
          <div
            className="h-full rounded-full bg-[#67AFA7] transition-[width] duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <BlueprintVisual answers={answers} />

      {summary.unknowns.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
            Open assumptions
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-300">
            {summary.unknowns.slice(0, 4).map((item) => (
              <li key={item} className="leading-5">
                {item.includes("(") ? item.replace(/^q\.[^\s]+/, "A question").replace(/_/g, " ") : item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SummaryRail(props: SummaryRailProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-neutral-200 bg-white/90 p-5 shadow-sm shadow-neutral-950/[0.03] backdrop-blur dark:border-white/10 dark:bg-neutral-950/80 lg:block",
          props.className,
        )}
        aria-label="Project summary"
      >
        <SummaryBody {...props} />
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between border-neutral-300 dark:border-neutral-700"
              aria-label="Open project summary"
            >
              <span className="flex items-center gap-2">
                <PanelBottom className="h-4 w-4" aria-hidden />
                View blueprint summary
              </span>
              <span className="text-xs text-neutral-500">
                {getStepProgress(props.currentStep, props.answers).percent}%
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Your blueprint</SheetTitle>
              <SheetDescription>
                A live summary of what you have shared so far.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-8">
              <SummaryBody {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
