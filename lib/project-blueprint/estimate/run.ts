/**
 * Dedicated AI planning estimate. Intake must already have confirmed the concept.
 */

import { createHash } from "node:crypto";

import type { IntakeConcept, ProjectBlueprintAnswers, PublicEstimateResult } from "../types";
import { DEFAULT_ESTIMATE_MODEL, PROMPT_VERSION } from "./constants";
import { formatEstimateValidationIssues, parseEstimatePayload } from "./coerce";
import { applyEstimateGuards, type GuardAdjustment } from "./guards";
import { mapEstimateToPublicResult } from "./map-public";
import {
  answersLookLikeWebsiteOnly,
  buildEstimateSystemPrompt,
  buildEstimateUserPrompt,
} from "./prompt";
import { buildScopeSnapshot, ideaTextFromAnswers } from "./scope";

export type CompleteJsonFn = (system: string, user: string) => Promise<unknown>;

export type EstimateTrace = {
  promptVersion: string;
  model: string;
  inputHash: string;
  rawModelJson: unknown;
  guardAdjustments: GuardAdjustment[];
  publicResult: PublicEstimateResult;
};

export type AiEstimateOk = {
  ok: true;
  publicResult: PublicEstimateResult;
  privateTrace: EstimateTrace;
};

export type AiEstimateErr = {
  ok: false;
  code: "website_handoff" | "unavailable";
  error: string;
};

export type AiEstimateResult = AiEstimateOk | AiEstimateErr;

type EstimateDeps = {
  completeJson?: CompleteJsonFn;
  model?: string;
  now?: Date;
  estimateEnabled?: boolean;
};

function inputHash(parts: unknown): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

async function maybeComplete(
  system: string,
  user: string,
  deps: EstimateDeps,
): Promise<unknown | null> {
  if (deps.completeJson) {
    return deps.completeJson(system, user);
  }
  if (deps.estimateEnabled === false) return null;

  try {
    const openai = await import("./openai");
    if (deps.estimateEnabled !== true && !openai.isAiEstimateEnabled()) return null;
    return await openai.completeEstimateJson(system, user);
  } catch (error) {
    console.error("AI estimate failed", error);
    return null;
  }
}

function resolveModel(deps: EstimateDeps): string {
  return (
    deps.model ??
    process.env.PROJECT_BLUEPRINT_AI_ESTIMATE_MODEL ??
    DEFAULT_ESTIMATE_MODEL
  );
}

export async function runAiEstimate(
  input: {
    answers: ProjectBlueprintAnswers;
    concept?: IntakeConcept | null;
    estimateId?: string | null;
  },
  deps: EstimateDeps = {},
): Promise<AiEstimateResult> {
  const answers = input.answers;
  if (answersLookLikeWebsiteOnly(answers)) {
    return {
      ok: false,
      code: "website_handoff",
      error:
        "This looks like a marketing website. Website packages are a better fit than a custom-build estimate.",
    };
  }

  const scope = buildScopeSnapshot(answers);
  const ideaText = ideaTextFromAnswers(answers);
  const system = buildEstimateSystemPrompt();
  const user = buildEstimateUserPrompt({
    ideaText,
    concept: input.concept ?? null,
    scope,
    promptVersion: PROMPT_VERSION,
  });
  const model = resolveModel(deps);

  let raw = await maybeComplete(system, user, deps);
  let parsed = raw ? parseEstimatePayload(raw) : null;

  if (raw && !parsed) {
    const issues = formatEstimateValidationIssues(raw);
    raw = await maybeComplete(
      system,
      `${user}\n\nYour previous JSON failed validation (${issues}). Return corrected JSON only.`,
      deps,
    );
    parsed = raw ? parseEstimatePayload(raw) : null;
  }

  if (!parsed) {
    return {
      ok: false,
      code: "unavailable",
      error:
        "We could not build a planning estimate just now. Please try again shortly, or talk to the team.",
    };
  }

  if (parsed.kind === "website_handoff") {
    return {
      ok: false,
      code: "website_handoff",
      error:
        "This looks like a marketing website. Website packages are a better fit than a custom-build estimate.",
    };
  }

  const guarded = applyEstimateGuards(parsed);
  const generatedAt = (deps.now ?? new Date()).toISOString();
  const publicResult = mapEstimateToPublicResult({
    guarded,
    estimateId: input.estimateId ?? "pending",
    generatedAt,
    confirmedConcept: input.concept ?? null,
  });

  const privateTrace: EstimateTrace = {
    promptVersion: PROMPT_VERSION,
    model,
    inputHash: inputHash({
      promptVersion: PROMPT_VERSION,
      model,
      ideaText,
      concept: input.concept ?? null,
      scope,
    }),
    rawModelJson: parsed,
    guardAdjustments: guarded.adjustments,
    publicResult,
  };

  return { ok: true, publicResult, privateTrace };
}

export function estimateUserPromptContainsBudget(userPrompt: string): boolean {
  return /budgetBand|budgetNotes|"budget"/i.test(userPrompt);
}
