/**
 * Shared public types for Project Blueprint.
 * Safe for client bundles — no rates, margins, or private commercial rules.
 */

export type ScreenId =
  | "route"
  | "context"
  | "surfaces"
  | "users"
  | "capabilities"
  | "integrations"
  | "quality"
  | "delivery"
  | "review";

export type JourneyStepId = Exclude<ScreenId, "review"> | "review";

export type ConfidenceLevel = "high" | "moderate" | "early";

export type ScenarioKind = "lean" | "recommended" | "scale";

export type UnknownChoice =
  | "not_sure"
  | "help_me_choose"
  | "need_advice"
  | "unknown";

export type MoneyRange = {
  low: number;
  likely: number;
  high: number;
};

export type TimelineRange = {
  minimumWeeks: number;
  likelyWeeks: number;
  maximumWeeks?: number;
};

export type PublicScenarioResult = {
  id: ScenarioKind;
  name: string;
  summary: string;
  includedCapabilityIds: string[];
  excludedCapabilityIds?: string[];
  range: MoneyRange;
  timeline: TimelineRange;
};

export type PhaseBreakdownItem = {
  id: string;
  name: string;
  description?: string;
  /** Share of total investment as a 0–1 fraction, or an indicative money range. */
  allocation: MoneyRange | { share: number };
};

export type CostDriver = {
  id: string;
  title: string;
  explanation: string;
  relatedAnswerKeys?: string[];
};

export type PublicConfidence = {
  level: ConfidenceLevel;
  explanation: string;
  unknowns: string[];
  improvements: string[];
};

export type PublicAssumption = {
  id: string;
  text: string;
  source?: "answer" | "default" | "engine";
};

export type PublicEstimateResult = {
  estimateId: string;
  pricingVersion: string;
  currency: "ZAR";
  generatedAt: string;
  productSummary: string;
  recommendedScenario: PublicScenarioResult;
  alternativeScenarios: PublicScenarioResult[];
  phaseBreakdown: PhaseBreakdownItem[];
  costDrivers: CostDriver[];
  confidence: PublicConfidence;
  assumptions: PublicAssumption[];
  exclusions: string[];
  discoveryRecommended: boolean;
  discoverySummary?: string;
  nextStepRecommendation: string;
  /** Placeholder-config flag may surface when seeded rates are still in use. */
  usingPlaceholderConfiguration?: boolean;
};

export type IntegrationDetailAnswers = {
  documentationAvailable?: boolean | UnknownChoice | null;
  apiStyle?: "modern_rest" | "graphql" | "legacy" | "undocumented" | UnknownChoice | null;
  sandboxAvailable?: boolean | UnknownChoice | null;
  twoWaySync?: boolean | UnknownChoice | null;
  webhooksRequired?: boolean | UnknownChoice | null;
  certificationRequired?: boolean | UnknownChoice | null;
};

export type MobileFollowUpAnswers = {
  pushNotifications?: boolean | UnknownChoice | null;
  offlineCapability?: boolean | UnknownChoice | null;
  deviceFeatures?: string[];
  storeDeployment?: boolean | UnknownChoice | null;
  platformStrategy?: "cross_platform" | "native" | UnknownChoice | null;
  tabletWorkflows?: boolean | UnknownChoice | null;
};

export type MultiTenantFollowUpAnswers = {
  tenantIsolation?: boolean | UnknownChoice | null;
  tenantAdministration?: boolean | UnknownChoice | null;
  customDomains?: boolean | UnknownChoice | null;
  tenantBranding?: boolean | UnknownChoice | null;
  tenantBilling?: boolean | UnknownChoice | null;
  tenantConfiguration?: boolean | UnknownChoice | null;
  tenantReporting?: boolean | UnknownChoice | null;
  dataSeparation?: boolean | UnknownChoice | null;
};

export type KycFollowUpAnswers = {
  providerIntegration?: boolean | UnknownChoice | null;
  documentCapture?: boolean | UnknownChoice | null;
  livenessChecks?: boolean | UnknownChoice | null;
  manualReview?: boolean | UnknownChoice | null;
  auditability?: boolean | UnknownChoice | null;
  regionalCoverage?: boolean | UnknownChoice | null;
};

export type ExistingProductFollowUpAnswers = {
  codeOwnership?: "client" | "vendor" | "shared" | UnknownChoice | null;
  documentationQuality?: "good" | "partial" | "poor" | UnknownChoice | null;
  testCoverage?: "good" | "partial" | "none" | UnknownChoice | null;
  hostingKnown?: boolean | UnknownChoice | null;
  technicalDebt?: "low" | "moderate" | "high" | UnknownChoice | null;
  deploymentProcess?: "mature" | "ad_hoc" | "unknown" | UnknownChoice | null;
  auditRequired?: boolean | UnknownChoice | null;
};

export type LegacyFollowUpAnswers = {
  migrationVolume?: "small" | "medium" | "large" | UnknownChoice | null;
  parallelOperation?: boolean | UnknownChoice | null;
  cutoverApproach?: "big_bang" | "phased" | UnknownChoice | null;
  systemDependencies?: "few" | "many" | UnknownChoice | null;
  dataQuality?: "good" | "mixed" | "poor" | UnknownChoice | null;
  businessContinuity?: boolean | UnknownChoice | null;
};

export type AiFollowUpAnswers = {
  dataSensitivity?: "low" | "moderate" | "high" | UnknownChoice | null;
  modelProvider?: "good_code_managed" | "client_chosen" | "undecided" | UnknownChoice | null;
  expectedAccuracy?: "assistive" | "high_stakes" | UnknownChoice | null;
  humanReview?: boolean | UnknownChoice | null;
  evaluationNeeded?: boolean | UnknownChoice | null;
  explainability?: boolean | UnknownChoice | null;
  fallbackBehaviour?: boolean | UnknownChoice | null;
};

export type CloudFollowUpAnswers = {
  environments?: string[];
  cicd?: boolean | UnknownChoice | null;
  containerisation?: boolean | UnknownChoice | null;
  uptimeTarget?: "standard" | "high" | "critical" | UnknownChoice | null;
  monitoring?: boolean | UnknownChoice | null;
  currentProvider?: string | null;
  dataVolume?: "small" | "medium" | "large" | UnknownChoice | null;
  migrationConstraints?: string | null;
};

export type PaymentsFollowUpAnswers = {
  paymentModes?: string[];
  refunds?: boolean | UnknownChoice | null;
  tokenisation?: boolean | UnknownChoice | null;
  payouts?: boolean | UnknownChoice | null;
  reconciliation?: boolean | UnknownChoice | null;
  multipleCurrencies?: boolean | UnknownChoice | null;
  providerCertification?: boolean | UnknownChoice | null;
};

export type RegulatedFollowUpAnswers = {
  identityVerification?: boolean | UnknownChoice | null;
  approvalAuditTrails?: boolean | UnknownChoice | null;
  dataRetention?: boolean | UnknownChoice | null;
  segregationOfDuties?: boolean | UnknownChoice | null;
  fraudControls?: boolean | UnknownChoice | null;
  transactionReconciliation?: boolean | UnknownChoice | null;
  externalReporting?: boolean | UnknownChoice | null;
  providerCertification?: boolean | UnknownChoice | null;
  humanReview?: boolean | UnknownChoice | null;
};

export type DeadlineConflictResolution =
  | "reduce_scope"
  | "increase_capacity"
  | "discovery_first"
  | "phased_launch"
  | "delivery_review"
  | UnknownChoice;

/**
 * Normalised answer bag collected across the adaptive journey.
 * Option values use stable taxonomy IDs (e.g. `surface.public_web`).
 */
export type ProjectBlueprintAnswers = {
  /** Free-text idea from “Describe my idea” mode. */
  ideaText?: string | null;
  /** Classifier suggestions the user confirmed. */
  confirmedSuggestions?: string[];

  route?: string | null;
  startingPoint?: string | null;
  primaryOutcome?: string | null;

  surfaces?: string[];
  mobileFollowUps?: MobileFollowUpAnswers;

  userGroups?: string[];
  userScale?: string | null;
  roleCountBand?: string | null;
  roleBasedPermissions?: boolean | UnknownChoice | null;
  multiTenant?: boolean | UnknownChoice | null;
  multiTenantFollowUps?: MultiTenantFollowUpAnswers;
  transactionVolume?: string | null;
  countriesOrRegions?: string | null;
  multipleLanguages?: boolean | UnknownChoice | null;
  multipleCurrencies?: boolean | UnknownChoice | null;

  capabilities?: string[];
  paymentsFollowUps?: PaymentsFollowUpAnswers;
  kycFollowUps?: KycFollowUpAnswers;
  aiFollowUps?: AiFollowUpAnswers;

  integrations?: string[];
  integrationDetails?: Record<string, IntegrationDetailAnswers>;
  migrationProfile?: string | null;

  qualityRequirements?: string[];
  /** Selected regulated-control IDs from adaptive follow-ups. */
  regulatedControls?: string[];
  regulatedFollowUps?: RegulatedFollowUpAnswers;

  existingAssets?: string[];
  productLevel?: string | null;
  timing?: string | null;
  deadlineConflictResolution?: DeadlineConflictResolution | null;
  /** Optional commercial-fit context only — never feeds the calculation. */
  budgetBand?: string | null;
  budgetNotes?: string | null;

  existingProductFollowUps?: ExistingProductFollowUpAnswers;
  legacyFollowUps?: LegacyFollowUpAnswers;
  cloudFollowUps?: CloudFollowUpAnswers;

  /** Explicit unknown markers keyed by question id. */
  unknowns?: Record<string, UnknownChoice>;
};

export type ClassifierSuggestionCategory =
  | "product_type"
  | "surface"
  | "capability"
  | "integration"
  | "user_group"
  | "risk"
  | "starting_point"
  | "quality";

export type ClassifierSuggestion = {
  id: string;
  category: ClassifierSuggestionCategory;
  label: string;
  rationale: string;
  confidence: "high" | "moderate" | "low";
  /** Always true for classifier output — UI must confirm before applying. */
  requiresConfirmation: true;
};

export type IdeaClassificationResult = {
  suggestions: ClassifierSuggestion[];
  questionsRequiringConfirmation: string[];
  /** Never includes prices or numeric estimates. */
  notes: string[];
};

export type ReviewSummarySection = {
  id: ScreenId | "overview";
  title: string;
  body: string;
  highlightUnknowns?: string[];
};

export type ReviewSummary = {
  headline: string;
  sections: ReviewSummarySection[];
  assumptions: string[];
  unknowns: string[];
};
