/**
 * Server barrel for Project Blueprint AI intake.
 */

import "server-only";

export { runIntake, buildIntakeSystemPrompt, buildIntakeUserPrompt } from "./run";
export type { IntakeRequest, CompleteJsonFn } from "./run";
export { isAiIntakeEnabled, parseOpenAiIntakePayload } from "./openai";
export { coerceIntakePayload, toStringList } from "./coerce";
export { checkIntakeRateLimit, clientKeyFromRequest } from "./rate-limit";
export { applyClarifications, selectClarifyingQuestions } from "./whitelist";
export { sanitiseAnswers, sanitiseConcept, stripPricingLanguage } from "./sanitise";
export { fallbackIntakeDraft, looksLikeMarketingWebsite } from "./fallback";
