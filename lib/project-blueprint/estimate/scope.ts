/**
 * Compact, human-readable scope for the estimator. Never includes budget.
 */

import { buildReviewSummary } from "../summary";
import type { ProjectBlueprintAnswers } from "../types";

export type ScopeSnapshot = {
  productKind: string;
  startingPoint: string;
  surfaces: string[];
  userGroups: string[];
  payments: string;
  integrations: string[];
  quality: string[];
  timing: string;
  mobileInScope: boolean;
  unknowns: string[];
};

function isPresentScopeId(id: string): boolean {
  return !id.endsWith(".none") && !id.endsWith(".unknown") && id !== "not_sure";
}

function humanize(id: string): string {
  return id.replace(/^.*\./, "").replace(/_/g, " ");
}

function paymentsLabel(answers: ProjectBlueprintAnswers): string {
  const caps = answers.capabilities ?? [];
  const unknown = Boolean(answers.unknowns?.["q.intake.payments"]);
  if (unknown) return "unknown";
  if (caps.some((id) => id.includes("recurring") || id.includes("subscription"))) {
    return "recurring or subscription payments";
  }
  if (caps.some((id) => id.startsWith("cap.payments."))) {
    return "in-product payments";
  }
  if (answers.paymentsFollowUps?.paymentModes?.includes("pay.none")) {
    return "none in first release";
  }
  return "none stated";
}

export function buildScopeSnapshot(answers: ProjectBlueprintAnswers): ScopeSnapshot {
  const summary = buildReviewSummary(answers);
  const surfaces = (answers.surfaces ?? []).filter(isPresentScopeId).map(humanize);
  const integrations = (answers.integrations ?? [])
    .filter(isPresentScopeId)
    .map(humanize);
  const quality = (answers.qualityRequirements ?? [])
    .filter(isPresentScopeId)
    .map(humanize);
  const userGroups = (answers.userGroups ?? []).filter(isPresentScopeId).map(humanize);

  return {
    productKind: humanize(answers.route ?? "custom software"),
    startingPoint: humanize(answers.startingPoint ?? "not specified"),
    surfaces,
    userGroups,
    payments: paymentsLabel(answers),
    integrations,
    quality,
    timing: humanize(answers.timing ?? "not specified"),
    mobileInScope:
      answers.route === "route.mobile_app" ||
      (answers.surfaces ?? []).includes("surface.native_mobile"),
    unknowns: summary.unknowns,
  };
}

export function ideaTextFromAnswers(answers: ProjectBlueprintAnswers): string {
  return (answers.ideaText ?? "").replace(/\s+/g, " ").trim();
}
