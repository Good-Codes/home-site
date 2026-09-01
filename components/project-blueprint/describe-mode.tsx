"use client";

import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { smoothEase } from "@/lib/motion";
import { classifyIdeaKeywords } from "@/lib/project-blueprint/classifier/keyword";
import type {
  ClassifierSuggestion,
  ProjectBlueprintAnswers,
} from "@/lib/project-blueprint/types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BrandButton, optionCardClass, optionCardSelectedClass } from "./ui";

type DescribeModeProps = {
  initialText?: string;
  onCancel: () => void;
  onConfirm: (payload: {
    ideaText: string;
    suggestions: ClassifierSuggestion[];
    answersPatch: Partial<ProjectBlueprintAnswers>;
  }) => void;
};

function suggestionsToAnswers(
  selected: ClassifierSuggestion[],
): Partial<ProjectBlueprintAnswers> {
  const patch: Partial<ProjectBlueprintAnswers> = {
    confirmedSuggestions: selected.map((s) => s.id),
  };

  const surfaces: string[] = [];
  const capabilities: string[] = [];
  const integrations: string[] = [];
  const userGroups: string[] = [];
  const qualityRequirements: string[] = [];

  for (const suggestion of selected) {
    switch (suggestion.category) {
      case "product_type":
        if (suggestion.id.startsWith("route.")) patch.route = suggestion.id;
        break;
      case "starting_point":
        if (suggestion.id.startsWith("start.")) patch.startingPoint = suggestion.id;
        break;
      case "surface":
        surfaces.push(suggestion.id);
        break;
      case "capability":
        capabilities.push(suggestion.id);
        break;
      case "integration":
        integrations.push(suggestion.id);
        break;
      case "user_group":
        userGroups.push(suggestion.id);
        break;
      case "quality":
      case "risk":
        if (suggestion.id.startsWith("quality.")) {
          qualityRequirements.push(suggestion.id);
        } else if (suggestion.id.startsWith("migration.")) {
          patch.migrationProfile = suggestion.id;
        }
        break;
      default:
        break;
    }
  }

  if (surfaces.length) patch.surfaces = [...new Set(surfaces)];
  if (capabilities.length) patch.capabilities = [...new Set(capabilities)];
  if (integrations.length) patch.integrations = [...new Set(integrations)];
  if (userGroups.length) patch.userGroups = [...new Set(userGroups)];
  if (qualityRequirements.length) {
    patch.qualityRequirements = [...new Set(qualityRequirements)];
  }

  return patch;
}

export function DescribeMode({
  initialText = "",
  onCancel,
  onConfirm,
}: DescribeModeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [text, setText] = useState(initialText);
  const [suggestions, setSuggestions] = useState<ClassifierSuggestion[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [classified, setClassified] = useState(false);
  const [pending, startTransition] = useTransition();

  const runClassify = () => {
    startTransition(() => {
      const result = classifyIdeaKeywords(text);
      setSuggestions(result.suggestions);
      setNotes(result.notes);
      setSelectedIds(new Set(result.suggestions.map((s) => s.id)));
      setClassified(true);
    });
  };

  const toggleSuggestion = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = () => {
    const chosen = suggestions.filter((s) => selectedIds.has(s.id));
    onConfirm({
      ideaText: text.trim(),
      suggestions: chosen,
      answersPatch: {
        ideaText: text.trim(),
        ...suggestionsToAnswers(chosen),
      },
    });
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: smoothEase }}
      className="mx-auto max-w-3xl space-y-8"
    >
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
          Describe my idea
        </p>
        <h2 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          Tell us what you want to make possible
        </h2>
        <p className="text-base leading-7 text-neutral-600 dark:text-neutral-300">
          A short plain-language description is enough. We will suggest likely
          product shapes for you to confirm — we never invent a price from text.
        </p>
      </header>

      <div className="space-y-2">
        <Label htmlFor="idea-text">Your idea</Label>
        <Textarea
          id="idea-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Example: We need a customer portal where dealerships can upload finance applications, track progress, receive documents, and process monthly payments."
          className="min-h-[160px] resize-y border-neutral-300 focus-visible:ring-[#67AFA7] dark:border-neutral-700"
        />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          A rough answer is completely fine.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <BrandButton
          type="button"
          onClick={runClassify}
          disabled={pending || text.trim().length < 12}
        >
          {pending ? "Reviewing…" : "Suggest a starting shape"}
        </BrandButton>
        <BrandButton type="button" variant="outline" onClick={onCancel}>
          Prefer guided questions
        </BrandButton>
      </div>

      {classified && (
        <div className="space-y-5 border-t border-neutral-200 pt-8 dark:border-white/10">
          {notes.map((note) => (
            <p key={note} className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {note}
            </p>
          ))}

          {suggestions.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              We could not infer much yet. Continue with guided questions — that
              path remains the complete fallback.
            </p>
          ) : (
            <div className="space-y-3" role="group" aria-label="Suggested scope items">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Confirm or correct these suggestions before continuing.
              </p>
              {suggestions.map((suggestion) => {
                const selected = selectedIds.has(suggestion.id);
                return (
                  <button
                    key={suggestion.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSuggestion(suggestion.id)}
                    className={cn(
                      optionCardClass,
                      selected && optionCardSelectedClass,
                      "w-full",
                    )}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {suggestion.label}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-neutral-500">
                        {suggestion.confidence}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                      {suggestion.rationale}
                    </span>
                    <span className="mt-2 block text-xs text-neutral-500">
                      {suggestion.category.replace(/_/g, " ")} · requires confirmation
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <BrandButton type="button" onClick={confirm}>
            Continue with confirmed selections
          </BrandButton>
        </div>
      )}
    </motion.div>
  );
}
