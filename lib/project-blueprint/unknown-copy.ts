/**
 * Plain-language copy for unknown markers (question ids in answers.unknowns).
 * Safe for client bundles — no pricing.
 */

import type { UnknownChoice } from "./types";

const UNKNOWN_TOPICS: Record<string, string> = {
  "q.route.product_type": "Product type",
  "q.context.starting_point": "Where you are starting from",
  "q.context.primary_outcome": "The main outcome you want",
  "q.surfaces.channels": "Where people will use the product",
  "q.users.groups": "Who will use the product",
  "q.users.scale": "How many people will use it",
  "q.users.role_count": "How many user roles are needed",
  "q.users.permissions": "Role-based permissions",
  "q.users.multi_tenant": "Multi-organisation (tenant) separation",
  "q.intake.payments": "Whether people will pay inside the product",
  "q.cap.access": "How people will sign in",
  "q.cap.workflows": "Workflows and document processes",
  "q.cap.payments": "Payment capabilities",
  "q.cap.data": "Data and document handling",
  "q.cap.comms": "Messaging and notifications",
  "q.cap.intelligence": "Automation or AI-assisted features",
  "q.integrations.systems": "Whether this needs to connect to other systems",
  "q.integrations.migration": "Data migration",
  "q.quality.requirements": "Whether this handles sensitive or regulated information",
  "q.delivery.assets": "Existing assets you can reuse",
  "q.delivery.product_level": "The target product level",
  "q.delivery.timing": "Delivery timing",
};

const CHOICE_TAIL: Record<UnknownChoice, string> = {
  not_sure: "is still open",
  unknown: "is still unknown",
  help_me_choose: "needs a recommendation",
  need_advice: "needs specialist advice",
};

function looksLikeQuestionId(value: string): boolean {
  return /^q\.[a-z0-9_.]+$/i.test(value.trim());
}

function humanizeQuestionId(questionId: string): string {
  const cleaned = questionId
    .replace(/^q\./, "")
    .replace(/^followup\./, "")
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "This detail";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function formatUnknownMarker(
  questionId: string,
  choice: UnknownChoice | string = "not_sure",
): string {
  const topic = UNKNOWN_TOPICS[questionId] ?? humanizeQuestionId(questionId);
  const tail =
    CHOICE_TAIL[choice as UnknownChoice] ?? CHOICE_TAIL.not_sure;
  return `${topic} ${tail}.`;
}

/** Engine public lists store question ids without the choice — still hide the raw id. */
export function formatUnknownQuestionId(questionId: string): string {
  if (!looksLikeQuestionId(questionId)) return questionId;
  return formatUnknownMarker(questionId, "not_sure");
}
