"use client";

import { HelpCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { smoothEase } from "@/lib/motion";
import type { ProjectBlueprintAnswers, UnknownChoice } from "@/lib/project-blueprint/types";
import type {
  FollowUpDefinition,
  QuestionDefinition,
  ScreenDefinition,
} from "@/lib/project-blueprint/questions/schema";
import {
  clearUnknownMarker,
  getAnswerValue,
  setAnswerValue,
  setUnknownMarker,
} from "@/lib/project-blueprint/answer-path";
import { toggleCapability } from "@/lib/project-blueprint/branching/dependencies";
import { OptionSelectedMark, optionCardClass, optionCardSelectedClass } from "./ui";

type StepScreenProps = {
  screen: ScreenDefinition;
  questions: QuestionDefinition[];
  followUps: FollowUpDefinition[];
  answers: ProjectBlueprintAnswers;
  onChange: (next: ProjectBlueprintAnswers) => void;
  blockedMessage?: string | null;
};

function isSelected(
  value: unknown,
  optionId: string,
  multi: boolean,
): boolean {
  if (multi) {
    return Array.isArray(value) && value.includes(optionId);
  }
  if (typeof value === "boolean") {
    if (optionId === "yes") return value === true;
    if (optionId === "no") return value === false;
  }
  return value === optionId;
}

function QuestionBlock({
  question,
  answers,
  onChange,
}: {
  question: QuestionDefinition | FollowUpDefinition;
  answers: ProjectBlueprintAnswers;
  onChange: (next: ProjectBlueprintAnswers) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const multi = Boolean(question.allowMultiple || question.inputType === "multi_select");
  const answerKey = String(question.answerKey);
  const rawValue = getAnswerValue(answers, answerKey);
  const unknown = answers.unknowns?.[question.id];
  const options = question.options ?? [];
  const unknownOptions = question.unknownOptions ?? [];

  const selectOption = (optionId: string) => {
    let next = clearUnknownMarker(answers, question.id);

    if (question.inputType === "boolean") {
      next = setAnswerValue(next, answerKey, optionId === "yes");
      onChange(next);
      return;
    }

    if (multi) {
      const current = Array.isArray(rawValue) ? [...(rawValue as string[])] : [];
      const isCap = answerKey === "capabilities";
      if (isCap) {
        const enabled = !current.includes(optionId);
        const { next: caps, blocked } = toggleCapability(optionId, current, enabled);
        if (blocked && !enabled) {
          // Keep selection; parent can surface blocked.reason if desired
          onChange(setAnswerValue(next, answerKey, current));
          return;
        }
        onChange(setAnswerValue(next, answerKey, caps));
        return;
      }

      // Exclusive none / unknown for integrations
      if (optionId === "integration.none" || optionId === "integration.unknown") {
        onChange(setAnswerValue(next, answerKey, [optionId]));
        return;
      }
      if (optionId === "asset.nothing" || optionId === "device.none") {
        onChange(setAnswerValue(next, answerKey, [optionId]));
        return;
      }

      let updated = current.filter(
        (id) =>
          id !== "integration.none" &&
          id !== "integration.unknown" &&
          id !== "asset.nothing" &&
          id !== "device.none",
      );
      if (updated.includes(optionId)) {
        updated = updated.filter((id) => id !== optionId);
      } else {
        updated = [...updated, optionId];
      }
      onChange(setAnswerValue(next, answerKey, updated));
      return;
    }

    onChange(setAnswerValue(next, answerKey, optionId));
  };

  const selectUnknown = (choice: UnknownChoice) => {
    let next = setUnknownMarker(answers, question.id, choice);
    if (multi) {
      next = setAnswerValue(next, answerKey, []);
    } else if (question.inputType === "boolean") {
      next = setAnswerValue(next, answerKey, choice);
    } else if (answerKey === "route" && choice === "not_sure") {
      next = setAnswerValue(next, answerKey, "route.unsure");
    } else if (answerKey === "productLevel" && choice === "not_sure") {
      next = setAnswerValue(next, answerKey, "level.not_sure");
    } else if (answerKey === "timing" && choice === "not_sure") {
      next = setAnswerValue(next, answerKey, "timing.not_sure");
    } else if (answerKey === "userScale") {
      next = setAnswerValue(next, answerKey, "scale.unknown");
    } else if (answerKey === "migrationProfile") {
      next = setAnswerValue(next, answerKey, "migration.unknown");
    } else {
      next = setAnswerValue(next, answerKey, null);
    }
    onChange(next);
  };

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {question.prompt}
        {question.required ? (
          <span className="sr-only"> (required)</span>
        ) : null}
      </legend>
      <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        {question.helpText}
      </p>
      {question.supportingText ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {question.supportingText}
        </p>
      ) : null}

      <div
        className={cn(
          "grid gap-3",
          options.length > 4 ? "sm:grid-cols-2" : "sm:grid-cols-1",
        )}
        role={multi ? "group" : "radiogroup"}
        aria-label={question.prompt}
      >
        {options.map((option) => {
          const selected = !unknown && isSelected(rawValue, option.id, multi);
          return (
            <motion.button
              key={option.id}
              type="button"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: smoothEase }}
              className={cn(
                optionCardClass,
                selected && optionCardSelectedClass,
                "focus-visible:ring-2 focus-visible:ring-[#67AFA7] focus-visible:ring-offset-2",
              )}
              aria-pressed={multi ? selected : undefined}
              aria-checked={!multi ? selected : undefined}
              role={multi ? "checkbox" : "radio"}
              onClick={() => selectOption(option.id)}
            >
              <span className="flex items-start gap-3">
                <OptionSelectedMark selected={selected} />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-base font-semibold",
                      selected
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
                  {option.helpText ? (
                    <span className="mt-2 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                      {option.helpText}
                    </span>
                  ) : null}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {unknownOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Uncertain answers">
          {unknownOptions.map((opt) => {
            const selected = unknown === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => selectUnknown(opt.id)}
                aria-pressed={selected}
                title={opt.helpText}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7]",
                  selected
                    ? "border-[#67AFA7]/70 bg-[#67AFA7]/10 text-neutral-900 dark:text-neutral-100"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-[#67AFA7]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300",
                )}
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

export function StepScreen({
  screen,
  questions,
  followUps,
  answers,
  onChange,
  blockedMessage,
}: StepScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  // Group capability questions visually
  const groups = new Map<string | undefined, QuestionDefinition[]>();
  for (const q of questions) {
    const key = q.groupId;
    const list = groups.get(key) ?? [];
    list.push(q);
    groups.set(key, list);
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: smoothEase }}
      className="space-y-10"
    >
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
          {screen.id === "route" ? "Start here" : `Step ${screen.order}`}
        </p>
        <h2 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          {screen.title}
        </h2>
        <p className="max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
          {screen.summary}
        </p>
        {screen.helpText ? (
          <p className="max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {screen.helpText}
          </p>
        ) : null}
      </header>

      <div className="space-y-12">
        {[...groups.entries()].map(([groupId, groupQuestions]) => (
          <div key={groupId ?? "default"} className="space-y-8">
            {groupQuestions[0]?.groupLabel ? (
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                {groupQuestions[0].groupLabel}
              </h3>
            ) : null}
            {groupQuestions.map((question) => (
              <QuestionBlock
                key={question.id}
                question={question}
                answers={answers}
                onChange={onChange}
              />
            ))}
          </div>
        ))}

        {followUps.length > 0 && (
          <div className="space-y-8 border-t border-neutral-200 pt-10 dark:border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2f6f69] dark:text-[#9ed9d2]">
              A few more details
            </h3>
            {followUps.map((followUp) => (
              <QuestionBlock
                key={followUp.id}
                question={followUp}
                answers={answers}
                onChange={onChange}
              />
            ))}
          </div>
        )}
      </div>

      {blockedMessage ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100" role="status">
          {blockedMessage}
        </p>
      ) : null}
    </motion.div>
  );
}
