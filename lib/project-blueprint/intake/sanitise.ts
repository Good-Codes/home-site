/**
 * Sanitise intake model output: catalogue IDs only, no prices, honest unknowns.
 */

import { normalizeAnswers } from "../answers";
import type {
  IntakeConcept,
  ProjectBlueprintAnswers,
  UnknownChoice,
} from "../types";
import { filterCatalogueIds, isCatalogueOptionId } from "./taxonomy";

const PRICING_PATTERN =
  /\bR\s?\d[\d\s,]*(?:k|m)?\b|\bZAR\b|\bUSD\b|\$\s?\d[\d\s,]*|\bprice[ds]?\b|\bcosting\b|\bquote of\b|\bestimate of\b|\d+\s*(?:hours?|hrs|weeks?|days?|rand)\b/gi;

const LIST_CAPS = {
  surfaces: 6,
  capabilities: 16,
  integrations: 8,
  qualityRequirements: 8,
  userGroups: 6,
  existingAssets: 8,
  regulatedControls: 8,
} as const;

const SCALAR_KEYS = [
  "route",
  "startingPoint",
  "primaryOutcome",
  "userScale",
  "roleCountBand",
  "migrationProfile",
  "productLevel",
  "timing",
] as const;

export function stripPricingLanguage(text: string): string {
  return text
    .replace(PRICING_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function scalarOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  return isCatalogueOptionId(value) ? value : null;
}

function mergeUnknowns(
  base: Record<string, UnknownChoice> | undefined,
  patch: Record<string, UnknownChoice> | undefined,
): Record<string, UnknownChoice> {
  return { ...(base ?? {}), ...(patch ?? {}) };
}

function surfacesForRoute(route: string | null): string[] {
  switch (route) {
    case "route.customer_portal":
      return ["surface.customer_portal", "surface.admin_workspace"];
    case "route.internal_system":
      return ["surface.admin_workspace"];
    case "route.mobile_app":
      return ["surface.native_mobile"];
    case "route.saas_multi_tenant":
      return [
        "surface.public_web",
        "surface.customer_portal",
        "surface.admin_workspace",
      ];
    case "route.api_integration":
      return ["surface.public_api"];
    case "route.cloud_modernisation":
      return ["surface.cloud_platform"];
    case "route.audit_roadmap":
      return ["surface.public_web"];
    default:
      return ["surface.public_web"];
  }
}

function userGroupsForRoute(route: string | null): string[] {
  switch (route) {
    case "route.internal_system":
      return ["users.employees", "users.administrators"];
    case "route.saas_multi_tenant":
      return ["users.customers", "users.tenants", "users.administrators"];
    case "route.customer_portal":
      return ["users.customers", "users.administrators"];
    default:
      return ["users.customers"];
  }
}

export function mergeAnswerPatch(
  base: ProjectBlueprintAnswers,
  patch: Partial<ProjectBlueprintAnswers>,
): ProjectBlueprintAnswers {
  const next: ProjectBlueprintAnswers = { ...base };

  for (const key of SCALAR_KEYS) {
    const value = scalarOrNull(patch[key] ?? null);
    if (value) next[key] = value;
  }

  if (patch.surfaces?.length) {
    next.surfaces = filterCatalogueIds(patch.surfaces, LIST_CAPS.surfaces);
  }
  if (patch.capabilities?.length) {
    next.capabilities = filterCatalogueIds(
      patch.capabilities,
      LIST_CAPS.capabilities,
    );
  }
  if (patch.integrations?.length) {
    next.integrations = filterCatalogueIds(
      patch.integrations,
      LIST_CAPS.integrations,
    );
  }
  if (patch.qualityRequirements?.length) {
    next.qualityRequirements = filterCatalogueIds(
      patch.qualityRequirements,
      LIST_CAPS.qualityRequirements,
    );
  }
  if (patch.userGroups?.length) {
    next.userGroups = filterCatalogueIds(patch.userGroups, LIST_CAPS.userGroups);
  }
  if (patch.existingAssets?.length) {
    next.existingAssets = filterCatalogueIds(
      patch.existingAssets,
      LIST_CAPS.existingAssets,
    );
  }
  if (patch.regulatedControls?.length) {
    next.regulatedControls = filterCatalogueIds(
      patch.regulatedControls,
      LIST_CAPS.regulatedControls,
    );
  }

  if (patch.multiTenant === true || patch.multiTenant === false) {
    next.multiTenant = patch.multiTenant;
  } else if (
    patch.multiTenant === "not_sure" ||
    patch.multiTenant === "need_advice" ||
    patch.multiTenant === "help_me_choose" ||
    patch.multiTenant === "unknown"
  ) {
    next.multiTenant = patch.multiTenant;
  }

  if (patch.roleBasedPermissions !== undefined) {
    next.roleBasedPermissions = patch.roleBasedPermissions;
  }

  next.unknowns = mergeUnknowns(base.unknowns, patch.unknowns);
  if (patch.ideaText) next.ideaText = patch.ideaText;

  return next;
}

export function fillDefaultsAndUnknowns(
  answers: ProjectBlueprintAnswers,
  ideaText: string,
): ProjectBlueprintAnswers {
  const next: ProjectBlueprintAnswers = {
    ...answers,
    ideaText: ideaText.trim() || answers.ideaText || null,
    unknowns: { ...answers.unknowns },
  };

  if (next.route === "route.website") return normalizeAnswers(next);

  if (!next.route) {
    next.route = "route.unsure";
    next.unknowns!["q.route.product_type"] = "not_sure";
  }

  if (!next.startingPoint) {
    next.startingPoint = "start.new_idea";
    next.unknowns!["q.context.starting_point"] = "not_sure";
  }

  if (!next.primaryOutcome) {
    next.primaryOutcome = "outcome.reduce_manual_work";
    next.unknowns!["q.context.primary_outcome"] = "not_sure";
  }

  if (!next.surfaces?.length) {
    next.surfaces = surfacesForRoute(next.route ?? null);
    next.unknowns!["q.surfaces.channels"] = "not_sure";
  }

  if (!next.userGroups?.length) {
    next.userGroups = userGroupsForRoute(next.route ?? null);
    next.unknowns!["q.users.groups"] = "not_sure";
  }

  if (!next.userScale) {
    next.userScale = "scale.unknown";
    next.unknowns!["q.users.scale"] = "not_sure";
  }

  if (!next.roleCountBand) {
    next.roleCountBand = "roles.3_5";
    next.unknowns!["q.users.role_count"] = "not_sure";
  }

  if (next.multiTenant == null) {
    next.multiTenant =
      next.route === "route.saas_multi_tenant" ||
      (next.userGroups ?? []).includes("users.tenants");
  }

  if (!next.capabilities?.length) {
    const needsAccounts =
      next.route === "route.customer_portal" ||
      next.route === "route.saas_multi_tenant" ||
      (next.surfaces ?? []).includes("surface.customer_portal");
    next.capabilities = needsAccounts ? ["cap.access.registration_login"] : [];
    next.unknowns!["q.cap.access"] = "not_sure";
  } else if (
    (next.route === "route.customer_portal" ||
      next.route === "route.saas_multi_tenant" ||
      (next.surfaces ?? []).includes("surface.customer_portal")) &&
    !next.capabilities.includes("cap.access.registration_login")
  ) {
    next.capabilities = [
      "cap.access.registration_login",
      ...next.capabilities,
    ];
  }

  if (!next.integrations?.length) {
    next.integrations = ["integration.none"];
  }

  if (!next.migrationProfile) {
    next.migrationProfile = next.integrations.includes("integration.none")
      ? "migration.none"
      : "migration.unknown";
    if (next.migrationProfile === "migration.unknown") {
      next.unknowns!["q.integrations.migration"] = "not_sure";
    }
  }

  if (!next.productLevel) {
    next.productLevel = "level.production_mvp";
    next.unknowns!["q.delivery.product_level"] = "not_sure";
  }

  if (!next.timing) {
    next.timing = "timing.not_sure";
    next.unknowns!["q.delivery.timing"] = "not_sure";
  }

  if (!next.existingAssets?.length) {
    next.existingAssets = ["asset.nothing"];
  }

  next.surfaces = filterCatalogueIds(next.surfaces, LIST_CAPS.surfaces);
  next.capabilities = filterCatalogueIds(
    next.capabilities,
    LIST_CAPS.capabilities,
  );
  next.integrations = filterCatalogueIds(
    next.integrations,
    LIST_CAPS.integrations,
  );
  next.qualityRequirements = filterCatalogueIds(
    next.qualityRequirements,
    LIST_CAPS.qualityRequirements,
  );
  next.userGroups = filterCatalogueIds(next.userGroups, LIST_CAPS.userGroups);

  return normalizeAnswers(next);
}

/**
 * Drop illegal catalogue IDs without inventing defaults.
 * Use this before choosing follow-ups so guesses do not look like answers.
 */
export function filterCatalogueAnswers(
  answers: ProjectBlueprintAnswers,
): ProjectBlueprintAnswers {
  return normalizeAnswers({
    ...answers,
    route: scalarOrNull(answers.route),
    startingPoint: scalarOrNull(answers.startingPoint),
    primaryOutcome: scalarOrNull(answers.primaryOutcome),
    userScale: scalarOrNull(answers.userScale),
    roleCountBand: scalarOrNull(answers.roleCountBand),
    migrationProfile: scalarOrNull(answers.migrationProfile),
    productLevel: scalarOrNull(answers.productLevel),
    timing: scalarOrNull(answers.timing),
    surfaces: filterCatalogueIds(answers.surfaces, LIST_CAPS.surfaces),
    capabilities: filterCatalogueIds(
      answers.capabilities,
      LIST_CAPS.capabilities,
    ),
    integrations: filterCatalogueIds(
      answers.integrations,
      LIST_CAPS.integrations,
    ),
    qualityRequirements: filterCatalogueIds(
      answers.qualityRequirements,
      LIST_CAPS.qualityRequirements,
    ),
    userGroups: filterCatalogueIds(answers.userGroups, LIST_CAPS.userGroups),
    existingAssets: filterCatalogueIds(
      answers.existingAssets,
      LIST_CAPS.existingAssets,
    ),
    regulatedControls: filterCatalogueIds(
      answers.regulatedControls,
      LIST_CAPS.regulatedControls,
    ),
  });
}

export function sanitiseAnswers(
  answers: ProjectBlueprintAnswers,
  ideaText: string,
): ProjectBlueprintAnswers {
  return fillDefaultsAndUnknowns(filterCatalogueAnswers(answers), ideaText);
}

const DEFAULT_CONCEPT: IntakeConcept = {
  headline: "A custom software product",
  summary:
    "We captured a working picture of the product so we can produce a planning estimate. A specialist will refine this before a formal quotation.",
  whoItsFor: "The people who will use or operate the product.",
  coreCapabilities: [],
  assumptions: [
    "Some details were inferred and can be corrected before a formal quote.",
  ],
};

export function sanitiseConcept(
  concept: Partial<IntakeConcept> | null | undefined,
  answers: ProjectBlueprintAnswers,
): IntakeConcept {
  const headline =
    stripPricingLanguage(concept?.headline ?? "") ||
    DEFAULT_CONCEPT.headline;
  const summary =
    stripPricingLanguage(concept?.summary ?? "") || DEFAULT_CONCEPT.summary;
  const whoItsFor =
    stripPricingLanguage(concept?.whoItsFor ?? "") || DEFAULT_CONCEPT.whoItsFor;

  const coreCapabilities = (concept?.coreCapabilities ?? [])
    .map((item) => stripPricingLanguage(item))
    .filter(Boolean)
    .slice(0, 12);

  const assumptions = (concept?.assumptions ?? [])
    .map((item) => stripPricingLanguage(item))
    .filter(Boolean)
    .slice(0, 10);

  if (answers.route === "route.website") {
    return {
      headline: headline || "A business website",
      summary:
        summary ||
        "This sounds like a marketing or brochure website, which is a better fit for website packages than a custom product estimate.",
      whoItsFor: whoItsFor || "Visitors learning about the business.",
      coreCapabilities,
      assumptions,
    };
  }

  return {
    headline,
    summary,
    whoItsFor,
    coreCapabilities:
      coreCapabilities.length > 0
        ? coreCapabilities
        : DEFAULT_CONCEPT.coreCapabilities,
    assumptions:
      assumptions.length > 0 ? assumptions : DEFAULT_CONCEPT.assumptions,
  };
}

export function dropIllegalIds(ids: string[]): string[] {
  return filterCatalogueIds(ids, 40);
}
