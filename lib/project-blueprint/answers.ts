/**
 * Zod schemas for Project Blueprint answer payloads + normalisation.
 */

import { z } from "zod";

import type { ProjectBlueprintAnswers, UnknownChoice } from "./types";

const unknownChoiceSchema = z.enum([
  "not_sure",
  "help_me_choose",
  "need_advice",
  "unknown",
]);

const boolOrUnknownSchema = z.union([z.boolean(), unknownChoiceSchema, z.null()]).optional();

const stringListSchema = z.array(z.string()).default([]);

const integrationDetailSchema = z
  .object({
    documentationAvailable: boolOrUnknownSchema,
    apiStyle: z
      .union([
        z.enum(["modern_rest", "graphql", "legacy", "undocumented"]),
        unknownChoiceSchema,
        z.null(),
      ])
      .optional(),
    sandboxAvailable: boolOrUnknownSchema,
    twoWaySync: boolOrUnknownSchema,
    webhooksRequired: boolOrUnknownSchema,
    certificationRequired: boolOrUnknownSchema,
  })
  .default({});

const mobileFollowUpsSchema = z
  .object({
    pushNotifications: boolOrUnknownSchema,
    offlineCapability: boolOrUnknownSchema,
    deviceFeatures: stringListSchema.optional(),
    storeDeployment: boolOrUnknownSchema,
    platformStrategy: z
      .union([z.enum(["cross_platform", "native"]), unknownChoiceSchema, z.null()])
      .optional(),
    tabletWorkflows: boolOrUnknownSchema,
  })
  .default({});

const multiTenantFollowUpsSchema = z
  .object({
    tenantIsolation: boolOrUnknownSchema,
    tenantAdministration: boolOrUnknownSchema,
    customDomains: boolOrUnknownSchema,
    tenantBranding: boolOrUnknownSchema,
    tenantBilling: boolOrUnknownSchema,
    tenantConfiguration: boolOrUnknownSchema,
    tenantReporting: boolOrUnknownSchema,
    dataSeparation: boolOrUnknownSchema,
  })
  .default({});

const kycFollowUpsSchema = z
  .object({
    providerIntegration: boolOrUnknownSchema,
    documentCapture: boolOrUnknownSchema,
    livenessChecks: boolOrUnknownSchema,
    manualReview: boolOrUnknownSchema,
    auditability: boolOrUnknownSchema,
    regionalCoverage: boolOrUnknownSchema,
  })
  .default({});

const existingProductFollowUpsSchema = z
  .object({
    codeOwnership: z
      .union([z.enum(["client", "vendor", "shared"]), unknownChoiceSchema, z.null()])
      .optional(),
    documentationQuality: z
      .union([z.enum(["good", "partial", "poor"]), unknownChoiceSchema, z.null()])
      .optional(),
    testCoverage: z
      .union([z.enum(["good", "partial", "none"]), unknownChoiceSchema, z.null()])
      .optional(),
    hostingKnown: boolOrUnknownSchema,
    technicalDebt: z
      .union([z.enum(["low", "moderate", "high"]), unknownChoiceSchema, z.null()])
      .optional(),
    deploymentProcess: z
      .union([z.enum(["mature", "ad_hoc", "unknown"]), unknownChoiceSchema, z.null()])
      .optional(),
    auditRequired: boolOrUnknownSchema,
  })
  .default({});

const legacyFollowUpsSchema = z
  .object({
    migrationVolume: z
      .union([z.enum(["small", "medium", "large"]), unknownChoiceSchema, z.null()])
      .optional(),
    parallelOperation: boolOrUnknownSchema,
    cutoverApproach: z
      .union([z.enum(["big_bang", "phased"]), unknownChoiceSchema, z.null()])
      .optional(),
    systemDependencies: z
      .union([z.enum(["few", "many"]), unknownChoiceSchema, z.null()])
      .optional(),
    dataQuality: z
      .union([z.enum(["good", "mixed", "poor"]), unknownChoiceSchema, z.null()])
      .optional(),
    businessContinuity: boolOrUnknownSchema,
  })
  .default({});

const aiFollowUpsSchema = z
  .object({
    dataSensitivity: z
      .union([z.enum(["low", "moderate", "high"]), unknownChoiceSchema, z.null()])
      .optional(),
    modelProvider: z
      .union([
        z.enum(["good_code_managed", "client_chosen", "undecided"]),
        unknownChoiceSchema,
        z.null(),
      ])
      .optional(),
    expectedAccuracy: z
      .union([z.enum(["assistive", "high_stakes"]), unknownChoiceSchema, z.null()])
      .optional(),
    humanReview: boolOrUnknownSchema,
    evaluationNeeded: boolOrUnknownSchema,
    explainability: boolOrUnknownSchema,
    fallbackBehaviour: boolOrUnknownSchema,
  })
  .default({});

const cloudFollowUpsSchema = z
  .object({
    environments: stringListSchema.optional(),
    cicd: boolOrUnknownSchema,
    containerisation: boolOrUnknownSchema,
    uptimeTarget: z
      .union([z.enum(["standard", "high", "critical"]), unknownChoiceSchema, z.null()])
      .optional(),
    monitoring: boolOrUnknownSchema,
    currentProvider: z.string().nullable().optional(),
    dataVolume: z
      .union([z.enum(["small", "medium", "large"]), unknownChoiceSchema, z.null()])
      .optional(),
    migrationConstraints: z.string().nullable().optional(),
  })
  .default({});

const paymentsFollowUpsSchema = z
  .object({
    paymentModes: stringListSchema.optional(),
    refunds: boolOrUnknownSchema,
    tokenisation: boolOrUnknownSchema,
    payouts: boolOrUnknownSchema,
    reconciliation: boolOrUnknownSchema,
    multipleCurrencies: boolOrUnknownSchema,
    providerCertification: boolOrUnknownSchema,
  })
  .default({});

const regulatedFollowUpsSchema = z
  .object({
    identityVerification: boolOrUnknownSchema,
    approvalAuditTrails: boolOrUnknownSchema,
    dataRetention: boolOrUnknownSchema,
    segregationOfDuties: boolOrUnknownSchema,
    fraudControls: boolOrUnknownSchema,
    transactionReconciliation: boolOrUnknownSchema,
    externalReporting: boolOrUnknownSchema,
    providerCertification: boolOrUnknownSchema,
    humanReview: boolOrUnknownSchema,
  })
  .default({});

const deadlineConflictSchema = z
  .union([
    z.enum([
      "reduce_scope",
      "increase_capacity",
      "discovery_first",
      "phased_launch",
      "delivery_review",
    ]),
    unknownChoiceSchema,
    z.null(),
  ])
  .optional();

export const projectBlueprintAnswersSchema = z.object({
  ideaText: z.string().nullable().optional(),
  confirmedSuggestions: stringListSchema.optional(),

  route: z.string().nullable().optional(),
  startingPoint: z.string().nullable().optional(),
  primaryOutcome: z.string().nullable().optional(),

  surfaces: stringListSchema.optional(),
  mobileFollowUps: mobileFollowUpsSchema.optional(),

  userGroups: stringListSchema.optional(),
  userScale: z.string().nullable().optional(),
  roleCountBand: z.string().nullable().optional(),
  roleBasedPermissions: boolOrUnknownSchema,
  multiTenant: boolOrUnknownSchema,
  multiTenantFollowUps: multiTenantFollowUpsSchema.optional(),
  transactionVolume: z.string().nullable().optional(),
  countriesOrRegions: z.string().nullable().optional(),
  multipleLanguages: boolOrUnknownSchema,
  multipleCurrencies: boolOrUnknownSchema,

  capabilities: stringListSchema.optional(),
  paymentsFollowUps: paymentsFollowUpsSchema.optional(),
  kycFollowUps: kycFollowUpsSchema.optional(),
  aiFollowUps: aiFollowUpsSchema.optional(),

  integrations: stringListSchema.optional(),
  integrationDetails: z.record(z.string(), integrationDetailSchema).optional(),
  migrationProfile: z.string().nullable().optional(),

  qualityRequirements: stringListSchema.optional(),
  regulatedControls: stringListSchema.optional(),
  regulatedFollowUps: regulatedFollowUpsSchema.optional(),

  existingAssets: stringListSchema.optional(),
  productLevel: z.string().nullable().optional(),
  timing: z.string().nullable().optional(),
  deadlineConflictResolution: deadlineConflictSchema,
  budgetBand: z.string().nullable().optional(),
  budgetNotes: z.string().nullable().optional(),

  existingProductFollowUps: existingProductFollowUpsSchema.optional(),
  legacyFollowUps: legacyFollowUpsSchema.optional(),
  cloudFollowUps: cloudFollowUpsSchema.optional(),

  unknowns: z.record(z.string(), unknownChoiceSchema).optional(),
});

export type ProjectBlueprintAnswersInput = z.input<typeof projectBlueprintAnswersSchema>;
export type ProjectBlueprintAnswersParsed = z.output<typeof projectBlueprintAnswersSchema>;

function uniqueStrings(values: string[] | undefined): string[] {
  if (!values?.length) return [];
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function isUnknownChoice(value: unknown): value is UnknownChoice {
  return (
    value === "not_sure" ||
    value === "help_me_choose" ||
    value === "need_advice" ||
    value === "unknown"
  );
}

/**
 * Parse and normalise a partial answer payload into a stable shape.
 * Deduplicates list fields and drops empty strings.
 */
export function normalizeAnswers(
  input: unknown,
): ProjectBlueprintAnswers {
  const parsed = projectBlueprintAnswersSchema.parse(input ?? {});

  return {
    ...parsed,
    ideaText: parsed.ideaText?.trim() ? parsed.ideaText.trim() : parsed.ideaText ?? null,
    confirmedSuggestions: uniqueStrings(parsed.confirmedSuggestions),
    route: parsed.route?.trim() || null,
    startingPoint: parsed.startingPoint?.trim() || null,
    primaryOutcome: parsed.primaryOutcome?.trim() || null,
    surfaces: uniqueStrings(parsed.surfaces),
    userGroups: uniqueStrings(parsed.userGroups),
    userScale: parsed.userScale?.trim() || null,
    roleCountBand: parsed.roleCountBand?.trim() || null,
    transactionVolume: parsed.transactionVolume?.trim() || null,
    countriesOrRegions: parsed.countriesOrRegions?.trim() || null,
    capabilities: uniqueStrings(parsed.capabilities),
    integrations: uniqueStrings(parsed.integrations),
    migrationProfile: parsed.migrationProfile?.trim() || null,
    qualityRequirements: uniqueStrings(parsed.qualityRequirements),
    regulatedControls: uniqueStrings(parsed.regulatedControls),
    existingAssets: uniqueStrings(parsed.existingAssets),
    productLevel: parsed.productLevel?.trim() || null,
    timing: parsed.timing?.trim() || null,
    budgetBand: parsed.budgetBand?.trim() || null,
    budgetNotes: parsed.budgetNotes?.trim() || null,
    mobileFollowUps: {
      ...parsed.mobileFollowUps,
      deviceFeatures: uniqueStrings(parsed.mobileFollowUps?.deviceFeatures),
    },
    paymentsFollowUps: {
      ...parsed.paymentsFollowUps,
      paymentModes: uniqueStrings(parsed.paymentsFollowUps?.paymentModes),
    },
    cloudFollowUps: {
      ...parsed.cloudFollowUps,
      environments: uniqueStrings(parsed.cloudFollowUps?.environments),
      currentProvider: parsed.cloudFollowUps?.currentProvider?.trim() || null,
      migrationConstraints: parsed.cloudFollowUps?.migrationConstraints?.trim() || null,
    },
    unknowns: parsed.unknowns ?? {},
  };
}

export function isAnswerUnknown(
  answers: ProjectBlueprintAnswers,
  questionId: string,
): boolean {
  const marked = answers.unknowns?.[questionId];
  return isUnknownChoice(marked);
}

export { unknownChoiceSchema, boolOrUnknownSchema };
