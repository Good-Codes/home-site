/**
 * Plain-language review summary generated from normalised answers.
 */

import { normalizeAnswers } from "./answers";
import { shouldRecommendDiscovery } from "./branching/rules";
import type { ProjectBlueprintAnswers, ReviewSummary, ReviewSummarySection } from "./types";

const LABELS: Record<string, string> = {
  "route.website": "business website",
  "route.custom_web_platform": "custom web platform",
  "route.customer_portal": "customer portal",
  "route.internal_system": "internal business system",
  "route.mobile_app": "mobile application",
  "route.saas_multi_tenant": "SaaS / multi-tenant product",
  "route.api_integration": "API or integration project",
  "route.cloud_modernisation": "cloud or modernisation project",
  "route.audit_roadmap": "technical audit or roadmap engagement",
  "route.unsure": "custom product still being defined",

  "start.new_idea": "a new idea",
  "start.validated_concept": "a validated concept",
  "start.existing_prototype": "an existing prototype",
  "start.existing_product": "an existing product",
  "start.legacy_replacement": "a legacy replacement",
  "start.connect_systems": "connecting existing systems",
  "start.stabilisation_scaling": "stabilisation or scaling work",
  "start.needs_discovery": "discovery-first planning",

  "outcome.revenue_product": "launch a revenue-generating product",
  "outcome.reduce_manual_work": "reduce manual work",
  "outcome.improve_customer_service": "improve customer service",
  "outcome.replace_spreadsheets": "replace spreadsheets or disconnected tools",
  "outcome.support_scale": "support more users or transactions",
  "outcome.improve_security": "improve security or reliability",
  "outcome.regulatory": "meet regulatory or operational requirements",
  "outcome.modernise": "modernise an existing platform",

  "surface.public_web": "public web application",
  "surface.customer_portal": "authenticated customer portal",
  "surface.admin_workspace": "administration workspace",
  "surface.mobile_web": "responsive mobile web",
  "surface.native_mobile": "iOS and Android apps",
  "surface.public_api": "public or partner API",
  "surface.background_jobs": "background jobs / automation",
  "surface.reporting": "reporting and analytics",
  "surface.cloud_platform": "cloud infrastructure",

  "level.prototype": "clickable prototype",
  "level.poc": "technical proof of concept",
  "level.lean_validation": "lean validation release",
  "level.production_mvp": "production-ready MVP",
  "level.scale_ready": "scale-ready product",
  "level.enterprise_regulated": "enterprise or regulated platform",
  "level.not_sure": "product level still open",

  "timing.no_deadline": "no fixed deadline",
  "timing.within_3_months": "within three months",
  "timing.3_to_6_months": "three to six months",
  "timing.6_to_12_months": "six to twelve months",
  "timing.over_12_months": "more than twelve months",
  "timing.date_required": "a fixed commercial or regulatory date",
  "timing.not_sure": "timing still open",

  "migration.none": "no existing data migration",
  "migration.spreadsheet": "spreadsheet or CSV import",
  "migration.standard_db": "standard database migration",
  "migration.multiple_sources": "multiple data sources",
  "migration.poor_structure": "poorly structured data",
  "migration.large_history": "large historical volume",
  "migration.unknown": "migration complexity unknown",

  "scale.under_100": "fewer than 100 users",
  "scale.100_1000": "100–1,000 users",
  "scale.1000_10000": "1,000–10,000 users",
  "scale.10000_100000": "10,000–100,000 users",
  "scale.over_100000": "more than 100,000 users",
  "scale.unknown": "user volume unknown",

  "roles.1_2": "1–2 user roles",
  "roles.3_5": "3–5 user roles",
  "roles.6_plus": "6 or more user roles",
};

function labelOf(id: string | null | undefined, fallback = "not specified"): string {
  if (!id) return fallback;
  return LABELS[id] ?? id.replace(/^.*\./, "").replace(/_/g, " ");
}

function listLabels(ids: string[] | undefined, limit = 6): string {
  if (!ids?.length) return "none selected yet";
  const labels = ids.map((id) => labelOf(id));
  if (labels.length <= limit) return labels.join(", ");
  return `${labels.slice(0, limit).join(", ")}, and ${labels.length - limit} more`;
}

function capabilityHighlights(capabilities: string[]): string[] {
  const highlights: string[] = [];
  if (capabilities.some((c) => c.startsWith("cap.payments."))) highlights.push("payment processing");
  if (capabilities.some((c) => c.startsWith("cap.access.kyc"))) highlights.push("identity verification");
  if (capabilities.some((c) => c.startsWith("cap.workflow."))) highlights.push("document or business workflows");
  if (capabilities.some((c) => c.startsWith("cap.ai."))) highlights.push("automation or AI-assisted features");
  if (capabilities.includes("cap.data.files")) highlights.push("document management");
  if (capabilities.includes("cap.data.audit_history")) highlights.push("audit history");
  return highlights;
}

function collectUnknowns(answers: ProjectBlueprintAnswers): string[] {
  const unknowns: string[] = [];
  for (const [questionId, choice] of Object.entries(answers.unknowns ?? {})) {
    unknowns.push(`${questionId} (${choice})`);
  }
  if (answers.route === "route.unsure") unknowns.push("Product type is still open.");
  if (answers.startingPoint === "start.needs_discovery") unknowns.push("Discovery is needed before scope is firm.");
  if (answers.productLevel === "level.not_sure") unknowns.push("Target product level is not decided.");
  if (answers.userScale === "scale.unknown") unknowns.push("User scale is unknown.");
  if (answers.migrationProfile === "migration.unknown") unknowns.push("Migration complexity is unknown.");
  if (answers.integrations?.includes("integration.unknown")) {
    unknowns.push("Some integrations are still unknown.");
  }
  if (answers.timing === "timing.not_sure") unknowns.push("Delivery timing is still open.");
  return unknowns;
}

function buildHeadline(answers: ProjectBlueprintAnswers): string {
  const level = labelOf(answers.productLevel, "custom product");
  const route = labelOf(answers.route, "custom product");
  const surfaces = answers.surfaces?.length
    ? listLabels(answers.surfaces, 3)
    : "surfaces still being confirmed";
  const roles = labelOf(answers.roleCountBand, "roles still open");
  const caps = capabilityHighlights(answers.capabilities ?? []);
  const integrations = (answers.integrations ?? []).filter(
    (id) => id !== "integration.none" && id !== "integration.unknown",
  );

  const parts = [
    `You are planning a ${level} shaped as a ${route}`,
    `with ${surfaces}`,
    roles !== "roles still open" ? roles : null,
    caps.length ? caps.join(", ") : null,
    integrations.length
      ? `${integrations.length} external integration${integrations.length === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  let headline = parts.join(", ") + ".";
  if (shouldRecommendDiscovery(answers)) {
    headline += " Discovery is likely the safest first step while key unknowns remain.";
  }
  return headline;
}

/**
 * Build a plain-language review summary for the review screen.
 */
export function buildReviewSummary(answersInput: ProjectBlueprintAnswers): ReviewSummary {
  const answers = normalizeAnswers(answersInput);
  const unknowns = collectUnknowns(answers);

  const sections: ReviewSummarySection[] = [
    {
      id: "overview",
      title: "Overview",
      body: buildHeadline(answers),
      highlightUnknowns: unknowns.slice(0, 5),
    },
    {
      id: "context",
      title: "Project context",
      body: `Starting from ${labelOf(answers.startingPoint)}. Primary outcome: ${labelOf(answers.primaryOutcome)}.`,
    },
    {
      id: "surfaces",
      title: "Product surfaces",
      body: `Surfaces in scope: ${listLabels(answers.surfaces)}.`,
    },
    {
      id: "users",
      title: "Users and scale",
      body: `User groups: ${listLabels(answers.userGroups, 5)}. Scale: ${labelOf(answers.userScale)}. Roles: ${labelOf(answers.roleCountBand)}.${
        answers.multiTenant === true ? " Multi-tenant separation is required." : ""
      }`,
    },
    {
      id: "capabilities",
      title: "Core capabilities",
      body: `Selected capabilities: ${listLabels(answers.capabilities, 8)}.`,
    },
    {
      id: "integrations",
      title: "Integrations and migration",
      body: `Integrations: ${listLabels(answers.integrations, 6)}. Migration: ${labelOf(answers.migrationProfile)}.`,
    },
    {
      id: "quality",
      title: "Quality and risk",
      body: `Quality and security expectations: ${listLabels(answers.qualityRequirements, 6)}.${
        answers.regulatedControls?.length
          ? ` Regulated controls: ${listLabels(answers.regulatedControls, 5)}.`
          : ""
      }`,
    },
    {
      id: "delivery",
      title: "Delivery readiness",
      body: `Existing assets: ${listLabels(answers.existingAssets, 5)}. Target level: ${labelOf(answers.productLevel)}. Timing: ${labelOf(answers.timing)}.${
        answers.budgetBand ? " An optional budget band was shared for commercial context only." : ""
      }`,
    },
  ];

  const assumptions: string[] = [
    "This is a planning estimate based on the answers above, not a fixed quotation.",
    "Third-party provider fees are excluded unless later agreed in a reviewed quotation.",
  ];

  if (answers.multipleLanguages !== true) {
    assumptions.push("One language is assumed for the first release unless stated otherwise.");
  }
  if (!answers.integrations?.length || answers.integrations.includes("integration.none")) {
    assumptions.push("No external system integrations are assumed for the first release.");
  }
  if (answers.migrationProfile === "migration.none") {
    assumptions.push("No historical data migration is included.");
  }
  if (answers.productLevel === "level.production_mvp" || !answers.productLevel) {
    assumptions.push("The first release is assumed to be production-operable rather than a disposable prototype.");
  }

  return {
    headline: buildHeadline(answers),
    sections,
    assumptions,
    unknowns,
  };
}
