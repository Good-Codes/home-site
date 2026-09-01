/**
 * Adaptive journey helpers: visible steps, navigation, and proceed checks.
 */

import { normalizeAnswers } from "../answers";
import {
  CATALOGUE_SCREENS,
  getQuestionsForScreen,
  getVisibleFollowUps,
  QUESTION_CATALOGUE,
} from "../questions/catalogue";
import type { ProjectBlueprintAnswers, ScreenId } from "../types";
import {
  hasDeadlineConflict,
  isCustomSoftwareRoute,
  isScreenVisible,
  isWebsiteRoute,
} from "./rules";

export const PRIMARY_STEP_ORDER: ScreenId[] = [
  "route",
  "context",
  "surfaces",
  "users",
  "capabilities",
  "integrations",
  "quality",
  "delivery",
  "review",
];

export type JourneyStep = {
  id: ScreenId;
  title: string;
  summary: string;
  order: number;
  isReview: boolean;
};

function toStep(screenId: ScreenId): JourneyStep {
  const screen = CATALOGUE_SCREENS.find((s) => s.id === screenId)!;
  return {
    id: screen.id,
    title: screen.title,
    summary: screen.summary,
    order: screen.order,
    isReview: screen.id === "review",
  };
}

export function getVisibleSteps(answersInput: ProjectBlueprintAnswers): JourneyStep[] {
  const answers = normalizeAnswers(answersInput);

  if (isWebsiteRoute(answers)) {
    return [toStep("route")];
  }

  return PRIMARY_STEP_ORDER.filter((id) => isScreenVisible(id, answers)).map(toStep);
}

export function getNextStep(
  current: ScreenId,
  answersInput: ProjectBlueprintAnswers,
): JourneyStep | null {
  const visible = getVisibleSteps(answersInput);
  const index = visible.findIndex((s) => s.id === current);
  if (index < 0) return visible[0] ?? null;
  return visible[index + 1] ?? null;
}

export function getPreviousStep(
  current: ScreenId,
  answersInput: ProjectBlueprintAnswers,
): JourneyStep | null {
  const visible = getVisibleSteps(answersInput);
  const index = visible.findIndex((s) => s.id === current);
  if (index <= 0) return null;
  return visible[index - 1] ?? null;
}

function hasUnknownMarker(answers: ProjectBlueprintAnswers, questionId: string): boolean {
  return Boolean(answers.unknowns?.[questionId]);
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return true;
  return true;
}

function readAnswerKey(answers: ProjectBlueprintAnswers, answerKey: string): unknown {
  if (!answerKey.includes(".")) {
    return answers[answerKey as keyof ProjectBlueprintAnswers];
  }

  const parts = answerKey.split(".");
  let cursor: unknown = answers;
  for (const part of parts) {
    if (cursor === null || cursor === undefined || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

export type ProceedResult = {
  ok: boolean;
  reasons: string[];
  /** Website route is complete for Project Blueprint — hand off externally. */
  routesAway?: "website_packages";
};

/**
 * Whether the user can leave the current step.
 * Unknown options count as answered for proceed purposes.
 */
export function canProceed(
  current: ScreenId,
  answersInput: ProjectBlueprintAnswers,
): ProceedResult {
  const answers = normalizeAnswers(answersInput);

  if (current === "route") {
    if (isWebsiteRoute(answers)) {
      return { ok: true, reasons: [], routesAway: "website_packages" };
    }
    if (answers.route === "route.unsure" || hasUnknownMarker(answers, "q.route.product_type")) {
      return { ok: true, reasons: [] };
    }
    if (!answers.route) {
      return { ok: false, reasons: ["Choose what you are planning to build."] };
    }
    return { ok: true, reasons: [] };
  }

  if (isWebsiteRoute(answers)) {
    return {
      ok: false,
      reasons: ["Website enquiries continue on the website packages page."],
      routesAway: "website_packages",
    };
  }

  if (current === "review") {
    return { ok: isCustomSoftwareRoute(answers), reasons: isCustomSoftwareRoute(answers) ? [] : ["Complete route selection first."] };
  }

  const reasons: string[] = [];
  const requiredQuestions = getQuestionsForScreen(current).filter((q) => q.required);

  for (const question of requiredQuestions) {
    if (hasUnknownMarker(answers, question.id)) continue;
    const value = readAnswerKey(answers, String(question.answerKey));
    if (!isFilled(value)) {
      reasons.push(question.validationMessage ?? `Complete “${question.prompt}”.`);
    }
  }

  // Delivery deadline conflict must be acknowledged when it appears.
  if (current === "delivery" && hasDeadlineConflict(answers)) {
    const resolution = answers.deadlineConflictResolution;
    if (!resolution && !hasUnknownMarker(answers, "q.followup.deadline.resolution")) {
      reasons.push("Choose how to handle the ambitious timing before continuing.");
    }
  }

  // Surfaces: at least one surface or unknown.
  if (current === "surfaces") {
    const unknown = hasUnknownMarker(answers, "q.surfaces.channels");
    if (!unknown && (!answers.surfaces || answers.surfaces.length === 0)) {
      reasons.push("Select at least one product surface, or choose an unknown option.");
    }
  }

  return { ok: reasons.length === 0, reasons };
}

export function getStepProgress(
  current: ScreenId,
  answersInput: ProjectBlueprintAnswers,
): { currentIndex: number; total: number; percent: number } {
  const visible = getVisibleSteps(answersInput);
  const currentIndex = Math.max(0, visible.findIndex((s) => s.id === current));
  const total = visible.length || 1;
  return {
    currentIndex,
    total,
    percent: Math.round(((currentIndex + 1) / total) * 100),
  };
}

export function getActiveFollowUpIds(
  current: ScreenId,
  answersInput: ProjectBlueprintAnswers,
): string[] {
  return getVisibleFollowUps(normalizeAnswers(answersInput), current).map((f) => f.id);
}

export function getCatalogueVersion(): string {
  return QUESTION_CATALOGUE.version;
}
