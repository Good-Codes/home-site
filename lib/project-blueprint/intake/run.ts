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
  mergeAnswerPatch,
  sanitiseAnswers,
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
    "concept needs: headline, summary, whoItsFor, coreCapabilities (plain language strings), assumptions.",
    "Write concept copy in calm British/South African professional English. Do not mention Good Code internals.",
    "answers must use ONLY these catalogue IDs (never invent IDs):",
    taxonomy,
    "Prefer fewer high-confidence capabilities over stuffing the bag. Unknowns are expected — set answers.unknowns to not_sure or need_advice.",
    "Never invent prices, budgets, hour counts, timelines as numbers, rates, ZAR/R amounts, or quotes.",
    "clarifyingQuestionIds: 0–3 IDs chosen only from: " + whitelist + ".",
    "Ask follow-ups only when a high-impact fact is missing (surfaces, starting point, payments, integrations, users, sensitive data, timing).",
    "If the description is already enough for a planning estimate, status=ready and clarifyingQuestionIds=[].",
    "If round is 2, status must be ready or website_handoff and clarifyingQuestionIds must be [].",
  ].join("\n");
}

export function buildIntakeUserPrompt(input: {
  ideaText: string;
  answers: ProjectBlueprintAnswers;
  clarifications?: IntakeClarificationAnswer[];
  round: number;
}): string {
  return JSON.stringify(
    {
      ideaText: input.ideaText.slice(0, 4000),
      round: input.round,
      alreadyInferredAnswers: input.answers,
      userClarifications: input.clarifications ?? [],
      instruction:
        input.round >= 2
          ? "Final round. Return status ready or website_handoff. Do not ask more questions."
          : "Ask at most 3 clarifying questions, and only for missing high-impact facts.",
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

  let answers = normalizeAnswers({
    ...(input.previousAnswers ?? {}),
    ideaText,
  });

  if (input.clarifications?.length) {
    answers = normalizeAnswers(
      applyClarifications(answers, input.clarifications),
    );
  }

  const fallback = fallbackIntakeDraft(ideaText, answers);
  let usedFallback = true;
  let requestedIds = fallback.clarifyingQuestionIds;
  let requestedStatus = fallback.status;
  let conceptSource = fallback.concept;
  let patch = fallback.answers;

  const raw = await maybeCompleteAi(
    buildIntakeSystemPrompt(),
    buildIntakeUserPrompt({
      ideaText,
      answers,
      clarifications: input.clarifications,
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

  answers = sanitiseAnswers(mergeAnswerPatch(answers, patch), ideaText);
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
      answers: { ...answers, route: "route.website" },
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
  });

  const needsMore =
    !forceReady &&
    clarifyingQuestions.length > 0 &&
    (requestedStatus === "needs_clarification" || !hasCriticalScope(answers));

  return {
    status: needsMore ? "needs_clarification" : "ready",
    concept,
    answers,
    clarifyingQuestions: needsMore ? clarifyingQuestions : [],
    usedFallback,
    round,
  };
}
