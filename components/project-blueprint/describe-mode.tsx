"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { smoothEase } from "@/lib/motion";
import type {
  IntakeClarifyingQuestion,
  IntakeClarificationAnswer,
  IntakeConcept,
  IntakeResult,
  ProjectBlueprintAnswers,
} from "@/lib/project-blueprint/types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BrandButton, OptionSelectedMark, optionCardClass, optionCardSelectedClass } from "./ui";

type DescribeModeProps = {
  initialText?: string;
  onCancel: () => void;
  onWebsiteHandoff: () => void;
  onReady: (payload: {
    ideaText: string;
    answers: ProjectBlueprintAnswers;
    concept: IntakeConcept;
    usedFallback: boolean;
  }) => void;
};

type SelectionMap = Record<string, string[]>;

const UNKNOWN_OPTION_IDS = new Set([
  "not_sure",
  "unknown",
  "need_advice",
  "help_me_choose",
]);

function toggleValue(
  current: string[],
  value: string,
  kind: IntakeClarifyingQuestion["kind"],
): string[] {
  if (kind === "single") return [value];
  if (UNKNOWN_OPTION_IDS.has(value)) {
    if (current.includes(value)) return current.filter((item) => item !== value);
    return [value];
  }
  const withoutUnknown = current.filter((item) => !UNKNOWN_OPTION_IDS.has(item));
  if (withoutUnknown.includes(value)) {
    return withoutUnknown.filter((item) => item !== value);
  }
  return [...withoutUnknown, value];
}

function questionsComplete(
  questions: IntakeClarifyingQuestion[],
  selections: SelectionMap,
): boolean {
  return questions.every((question) => (selections[question.id] ?? []).length > 0);
}

export function DescribeMode({
  initialText = "",
  onCancel,
  onWebsiteHandoff,
  onReady,
}: DescribeModeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [text, setText] = useState(initialText);
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<ProjectBlueprintAnswers | null>(null);
  const [concept, setConcept] = useState<IntakeConcept | null>(null);
  const [questions, setQuestions] = useState<IntakeClarifyingQuestion[]>([]);
  const [selections, setSelections] = useState<SelectionMap>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [askedQuestionIds, setAskedQuestionIds] = useState<string[]>([]);

  const submitIntake = async (payload: {
    ideaText: string;
    nextRound: number;
    clarifications?: IntakeClarificationAnswer[];
    previousAnswers?: ProjectBlueprintAnswers | null;
    askedQuestionIds?: string[];
  }) => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/project-blueprint/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: payload.ideaText,
          round: payload.nextRound,
          ...(payload.clarifications?.length
            ? { clarifications: payload.clarifications }
            : {}),
          ...(payload.previousAnswers
            ? { previousAnswers: payload.previousAnswers }
            : {}),
          ...(payload.askedQuestionIds?.length
            ? { askedQuestionIds: payload.askedQuestionIds }
            : {}),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as IntakeResult & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "We could not review the idea. Please try again.",
        );
      }

      setAnswers(data.answers);
      setConcept(data.concept);
      setUsedFallback(Boolean(data.usedFallback));
      setRound(data.round);

      if (data.status === "website_handoff") {
        onWebsiteHandoff();
        return;
      }

      if (data.status === "needs_clarification" && data.clarifyingQuestions.length) {
        setQuestions(data.clarifyingQuestions);
        setSelections({});
        setAskedQuestionIds((prev) => [
          ...new Set([
            ...prev,
            ...data.clarifyingQuestions.map((question) => question.id),
          ]),
        ]);
        return;
      }

      onReady({
        ideaText: payload.ideaText,
        answers: data.answers,
        concept: data.concept,
        usedFallback: Boolean(data.usedFallback),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not review the idea right now.",
      );
    } finally {
      setPending(false);
    }
  };

  const runInitial = () => {
    void submitIntake({
      ideaText: text.trim(),
      nextRound: 0,
      previousAnswers: null,
    });
  };

  const runClarifications = () => {
    if (!questionsComplete(questions, selections)) {
      setError("Please answer each question, even if the answer is “I’m not sure yet”.");
      return;
    }
    const clarifications = questions.map((question) => ({
      questionId: question.id,
      values: selections[question.id] ?? [],
    }));
    void submitIntake({
      ideaText: text.trim(),
      nextRound: Math.min(round + 1, 2),
      clarifications,
      previousAnswers: answers,
      askedQuestionIds: [
        ...new Set([...askedQuestionIds, ...questions.map((question) => question.id)]),
      ],
    });
  };

  const showingQuestions = questions.length > 0;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: smoothEase }}
      className="mx-auto max-w-3xl space-y-8"
    >
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
          Describe the idea
        </p>
        <h2 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          {showingQuestions
            ? "A few details will make the estimate more honest"
            : "Tell us what you want to make possible"}
        </h2>
        <p className="text-base leading-7 text-neutral-600 dark:text-neutral-300">
          {showingQuestions
            ? "We only ask what we could not infer from your description."
            : "A short plain-language description is enough. We will infer the product shape and only ask follow-ups when something important is missing."}
        </p>
      </header>

      {!showingQuestions ? (
        <div className="space-y-2">
          <Label htmlFor="idea-text">Your idea</Label>
          <Textarea
            id="idea-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Example: We need a customer portal where dealerships can upload finance applications, track progress, receive documents, and process monthly payments."
            className="min-h-[180px] resize-y border-neutral-300 focus-visible:ring-[#67AFA7] dark:border-neutral-700"
          />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            A rough answer is completely fine. Include who it is for, what they
            need to do, and any systems it should connect to.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {concept ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {concept.headline}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {concept.summary}
              </p>
            </div>
          ) : null}

          {questions.map((question) => {
            const selected = selections[question.id] ?? [];
            return (
              <fieldset key={question.id} className="space-y-3">
                <legend className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {question.prompt}
                </legend>
                {question.help ? (
                  <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {question.help}
                  </p>
                ) : null}
                <div className="grid gap-3" role="group">
                  {question.options.map((option) => {
                    const isSelected = selected.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() =>
                          setSelections((prev) => ({
                            ...prev,
                            [question.id]: toggleValue(
                              prev[question.id] ?? [],
                              option.id,
                              question.kind,
                            ),
                          }))
                        }
                        className={cn(
                          optionCardClass,
                          isSelected && optionCardSelectedClass,
                          "w-full text-left",
                        )}
                      >
                        <span className="flex items-start gap-3">
                          <OptionSelectedMark selected={isSelected} />
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block text-base font-semibold",
                                isSelected
                                  ? "text-[#2f6f69] dark:text-[#9ed9d2]"
                                  : "text-neutral-900 dark:text-neutral-100",
                              )}
                            >
                              {option.label}
                            </span>
                            {option.description ? (
                              <span className="mt-1 block text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                                {option.description}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
      )}

      {usedFallback && showingQuestions ? (
        <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          We used a simpler review of your description. Adding a little more
          detail here still improves the planning range.
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
        {showingQuestions ? (
          <>
            <BrandButton
              type="button"
              onClick={runClarifications}
              disabled={pending}
            >
              {pending ? "Updating…" : "Continue"}
            </BrandButton>
            <BrandButton
              type="button"
              variant="outline"
              onClick={() => {
                setQuestions([]);
                setSelections({});
                setAskedQuestionIds([]);
                setError(null);
              }}
              disabled={pending}
            >
              Edit description
            </BrandButton>
          </>
        ) : (
          <>
            <BrandButton
              type="button"
              onClick={runInitial}
              disabled={pending || text.trim().length < 20}
            >
              {pending ? "Reviewing…" : "Review my idea"}
            </BrandButton>
            <BrandButton type="button" variant="outline" onClick={onCancel}>
              Back
            </BrandButton>
          </>
        )}
      </div>
    </motion.div>
  );
}
