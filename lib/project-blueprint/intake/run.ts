/**
 * Intake orchestration: OpenAI (or keyword fallback) → sanitised answers → 0–3 follow-ups.
 * Does not calculate prices.
 */

import { normalizeAnswers } from "../answers";
import type {
  IntakeClarificationAnswer,
  IntakeResult,
  ProjectBlueprintAnswers,
} from "../types";
import { fallbackIntakeDraft } from "./fallback";
import {
  fillDefaultsAndUnknowns,
  filterCatalogueAnswers,
  mergeAnswerPatch,
  sanitiseConcept,
} from "./sanitise";
import { buildTaxonomyPrompt } from "./taxonomy";
import {
  applyClarifications,
  getWhitelistIds,
  selectClarifyingQuestions,
} from "./whitelist";

export type IntakeRequest = {
  ideaText: string;
  round?: number;
  clarifications?: IntakeClarificationAnswer[];
  previousAnswers?: ProjectBlueprintAnswers | null;
  askedQuestionIds?: string[] | null;
};

export type CompleteJsonFn = (system: string, user: string) => Promise<unknown>;

type IntakeAiDeps = {
  completeJson?: CompleteJsonFn;
  aiEnabled?: boolean;
};

function clampRound(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(2, Math.max(0, Math.floor(value)));
}

function uniqueQuestionIds(ids: Array<string | undefined | null>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function hasCriticalScope(answers: ProjectBlueprintAnswers): boolean {
  return Boolean(
    answers.route &&
      answers.route !== "route.website" &&
      (answers.surfaces?.length ?? 0) > 0,
  );
}

export function buildIntakeSystemPrompt(): string {
  const taxonomy = buildTaxonomyPrompt();
  const whitelist = getWhitelistIds().join(", ");
  return [
    "You are the intake analyst for Good Code Project Blueprint, a custom-software planning estimator.",
    "Read the prospect's idea and return JSON only with keys: status, concept, answers, clarifyingQuestionIds.",
    "status must be one of: needs_clarification, ready, website_handoff.",
    "Use website_handoff only for marketing / brochure / landing-page websites with no custom product behaviour.",
    "concept needs: headline, summary, whoItsFor, coreCapabilities (JSON array of short strings, never one sentence), assumptions (JSON array of strings, never one sentence).",
    "Write concept copy in calm British/South African professional English. Do not mention Good Code internals.",
    "answers may use ONLY these high-impact catalogue IDs (never invent IDs). This mapping is for follow-ups and review facts, not pricing:",
    taxonomy,
    "Prefer fewer high-confidence facts over stuffing the bag. Unknowns are expected — set answers.unknowns to not_sure or need_advice.",
    "Never invent prices, budgets, hour counts, timelines as numbers, rates, ZAR/R amounts, or quotes. Pricing happens in a later step.",
    "clarifyingQuestionIds: 0–3 IDs chosen only from: " + whitelist + ".",
    "Ask follow-ups only when a high-impact fact is missing for a planning estimate (surfaces, payments, integrations, native vs web, sensitive data).",
    "Never repeat an ID that appears in userClarifications, askedQuestionIds, or alreadyInferredAnswers.unknowns.",
    "If the description is already enough for a planning estimate, status=ready and clarifyingQuestionIds=[].",
    "If round is 2, status must be ready or website_handoff and clarifyingQuestionIds must be [].",
  ].join("\n");
}

export function buildIntakeUserPrompt(input: {
  ideaText: string;
  answers: ProjectBlueprintAnswers;
  clarifications?: IntakeClarificationAnswer[];
  askedQuestionIds?: string[];
  round: number;
}): string {
  return JSON.stringify(
    {
      ideaText: input.ideaText.slice(0, 4000),
      round: input.round,
      alreadyInferredAnswers: input.answers,
      userClarifications: input.clarifications ?? [],
      askedQuestionIds: input.askedQuestionIds ?? [],
      instruction:
        input.round >= 2
          ? "Final round. Return status ready or website_handoff. Do not ask more questions."
          : "Ask at most 3 clarifying questions, and only for missing high-impact facts. Do not re-ask IDs in userClarifications, askedQuestionIds, or alreadyInferredAnswers.unknowns.",
    },
    null,
    2,
  );
}

async function maybeCompleteAi(
  system: string,
  user: string,
  deps: IntakeAiDeps,
): Promise<unknown | null> {
  if (deps.completeJson) {
    return deps.completeJson(system, user);
  }
  if (deps.aiEnabled === false) return null;

  try {
    const openai = await import("./openai");
    if (deps.aiEnabled !== true && !openai.isAiIntakeEnabled()) return null;
    return await openai.completeIntakeJson(system, user);
  } catch (error) {
    console.error("AI intake failed", error);
    return null;
  }
}

function buildExcludeIds(input: IntakeRequest): string[] {
  return uniqueQuestionIds([
    ...(input.askedQuestionIds ?? []),
    ...(input.clarifications ?? []).map((item) => item.questionId),
  ]);
}

/**
 * Run intake. Same idea + clarifications should produce a stable sanitised answer bag
 * when the model (or fallback) returns the same structured payload.
 */
export async function runIntake(
  input: IntakeRequest,
  deps: IntakeAiDeps = {},
): Promise<IntakeResult> {
  const ideaText = input.ideaText.replace(/\s+/g, " ").trim().slice(0, 4000);
  const round = clampRound(input.round);
  const excludeIds = buildExcludeIds(input);

  let answers = normalizeAnswers({
    ...(input.previousAnswers ?? {}),
    ideaText,
  });

  const answersForPrompt = input.clarifications?.length
    ? normalizeAnswers(applyClarifications(answers, input.clarifications))
    : answers;

  const fallback = fallbackIntakeDraft(ideaText, answersForPrompt);
  let usedFallback = true;
  let requestedIds = fallback.clarifyingQuestionIds;
  let requestedStatus = fallback.status;
  let conceptSource = fallback.concept;
  let patch = fallback.answers;

  const raw = await maybeCompleteAi(
    buildIntakeSystemPrompt(),
    buildIntakeUserPrompt({
      ideaText,
      answers: answersForPrompt,
      clarifications: input.clarifications,
      askedQuestionIds: excludeIds,
      round,
    }),
    deps,
  );

  if (raw) {
    const openai = await import("./openai");
    const parsed = openai.parseOpenAiIntakePayload(raw);
    if (parsed) {
      usedFallback = false;
      requestedIds = parsed.clarifyingQuestionIds ?? [];
      requestedStatus = parsed.status;
      conceptSource = parsed.concept;
      patch = parsed.answers;
    }
  }

  answers = filterCatalogueAnswers(mergeAnswerPatch(answers, patch));
  if (input.clarifications?.length) {
    answers = normalizeAnswers(
      applyClarifications(answers, input.clarifications),
    );
  }
  const concept = sanitiseConcept(conceptSource, answers);

  const customWork =
    answers.route === "route.customer_portal" ||
    answers.route === "route.saas_multi_tenant" ||
    answers.route === "route.mobile_app" ||
    answers.route === "route.internal_system" ||
    answers.route === "route.custom_web_platform" ||
    (answers.capabilities ?? []).some(
      (id) =>
        id.startsWith("cap.payments.") ||
        id.startsWith("cap.workflow.") ||
        id.startsWith("cap.access."),
    ) ||
    (answers.surfaces ?? []).some((id) =>
      ["surface.customer_portal", "surface.native_mobile", "surface.admin_workspace"].includes(
        id,
      ),
    );

  if (
    !customWork &&
    (answers.route === "route.website" || requestedStatus === "website_handoff")
  ) {
    return {
      status: "website_handoff",
      concept,
      answers: fillDefaultsAndUnknowns(
        { ...answers, route: "route.website" },
        ideaText,
      ),
      clarifyingQuestions: [],
      usedFallback,
      round,
    };
  }

  const forceReady = round >= 2;
  const clarifyingQuestions = selectClarifyingQuestions({
    requestedIds,
    answers,
    ideaText,
    round,
    forceReady,
    excludeIds,
  });

  const needsMore =
    !forceReady &&
    clarifyingQuestions.length > 0 &&
    (requestedStatus === "needs_clarification" || !hasCriticalScope(answers));

  return {
    status: needsMore ? "needs_clarification" : "ready",
    concept,
    answers: needsMore
      ? answers
      : fillDefaultsAndUnknowns(answers, ideaText),
    clarifyingQuestions: needsMore ? clarifyingQuestions : [],
    usedFallback,
    round,
  };
}
