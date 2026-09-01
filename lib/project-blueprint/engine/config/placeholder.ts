import "server-only";

/**
 * PLACEHOLDER seeded pricing configuration.
 *
 * ⚠ These rates, hours, margins, and tax values are CLEARLY LABELLED PLACEHOLDERS.
 * They exist so the deterministic engine can run end-to-end before Good Code
 * calibrates against historical projects. Replace via a published PricingVersion
 * before treating any output as commercially authoritative.
 *
 * isPlaceholder: true — admin UIs should warn until a calibrated version is published.
 */

import type {
  CapabilityId,
  PricingConfig,
  ScenarioDefinition,
  WorkPackage,
} from "../types";

const PLACEHOLDER_VERSION = "placeholder-v0.1.0";

/** PLACEHOLDER ZAR sell rates (per hour). Internal only — never ship to browser. */
const PLACEHOLDER_ROLES: PricingConfig["roles"] = [
  {
    roleId: "principal",
    title: "Principal / engagement lead (PLACEHOLDER)",
    sellRateZarPerHour: 2_850,
  },
  {
    roleId: "architect",
    title: "Solutions architect (PLACEHOLDER)",
    sellRateZarPerHour: 2_450,
  },
  {
    roleId: "senior_engineer",
    title: "Senior engineer (PLACEHOLDER)",
    sellRateZarPerHour: 1_950,
  },
  {
    roleId: "engineer",
    title: "Engineer (PLACEHOLDER)",
    sellRateZarPerHour: 1_450,
  },
  {
    roleId: "designer",
    title: "Product designer (PLACEHOLDER)",
    sellRateZarPerHour: 1_650,
  },
  {
    roleId: "qa",
    title: "QA engineer (PLACEHOLDER)",
    sellRateZarPerHour: 1_250,
  },
  {
    roleId: "security",
    title: "Security specialist (PLACEHOLDER)",
    sellRateZarPerHour: 2_150,
  },
  {
    roleId: "pm",
    title: "Delivery / project management (PLACEHOLDER)",
    sellRateZarPerHour: 1_550,
  },
  {
    roleId: "devops",
    title: "Cloud / DevOps (PLACEHOLDER)",
    sellRateZarPerHour: 1_850,
  },
];

function pkg(
  partial: Omit<WorkPackage, "scenarioTags"> & { scenarioTags?: WorkPackage["scenarioTags"] },
): WorkPackage {
  return partial;
}

/**
 * Work packages mapped from capability IDs:
 * discovery, UX, frontend, backend, mobile, integrations, cloud, QA, security, PM, launch
 * plus cross-cutting foundations always included via foundationPackageIds.
 */
const PLACEHOLDER_PACKAGES: WorkPackage[] = [
  pkg({
    id: "wp.discovery",
    name: "Discovery & architecture (PLACEHOLDER)",
    description:
      "Stakeholder workshops, workflow definition, technical audit, risk register, refined backlog.",
    capabilityId: "discovery",
    phase: "Discover",
    dependsOn: [],
    isFoundation: false,
    isDiscovery: true,
    lane: "discovery",
    roleEffort: [
      { roleId: "principal", hours: { low: 16, likely: 24, high: 40 } },
      { roleId: "architect", hours: { low: 24, likely: 40, high: 64 } },
      { roleId: "designer", hours: { low: 16, likely: 24, high: 40 } },
      { roleId: "pm", hours: { low: 12, likely: 20, high: 32 } },
    ],
  }),
  pkg({
    id: "wp.ux",
    name: "UX / UI & journeys (PLACEHOLDER)",
    description: "User journeys, interaction design, UI system, accessibility-minded layouts.",
    capabilityId: "ux",
    phase: "Design",
    dependsOn: [],
    isFoundation: false,
    isDiscovery: false,
    lane: "design",
    roleEffort: [
      { roleId: "designer", hours: { low: 40, likely: 80, high: 140 } },
      { roleId: "principal", hours: { low: 4, likely: 8, high: 16 } },
    ],
  }),
  pkg({
    id: "wp.frontend",
    name: "Web frontend application (PLACEHOLDER)",
    description: "Responsive web UI, state, forms, client-side quality.",
    capabilityId: "frontend",
    phase: "Build",
    dependsOn: ["wp.ux", "wp.foundation.auth"],
    isFoundation: false,
    isDiscovery: false,
    lane: "frontend",
    roleEffort: [
      { roleId: "senior_engineer", hours: { low: 60, likely: 120, high: 200 } },
      { roleId: "engineer", hours: { low: 80, likely: 160, high: 280 } },
    ],
  }),
  pkg({
    id: "wp.backend",
    name: "Backend services & APIs (PLACEHOLDER)",
    description: "Domain services, APIs, business rules, data model.",
    capabilityId: "backend",
    phase: "Build",
    dependsOn: ["wp.foundation.architecture"],
    isFoundation: false,
    isDiscovery: false,
    lane: "backend",
    roleEffort: [
      { roleId: "architect", hours: { low: 24, likely: 40, high: 64 } },
      { roleId: "senior_engineer", hours: { low: 80, likely: 160, high: 280 } },
      { roleId: "engineer", hours: { low: 60, likely: 120, high: 200 } },
    ],
  }),
  pkg({
    id: "wp.mobile",
    name: "Mobile application (PLACEHOLDER)",
    description: "iOS/Android or cross-platform app, store readiness.",
    capabilityId: "mobile",
    phase: "Build",
    dependsOn: ["wp.backend", "wp.ux"],
    isFoundation: false,
    isDiscovery: false,
    lane: "mobile",
    roleEffort: [
      { roleId: "senior_engineer", hours: { low: 80, likely: 160, high: 280 } },
      { roleId: "engineer", hours: { low: 80, likely: 140, high: 240 } },
      { roleId: "qa", hours: { low: 24, likely: 40, high: 64 } },
    ],
  }),
  pkg({
    id: "wp.integrations",
    name: "External integrations (PLACEHOLDER)",
    description: "Third-party APIs, webhooks, mapping, error handling, monitoring.",
    capabilityId: "integrations",
    phase: "Build",
    dependsOn: ["wp.backend"],
    isFoundation: false,
    isDiscovery: false,
    lane: "integrations",
    roleEffort: [
      { roleId: "senior_engineer", hours: { low: 40, likely: 80, high: 160 } },
      { roleId: "engineer", hours: { low: 40, likely: 80, high: 140 } },
      { roleId: "architect", hours: { low: 8, likely: 16, high: 32 } },
    ],
  }),
  pkg({
    id: "wp.cloud",
    name: "Cloud infrastructure & deployment (PLACEHOLDER)",
    description: "Environments, CI/CD, observability baseline, deployment runway.",
    capabilityId: "cloud",
    phase: "Harden",
    dependsOn: ["wp.foundation.architecture"],
    isFoundation: false,
    isDiscovery: false,
    lane: "platform",
    roleEffort: [
      { roleId: "devops", hours: { low: 40, likely: 80, high: 140 } },
      { roleId: "architect", hours: { low: 8, likely: 16, high: 24 } },
    ],
  }),
  pkg({
    id: "wp.qa",
    name: "Quality assurance & test design (PLACEHOLDER)",
    description: "Test strategy, critical-path coverage, regression, UAT support.",
    capabilityId: "qa",
    phase: "Harden",
    dependsOn: [],
    isFoundation: true,
    isDiscovery: false,
    lane: "qa",
    roleEffort: [
      { roleId: "qa", hours: { low: 40, likely: 80, high: 140 } },
      { roleId: "senior_engineer", hours: { low: 8, likely: 16, high: 32 } },
    ],
  }),
  pkg({
    id: "wp.security",
    name: "Security hardening (PLACEHOLDER)",
    description: "Threat review, secure defaults, dependency hygiene, access controls.",
    capabilityId: "security",
    phase: "Harden",
    dependsOn: ["wp.foundation.auth"],
    isFoundation: true,
    isDiscovery: false,
    lane: "security",
    roleEffort: [
      { roleId: "security", hours: { low: 24, likely: 48, high: 80 } },
      { roleId: "senior_engineer", hours: { low: 16, likely: 32, high: 48 } },
    ],
  }),
  pkg({
    id: "wp.pm",
    name: "Delivery management (PLACEHOLDER)",
    description: "Planning, stakeholder reviews, risk tracking, communication.",
    capabilityId: "pm",
    phase: "Deliver",
    dependsOn: [],
    isFoundation: true,
    isDiscovery: false,
    lane: "pm",
    roleEffort: [
      { roleId: "pm", hours: { low: 40, likely: 80, high: 140 } },
      { roleId: "principal", hours: { low: 8, likely: 16, high: 24 } },
    ],
  }),
  pkg({
    id: "wp.launch",
    name: "Launch, handover & stabilisation (PLACEHOLDER)",
    description: "Go-live support, handover, hypercare, documentation wrap-up.",
    capabilityId: "launch",
    phase: "Launch",
    dependsOn: ["wp.qa", "wp.cloud"],
    isFoundation: false,
    isDiscovery: false,
    lane: "launch",
    roleEffort: [
      { roleId: "pm", hours: { low: 16, likely: 24, high: 40 } },
      { roleId: "senior_engineer", hours: { low: 16, likely: 32, high: 48 } },
      { roleId: "devops", hours: { low: 8, likely: 16, high: 24 } },
    ],
  }),

  // Cross-cutting foundations (always included)
  pkg({
    id: "wp.foundation.architecture",
    name: "Architecture & environment foundations (PLACEHOLDER)",
    description: "Solution shape, repo/env setup, coding standards, baseline docs.",
    capabilityId: "backend",
    phase: "Foundations",
    dependsOn: [],
    isFoundation: true,
    isDiscovery: false,
    lane: "platform",
    roleEffort: [
      { roleId: "architect", hours: { low: 16, likely: 32, high: 48 } },
      { roleId: "devops", hours: { low: 16, likely: 24, high: 40 } },
      { roleId: "senior_engineer", hours: { low: 16, likely: 24, high: 40 } },
    ],
  }),
  pkg({
    id: "wp.foundation.auth",
    name: "Authentication & authorisation foundations (PLACEHOLDER)",
    description: "Identity, roles/permissions model, session/security basics.",
    capabilityId: "security",
    phase: "Foundations",
    dependsOn: ["wp.foundation.architecture"],
    isFoundation: true,
    isDiscovery: false,
    lane: "backend",
    roleEffort: [
      { roleId: "senior_engineer", hours: { low: 24, likely: 40, high: 64 } },
      { roleId: "security", hours: { low: 8, likely: 16, high: 24 } },
    ],
  }),
  pkg({
    id: "wp.foundation.audit",
    name: "Audit history & transaction logging (PLACEHOLDER)",
    description: "Audit trails, transaction logging, operational traceability.",
    capabilityId: "backend",
    phase: "Foundations",
    dependsOn: ["wp.backend"],
    isFoundation: true,
    isDiscovery: false,
    lane: "backend",
    roleEffort: [
      { roleId: "senior_engineer", hours: { low: 16, likely: 32, high: 48 } },
      { roleId: "engineer", hours: { low: 16, likely: 24, high: 40 } },
    ],
  }),
  pkg({
    id: "wp.foundation.a11y_responsive",
    name: "Responsive & accessibility baseline (PLACEHOLDER)",
    description: "Responsive behaviour and accessibility baseline across surfaces.",
    capabilityId: "frontend",
    phase: "Foundations",
    dependsOn: ["wp.frontend"],
    isFoundation: true,
    isDiscovery: false,
    lane: "frontend",
    roleEffort: [
      { roleId: "designer", hours: { low: 8, likely: 16, high: 24 } },
      { roleId: "engineer", hours: { low: 16, likely: 32, high: 48 } },
      { roleId: "qa", hours: { low: 8, likely: 16, high: 24 } },
    ],
  }),
  pkg({
    id: "wp.scale.ops",
    name: "Scale & operations hardening (PLACEHOLDER)",
    description: "Stronger NFR, automation, ops runbooks — scale-ready scenario.",
    capabilityId: "cloud",
    phase: "Harden",
    dependsOn: ["wp.cloud", "wp.qa"],
    isFoundation: false,
    isDiscovery: false,
    lane: "platform",
    scenarioTags: ["scale_ready"],
    roleEffort: [
      { roleId: "devops", hours: { low: 40, likely: 80, high: 120 } },
      { roleId: "architect", hours: { low: 16, likely: 32, high: 48 } },
      { roleId: "qa", hours: { low: 24, likely: 40, high: 64 } },
    ],
  }),
  pkg({
    id: "wp.migration",
    name: "Data migration (PLACEHOLDER)",
    description: "Mapping, cleansing support, trial loads, cutover plan.",
    capabilityId: "integrations",
    phase: "Build",
    dependsOn: ["wp.backend"],
    isFoundation: false,
    isDiscovery: false,
    lane: "integrations",
    roleEffort: [
      { roleId: "senior_engineer", hours: { low: 40, likely: 80, high: 160 } },
      { roleId: "engineer", hours: { low: 40, likely: 60, high: 120 } },
      { roleId: "qa", hours: { low: 16, likely: 32, high: 48 } },
    ],
  }),
];

const FOUNDATION_IDS = [
  "wp.foundation.architecture",
  "wp.foundation.auth",
  "wp.qa",
  "wp.security",
  "wp.pm",
];

/** Explicit package sets per scenario — never percentage adjustments. */
const SCENARIOS: ScenarioDefinition[] = [
  {
    id: "lean",
    name: "Lean validation",
    description:
      "Smallest credible release to validate the product or workflow, with mandatory safety foundations preserved.",
    packageIds: [
      "wp.ux",
      "wp.frontend",
      "wp.backend",
      "wp.foundation.architecture",
      "wp.foundation.auth",
      "wp.qa",
      "wp.security",
      "wp.pm",
      "wp.launch",
    ],
    capabilityIds: ["ux", "frontend", "backend", "qa", "security", "pm", "launch"],
  },
  {
    id: "recommended",
    name: "Recommended release",
    description:
      "Balanced production-ready scope Good Code would typically recommend.",
    packageIds: [
      "wp.ux",
      "wp.frontend",
      "wp.backend",
      "wp.integrations",
      "wp.cloud",
      "wp.foundation.architecture",
      "wp.foundation.auth",
      "wp.foundation.audit",
      "wp.foundation.a11y_responsive",
      "wp.qa",
      "wp.security",
      "wp.pm",
      "wp.launch",
    ],
    capabilityIds: [
      "ux",
      "frontend",
      "backend",
      "integrations",
      "cloud",
      "qa",
      "security",
      "pm",
      "launch",
    ],
  },
  {
    id: "scale_ready",
    name: "Scale-ready foundation",
    description:
      "Fuller implementation with stronger scale, operations, testing, and infrastructure foundations.",
    packageIds: [
      "wp.ux",
      "wp.frontend",
      "wp.backend",
      "wp.mobile",
      "wp.integrations",
      "wp.cloud",
      "wp.scale.ops",
      "wp.foundation.architecture",
      "wp.foundation.auth",
      "wp.foundation.audit",
      "wp.foundation.a11y_responsive",
      "wp.qa",
      "wp.security",
      "wp.pm",
      "wp.launch",
    ],
    capabilityIds: [
      "ux",
      "frontend",
      "backend",
      "mobile",
      "integrations",
      "cloud",
      "qa",
      "security",
      "pm",
      "launch",
    ],
  },
];

/**
 * PLACEHOLDER PricingConfig — replace via calibrated published version.
 */
export const PLACEHOLDER_PRICING_CONFIG: PricingConfig = {
  pricingVersion: PLACEHOLDER_VERSION,
  isPlaceholder: true,
  roles: PLACEHOLDER_ROLES,
  workPackages: PLACEHOLDER_PACKAGES,
  foundationPackageIds: FOUNDATION_IDS,
  modifiers: [
    {
      id: "mod.multi_role",
      name: "Multiple user roles (PLACEHOLDER)",
      description: "Extra authz matrix and admin flows for many roles.",
      trigger: {
        answerPath: "roles",
        anyOf: ["4_plus", "5_plus", "many", "6+", "5+", "4+"],
      },
      effortMultiplier: 1.15,
      packageIds: ["wp.foundation.auth", "wp.frontend", "wp.backend"],
    },
    {
      id: "mod.multi_tenant",
      name: "Multi-tenancy (PLACEHOLDER)",
      description: "Tenant isolation across data and admin surfaces.",
      trigger: {
        answerPath: "multiTenant",
        whenPresent: true,
      },
      effortMultiplier: 1.25,
      packageIds: ["wp.backend", "wp.foundation.auth", "wp.security"],
    },
    {
      id: "mod.payments",
      name: "Payments complexity (PLACEHOLDER)",
      description: "Payment flows increase backend, security, and QA effort.",
      trigger: {
        answerPath: "capabilities",
        anyOf: [
          "cap.payments.one_time",
          "cap.payments.subscriptions",
          "cap.payments.payouts",
          "payments",
        ],
      },
      effortMultiplier: 1.2,
      packageIds: ["wp.backend", "wp.integrations", "wp.security", "wp.qa"],
    },
    {
      id: "mod.scale_high",
      name: "Higher scale expectations (PLACEHOLDER)",
      description: "Volume and concurrency expectations raise platform effort.",
      trigger: {
        answerPath: "scale",
        anyOf: ["high", "enterprise", "national", "very_high"],
      },
      effortMultiplier: 1.2,
      packageIds: ["wp.backend", "wp.cloud", "wp.qa"],
    },
    {
      id: "mod.migration",
      name: "Data migration in scope (PLACEHOLDER)",
      description: "Migration workstream effort.",
      trigger: { answerPath: "migration", whenPresent: true },
      effortMultiplier: 1.0,
      packageIds: ["wp.migration"],
    },
    {
      id: "mod.regulated",
      name: "Regulated workflow (PLACEHOLDER)",
      description: "Compliance-oriented design and evidence increases effort.",
      trigger: { answerPath: "regulated", whenPresent: true },
      effortMultiplier: 1.2,
      packageIds: ["wp.security", "wp.foundation.audit", "wp.qa", "wp.pm"],
    },
    {
      id: "mod.legacy",
      name: "Legacy replacement (PLACEHOLDER)",
      description: "Understanding and replacing legacy behaviour.",
      trigger: {
        answerPath: "startingPoint",
        anyOf: ["legacy", "legacy_replacement", "replace_legacy"],
      },
      effortMultiplier: 1.2,
      packageIds: ["wp.discovery", "wp.backend", "wp.integrations", "wp.migration"],
    },
    {
      id: "mod.schedule_compression",
      name: "Schedule compression (PLACEHOLDER)",
      description: "Coordination overhead when timing is aggressive — not a promise of speed.",
      trigger: {
        answerPath: "timing",
        anyOf: ["urgent", "aggressive", "fixed_deadline", "asap"],
      },
      effortMultiplier: 1.15,
      packageIds: ["wp.pm", "wp.qa"],
    },
    {
      id: "mod.mobile_device",
      name: "Device-capable mobile (PLACEHOLDER)",
      description: "Camera, offline, biometrics, or push raise mobile effort.",
      trigger: {
        answerPath: "mobileFollowUps",
        anyOf: ["offline", "push", "biometrics", "camera", "location"],
      },
      effortMultiplier: 1.2,
      packageIds: ["wp.mobile"],
    },
    {
      id: "mod.integration_count",
      name: "Several integrations (PLACEHOLDER)",
      description: "Each additional integration widens integration work.",
      trigger: { answerPath: "integrations", minCount: 3 },
      effortMultiplier: 1.25,
      packageIds: ["wp.integrations"],
    },
  ],
  riskFactors: [
    {
      id: "risk.undocumented_integrations",
      name: "Undocumented integrations",
      description: "Integrations lack trustworthy documentation.",
      trigger: {
        answerPath: "integrationDocs",
        anyOf: ["none", "poor", "unknown", "undocumented"],
      },
      rangeWidenFactor: 1.35,
      packageIds: ["wp.integrations", "wp.discovery"],
      plainLanguage:
        "The range is wider because external integrations still need technical review.",
      weight: 3,
    },
    {
      id: "risk.legacy",
      name: "Legacy system risk",
      description: "Legacy replacement introduces hidden behaviour.",
      trigger: {
        answerPath: "startingPoint",
        anyOf: ["legacy", "legacy_replacement", "replace_legacy"],
      },
      rangeWidenFactor: 1.3,
      packageIds: ["wp.backend", "wp.integrations", "wp.migration"],
      plainLanguage:
        "The range is wider because the existing system still needs technical review.",
      weight: 3,
    },
    {
      id: "risk.data_quality",
      name: "Data quality risk",
      description: "Source data quality is unclear or poor.",
      trigger: {
        answerPath: "dataQuality",
        anyOf: ["poor", "unknown", "mixed"],
      },
      rangeWidenFactor: 1.25,
      packageIds: ["wp.migration", "wp.backend"],
      plainLanguage: "The range is wider because data quality is still uncertain.",
      weight: 2,
    },
    {
      id: "risk.regulated_ambiguity",
      name: "Regulated ambiguity",
      description: "Regulatory expectations are not yet crisp.",
      trigger: { answerPath: "regulated", whenPresent: true },
      rangeWidenFactor: 1.2,
      packageIds: ["wp.security", "wp.foundation.audit"],
      plainLanguage:
        "The range is wider because regulated requirements still need clarification.",
      weight: 2,
    },
    {
      id: "risk.aggressive_deadline",
      name: "Aggressive deadline",
      description: "Stated timing conflicts with credible delivery.",
      trigger: {
        answerPath: "timing",
        anyOf: ["urgent", "aggressive", "fixed_deadline", "asap"],
      },
      rangeWidenFactor: 1.15,
      packageIds: ["wp.pm", "wp.qa", "wp.launch"],
      plainLanguage:
        "The range reflects coordination risk around a tight delivery window — we will not promise an impossible date.",
      weight: 2,
    },
    {
      id: "risk.many_unknowns",
      name: "Many unknowns",
      description: "Several answers marked unknown / not sure.",
      trigger: { answerPath: "unknowns", minCount: 3 },
      rangeWidenFactor: 1.3,
      packageIds: [],
      capabilityIds: ["discovery", "backend", "integrations"] as CapabilityId[],
      plainLanguage:
        "The range is wider because several important decisions are still open.",
      weight: 3,
    },
  ],
  uncertaintyRules: [
    {
      id: "unc.not_sure_capabilities",
      description: "Capabilities marked not sure",
      trigger: { answerPath: "notSure", whenPresent: true },
      widenFactor: 1.15,
      plainLanguage: "Some capability choices are still open, so the range is broader.",
    },
    {
      id: "unc.advice_needed",
      description: "Client asked for advice on key choices",
      trigger: { answerPath: "adviceNeeded", whenPresent: true },
      widenFactor: 1.1,
      plainLanguage: "We will refine scope together; the planning range stays intentionally broad.",
    },
    {
      id: "unc.unknown_scale",
      description: "Scale unknown",
      trigger: { answerPath: "scale", anyOf: ["unknown", "not_sure", "unsure"] },
      widenFactor: 1.2,
      plainLanguage: "Expected usage volume is still unclear.",
    },
  ],
  discovery: {
    packageId: "wp.discovery",
    unknownWeightThreshold: 3,
    riskWeightThreshold: 5,
    lowConfidenceTriggers: [
      "legacy",
      "legacy_replacement",
      "undocumented",
      "unknown",
      "need_discovery",
    ],
    offeringBullets: [
      "Stakeholder workshops",
      "User and workflow definition",
      "Technical audit",
      "Integration investigation",
      "Architecture direction",
      "Risk register",
      "Prioritised product backlog",
      "UX direction",
      "Delivery roadmap",
      "Refined implementation quotation",
    ],
  },
  commercial: {
    currency: "ZAR",
    /** PLACEHOLDER tax rate — configure per engagement; do not treat as legal advice. */
    taxRate: 0.15,
    pricesIncludeTax: false,
    /** PLACEHOLDER minimum engagement. */
    minimumEngagementZar: 85_000,
    /** PLACEHOLDER target margin — INTERNAL ONLY; never expose publicly. */
    targetMargin: 0.35,
    roundingBands: [
      { upToExclusive: 250_000, step: 5_000 },
      { upToExclusive: 500_000, step: 10_000 },
      { upToExclusive: 1_500_000, step: 25_000 },
      { upToExclusive: 3_000_000, step: 50_000 },
      { upToExclusive: Number.POSITIVE_INFINITY, step: 100_000 },
    ],
  },
  scenarios: SCENARIOS,
  monteCarlo: {
    enabled: false,
    iterations: 2_000,
  },
  timeline: {
    hoursPerWeekPerLane: 30,
    reviewCycleWeeks: 1,
    externalApprovalWeeks: 1,
    stabilisationWeeks: 2,
    appStoreWeeks: 2,
  },
};

/** Server-only accessor — prefer this from API routes so rates stay behind server-only. */
export function getPlaceholderConfig(): PricingConfig {
  return PLACEHOLDER_PRICING_CONFIG;
}

export default PLACEHOLDER_PRICING_CONFIG;
