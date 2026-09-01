/**
 * Adaptive branching predicates for Project Blueprint screens and follow-ups.
 */

import type { ProjectBlueprintAnswers } from "../types";

const WEBSITE_ROUTE = "route.website";

const MOBILE_SURFACE_IDS = new Set([
  "surface.native_mobile",
  "surface.mobile_web",
]);

const PAYMENT_CAPABILITY_PREFIX = "cap.payments.";

const AI_CAPABILITY_PREFIX = "cap.ai.";

const REGULATED_QUALITY_IDS = new Set([
  "quality.financial_info",
  "quality.identity_documents",
  "quality.payment_card_info",
  "quality.industry_compliance",
  "quality.popia_privacy",
  "quality.audit_traceability",
]);

function list(answers: ProjectBlueprintAnswers, key: keyof ProjectBlueprintAnswers): string[] {
  const value = answers[key];
  return Array.isArray(value) ? (value as string[]) : [];
}

function hasAny(haystack: string[], needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

function isTruthyFlag(value: unknown): boolean {
  return value === true;
}

/** Website route leaves Project Blueprint entirely. */
export function isWebsiteRoute(answers: ProjectBlueprintAnswers): boolean {
  return answers.route === WEBSITE_ROUTE;
}

export function isCustomSoftwareRoute(answers: ProjectBlueprintAnswers): boolean {
  return Boolean(answers.route) && answers.route !== WEBSITE_ROUTE;
}

export function needsMobileFollowUps(answers: ProjectBlueprintAnswers): boolean {
  const surfaces = list(answers, "surfaces");
  return (
    answers.route === "route.mobile_app" ||
    surfaces.includes("surface.native_mobile") ||
    (surfaces.includes("surface.mobile_web") &&
      answers.route !== "route.website")
  );
}

export function needsNativeMobileFollowUps(answers: ProjectBlueprintAnswers): boolean {
  return (
    answers.route === "route.mobile_app" ||
    list(answers, "surfaces").includes("surface.native_mobile")
  );
}

export function hasPaymentsCapability(answers: ProjectBlueprintAnswers): boolean {
  return list(answers, "capabilities").some((id) => id.startsWith(PAYMENT_CAPABILITY_PREFIX));
}

export function needsPaymentsFollowUps(answers: ProjectBlueprintAnswers): boolean {
  return hasPaymentsCapability(answers);
}

export function isMultiTenantSelected(answers: ProjectBlueprintAnswers): boolean {
  return (
    answers.route === "route.saas_multi_tenant" ||
    answers.multiTenant === true ||
    list(answers, "userGroups").includes("users.tenants") ||
    list(answers, "capabilities").includes("cap.access.org_onboarding")
  );
}

export function needsMultiTenantFollowUps(answers: ProjectBlueprintAnswers): boolean {
  return isMultiTenantSelected(answers);
}

export function hasKycCapability(answers: ProjectBlueprintAnswers): boolean {
  return list(answers, "capabilities").includes("cap.access.kyc");
}

export function needsKycFollowUps(answers: ProjectBlueprintAnswers): boolean {
  return hasKycCapability(answers);
}

export function isExistingProduct(answers: ProjectBlueprintAnswers): boolean {
  return (
    answers.startingPoint === "start.existing_product" ||
    answers.startingPoint === "start.stabilisation_scaling" ||
    answers.startingPoint === "start.existing_prototype"
  );
}

export function needsExistingProductFollowUps(answers: ProjectBlueprintAnswers): boolean {
  return (
    answers.startingPoint === "start.existing_product" ||
    answers.startingPoint === "start.stabilisation_scaling"
  );
}

export function isLegacyReplacement(answers: ProjectBlueprintAnswers): boolean {
  return answers.startingPoint === "start.legacy_replacement";
}

export function needsLegacyFollowUps(answers: ProjectBlueprintAnswers): boolean {
  return isLegacyReplacement(answers);
}

export function hasAiCapability(answers: ProjectBlueprintAnswers): boolean {
  return list(answers, "capabilities").some((id) => id.startsWith(AI_CAPABILITY_PREFIX));
}

export function needsAiFollowUps(answers: ProjectBlueprintAnswers): boolean {
  return hasAiCapability(answers);
}

export function isCloudModernisation(answers: ProjectBlueprintAnswers): boolean {
  return (
    answers.route === "route.cloud_modernisation" ||
    list(answers, "surfaces").includes("surface.cloud_platform") ||
    answers.primaryOutcome === "outcome.modernise"
  );
}

export function needsCloudFollowUps(answers: ProjectBlueprintAnswers): boolean {
  return isCloudModernisation(answers);
}

export function hasIntegrations(answers: ProjectBlueprintAnswers): boolean {
  const integrations = list(answers, "integrations");
  return (
    integrations.length > 0 &&
    !integrations.includes("integration.none") &&
    !integrations.every((id) => id === "integration.unknown")
  );
}

export function needsIntegrationDetails(answers: ProjectBlueprintAnswers): boolean {
  return hasIntegrations(answers);
}

export function needsMigrationFollowUps(answers: ProjectBlueprintAnswers): boolean {
  const profile = answers.migrationProfile;
  return Boolean(
    profile &&
      profile !== "migration.none" &&
      profile !== "migration.unknown",
  );
}

export function isRegulatedOrSensitive(answers: ProjectBlueprintAnswers): boolean {
  const quality = list(answers, "qualityRequirements");
  return (
    hasAny([...quality], [...REGULATED_QUALITY_IDS]) ||
    hasKycCapability(answers) ||
    hasPaymentsCapability(answers) ||
    answers.primaryOutcome === "outcome.regulatory"
  );
}

export function needsRegulatedFollowUps(answers: ProjectBlueprintAnswers): boolean {
  return isRegulatedOrSensitive(answers);
}

/** Aggressive timing relative to ambitious product level. */
export function hasDeadlineConflict(answers: ProjectBlueprintAnswers): boolean {
  const timing = answers.timing;
  const level = answers.productLevel;
  if (!timing || timing === "timing.no_deadline" || timing === "timing.not_sure") {
    return false;
  }

  const ambitious =
    level === "level.scale_ready" ||
    level === "level.enterprise_regulated" ||
    level === "level.production_mvp";

  const tight =
    timing === "timing.within_3_months" ||
    timing === "timing.date_required";

  const moderatePressure =
    timing === "timing.3_to_6_months" &&
    (level === "level.scale_ready" || level === "level.enterprise_regulated");

  return (ambitious && tight) || moderatePressure;
}

export function needsDeadlineConflictFollowUps(answers: ProjectBlueprintAnswers): boolean {
  return hasDeadlineConflict(answers);
}

export function isConnectSystemsStart(answers: ProjectBlueprintAnswers): boolean {
  return answers.startingPoint === "start.connect_systems";
}

export function isDiscoveryStart(answers: ProjectBlueprintAnswers): boolean {
  return (
    answers.startingPoint === "start.needs_discovery" ||
    answers.route === "route.audit_roadmap" ||
    answers.route === "route.unsure"
  );
}

export function countSignificantUnknowns(answers: ProjectBlueprintAnswers): number {
  const markers: unknown[] = [
    answers.route === "route.unsure" ? 1 : 0,
    answers.startingPoint === "start.needs_discovery" ? 1 : 0,
    answers.productLevel === "level.not_sure" ? 1 : 0,
    answers.userScale === "scale.unknown" ? 1 : 0,
    answers.migrationProfile === "migration.unknown" ? 1 : 0,
    answers.timing === "timing.not_sure" ? 1 : 0,
  ];

  const unknownEntries = Object.values(answers.unknowns ?? {}).length;
  const integrationUnknown = list(answers, "integrations").includes("integration.unknown")
    ? 1
    : 0;

  return markers.filter(Boolean).length + unknownEntries + integrationUnknown;
}

export function shouldRecommendDiscovery(answers: ProjectBlueprintAnswers): boolean {
  return (
    isDiscoveryStart(answers) ||
    countSignificantUnknowns(answers) >= 3 ||
    (isLegacyReplacement(answers) && answers.migrationProfile === "migration.unknown") ||
    (needsRegulatedFollowUps(answers) && countSignificantUnknowns(answers) >= 2)
  );
}

/** Whether a given screen should appear in the guided journey. */
export function isScreenVisible(
  screenId: import("../types").ScreenId,
  answers: ProjectBlueprintAnswers,
): boolean {
  if (screenId === "route") return true;
  if (isWebsiteRoute(answers)) return false;
  if (screenId === "review") return isCustomSoftwareRoute(answers);

  // All primary scoping screens appear for custom routes; follow-ups adapt within.
  return isCustomSoftwareRoute(answers);
}

export {
  WEBSITE_ROUTE,
  MOBILE_SURFACE_IDS,
  PAYMENT_CAPABILITY_PREFIX,
  AI_CAPABILITY_PREFIX,
  REGULATED_QUALITY_IDS,
  isTruthyFlag,
};
