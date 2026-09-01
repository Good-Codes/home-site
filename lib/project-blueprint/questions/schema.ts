/**
 * Question / option / follow-up schema for the Project Blueprint catalogue.
 */

import type { ProjectBlueprintAnswers, ScreenId, UnknownChoice } from "../types";

export type QuestionInputType =
  | "single_select"
  | "multi_select"
  | "boolean"
  | "text"
  | "budget_band";

export type QuestionOption = {
  id: string;
  label: string;
  description?: string;
  helpText?: string;
  /** Soft hint shown under “Help me choose”. */
  whenToChoose?: string;
  /** Route websites away from Project Blueprint. */
  routesAway?: "website_packages";
  /** Tags used by branching and classifiers. */
  tags?: string[];
};

export type UnknownOptionConfig = {
  id: UnknownChoice;
  label: string;
  helpText?: string;
};

export type AnswerPredicate = (answers: ProjectBlueprintAnswers) => boolean;

export type QuestionDefinition = {
  id: string;
  screenId: ScreenId;
  inputType: QuestionInputType;
  prompt: string;
  helpText: string;
  /** Short supporting line under the prompt. */
  supportingText?: string;
  options?: QuestionOption[];
  /** Prefer “I’m not sure” / “Help me choose” / “We need advice”. */
  unknownOptions?: UnknownOptionConfig[];
  required?: boolean;
  allowMultiple?: boolean;
  /** Answer field this question writes into. */
  answerKey: keyof ProjectBlueprintAnswers | string;
  /** Optional visibility predicate; omitted means always visible on its screen. */
  when?: AnswerPredicate;
  validationMessage?: string;
  groupId?: string;
  groupLabel?: string;
  followUpIds?: string[];
};

export type FollowUpDefinition = QuestionDefinition & {
  parentQuestionId: string;
  /** Stronger condition — follow-ups are never shown without this. */
  when: AnswerPredicate;
};

export type ScreenDefinition = {
  id: ScreenId;
  title: string;
  summary: string;
  helpText?: string;
  order: number;
  /** Primary questions for this screen (follow-ups referenced separately). */
  questionIds: string[];
};

export type QuestionCatalogue = {
  version: string;
  screens: ScreenDefinition[];
  questions: QuestionDefinition[];
  followUps: FollowUpDefinition[];
};

export const DEFAULT_UNKNOWN_OPTIONS: UnknownOptionConfig[] = [
  {
    id: "not_sure",
    label: "I’m not sure",
    helpText: "We’ll treat this as an open assumption and widen the planning range where it matters.",
  },
  {
    id: "help_me_choose",
    label: "Help me choose",
    helpText: "We’ll suggest a sensible default based on similar products and confirm it on the review step.",
  },
  {
    id: "need_advice",
    label: "We need advice",
    helpText: "A Good Code specialist can help decide this during discovery or estimate review.",
  },
];

export const UNSURE_ONLY: UnknownOptionConfig[] = [
  {
    id: "not_sure",
    label: "I’m not sure",
    helpText: "We’ll note the uncertainty and keep the estimate indicative until this is confirmed.",
  },
];

export const ADVICE_OPTIONS: UnknownOptionConfig[] = [
  {
    id: "need_advice",
    label: "We need advice",
    helpText: "Mark this for a specialist conversation rather than forcing a guess.",
  },
  {
    id: "not_sure",
    label: "I’m not sure yet",
    helpText: "We’ll keep the range broader until this decision is clearer.",
  },
];
