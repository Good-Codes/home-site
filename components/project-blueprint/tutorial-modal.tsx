"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { smoothEase } from "@/lib/motion";
import {
  ESTIMATOR_TUTORIAL_STEPS,
  writeSkipEstimatorTutorial,
} from "@/lib/project-blueprint/tutorial";
import { BrandButton } from "./ui";
import { TutorialStepPreview } from "./tutorial-previews";

type EstimatorTutorialModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
};

const LAST_INDEX = ESTIMATOR_TUTORIAL_STEPS.length - 1;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
};

const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export function EstimatorTutorialModal({
  open,
  onOpenChange,
  onStart,
}: EstimatorTutorialModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hideNextTime, setHideNextTime] = useState(false);

  const step = ESTIMATOR_TUTORIAL_STEPS[index];
  const isLast = index === LAST_INDEX;
  const variants = prefersReducedMotion ? fadeVariants : slideVariants;

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setDirection(1);
    setHideNextTime(false);
  }, [open]);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(LAST_INDEX, next));
    if (clamped === index) return;
    setDirection(clamped > index ? 1 : -1);
    setIndex(clamped);
  };

  const startEstimate = () => {
    writeSkipEstimatorTutorial(hideNextTime);
    onOpenChange(false);
    onStart();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              goTo(index + 1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              goTo(index - 1);
            }
          }}
          className="fixed left-1/2 top-1/2 z-[90] w-[min(96vw,68rem)] max-h-[90dvh] -translate-x-1/2 -translate-y-1/2 focus:outline-none"
        >
          <div className="flex max-h-[90dvh] items-center gap-2 sm:gap-3">
            <PagerArrow
              direction="previous"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            />

            <div className="relative flex max-h-[90dvh] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-950">
              <header className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 dark:border-white/10 sm:px-6">
                <div>
                  <Dialog.Title className="text-base font-semibold text-neutral-950 dark:text-white sm:text-lg">
                    How this estimate works
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Four short steps · about 3–5 minutes
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  aria-label="Close tutorial"
                  className="rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7] dark:hover:bg-white/10 dark:hover:text-neutral-200"
                >
                  <X className="size-4" strokeWidth={1.5} />
                </Dialog.Close>
              </header>

              <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.div
                    key={step.id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: prefersReducedMotion ? 0.15 : 0.35, ease: smoothEase }}
                    className="grid gap-0 md:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]"
                  >
                    <div className="max-h-[30vh] overflow-hidden bg-gradient-to-br from-[#67AFA7]/16 via-neutral-50 to-white p-4 dark:from-[#67AFA7]/20 dark:via-neutral-950 dark:to-neutral-950 sm:p-6 md:max-h-none">
                      <TutorialStepPreview kind={step.id} />
                    </div>

                    <div className="flex flex-col justify-center px-5 py-5 sm:px-7 sm:py-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
                        Step {index + 1} of {ESTIMATOR_TUTORIAL_STEPS.length}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-neutral-950 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        {step.duration}
                      </p>
                      <p className="mt-4 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {isLast ? (
                <div className="shrink-0 space-y-3 border-t border-neutral-200 px-5 py-4 dark:border-white/10 sm:px-7">
                  <BrandButton onClick={startEstimate} className="w-full sm:w-auto">
                    Start estimation
                  </BrandButton>
                  <label
                    htmlFor="estimator-tutorial-hide"
                    className="flex cursor-pointer items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300"
                  >
                    <input
                      id="estimator-tutorial-hide"
                      type="checkbox"
                      checked={hideNextTime}
                      onChange={(event) => setHideNextTime(event.target.checked)}
                      className="mt-0.5 size-4 shrink-0 rounded border-neutral-300 accent-[#67AFA7]"
                    />
                    Don’t show this tutorial again
                  </label>
                </div>
              ) : null}

              <footer className="flex shrink-0 items-center justify-center border-t border-neutral-200 px-5 py-3 dark:border-white/10 sm:px-6">
                <div
                  className="flex items-center justify-center gap-2"
                  role="group"
                  aria-label="Tutorial steps"
                >
                  {ESTIMATOR_TUTORIAL_STEPS.map((item, stepIndex) => {
                    const current = stepIndex === index;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-current={current ? "step" : undefined}
                        aria-label={`Go to step ${stepIndex + 1}: ${item.title}`}
                        onClick={() => goTo(stepIndex)}
                        className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7]"
                      >
                        <span
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            current
                              ? "w-6 bg-[#67AFA7]"
                              : "w-1.5 bg-neutral-300 hover:bg-neutral-400 dark:bg-white/25 dark:hover:bg-white/40",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </footer>
            </div>

            <PagerArrow
              direction="next"
              disabled={isLast}
              onClick={() => goTo(index + 1)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PagerArrow({
  direction,
  disabled,
  onClick,
  className,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={direction === "previous" ? "Previous step" : "Next step"}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-[#67AFA7]/60 hover:text-[#2f6f69] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7] disabled:pointer-events-none disabled:opacity-30 dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:text-[#9ed9d2] sm:size-10",
        className,
      )}
    >
      <Icon className="size-5" strokeWidth={1.5} />
    </button>
  );
}
