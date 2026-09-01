/**
 * Internal types for the Project Blueprint estimation engine.
 * Public-facing result shapes intentionally omit rates, margins, hours, and tax math.
 */

export type ScenarioId = "lean" | "recommended" | "scale_ready";

export type ConfidenceLevel = "high" | "moderate" | "early";

export type RoleId =
  | "principal"
  | "architect"
  | "senior_engineer"
  | "engineer"
  | "designer"
  | "qa"
  | "security"
  | "pm"
  | "devops";

export type CapabilityId =
  | "discovery"
  | "ux"
  | "frontend"
  | "backend"
  | "mobile"
  | "integrations"
  | "cloud"
  | "qa"
  | "security"
  | "pm"
  | "launch";

export type ThreePoint = {
  low: number;
  likely: number;
  high: number;
};

export type MoneyRange = ThreePoint;

export type TimelineRange = {
  minimumWeeks: number;
  likelyWeeks: number;
};

export type RoleEffort = {
  roleId: RoleId;
  /** Effort in hours (three-point). */
  hours: ThreePoint;
};

export type WorkPackage = {
  id: string;
  name: string;
  description: string;
  /** Capability this package primarily represents. */
  capabilityId: CapabilityId;
  /** Phase label for public phaseBreakdown. */
  phase: string;
  /** Package IDs that must complete / be available first. */
  dependsOn: string[];
  /** Always included when foundations apply, regardless of lean scope. */
  isFoundation: boolean;
  /** Included in discovery-first offering. */
  isDiscovery: boolean;
  /** Base role effort before modifiers / uncertainty. */
  roleEffort: RoleEffort[];
  /** Optional parallel lane id for timeline scheduling. */
  lane?: string;
  /** Which scenarios may include this package (empty = all when selected). */
  scenarioTags?: ScenarioId[];
};

export type Modifier = {
  id: string;
  name: string;
  description: string;
  /** When true, applies if answers match trigger. */
  trigger: ModifierTrigger;
  /** Multiplier applied to low/likely/high hours on scoped packages. */
  effortMultiplier: number;
  /** Package IDs this modifier affects. Empty = all selected (avoid; prefer scoped). */
  packageIds: string[];
  /** Optional capability scope when packageIds empty. */
  capabilityIds?: CapabilityId[];
};

export type ModifierTrigger = {
  answerPath: string;
  /** Match any of these values (string equality or array membership). */
  anyOf?: Array<string | number | boolean>;
  /** Match when path is truthy / non-empty. */
  whenPresent?: boolean;
  /** Match when path looks like an unknown / not-sure answer. */
  whenUnknown?: boolean;
  /** Minimum array length when path is an array. */
  minCount?: number;
};

export type RiskFactor = {
  id: string;
  name: string;
  description: string;
  trigger: ModifierTrigger;
  /** Widens (high - low) spread on affected packages by this factor. */
  rangeWidenFactor: number;
  packageIds: string[];
  capabilityIds?: CapabilityId[];
  plainLanguage: string;
  weight: number;
};

export type RoundingBand = {
  /** Apply when mid-range cost is below this exclusive upper bound (ZAR). */
  upToExclusive: number;
  step: number;
};

export type CommercialConfig = {
  currency: "ZAR";
  /** PLACEHOLDER VAT rate — not hard-coded as policy; config-driven. */
  taxRate: number;
  /** Estimates shown exclusive of tax unless stated otherwise. */
  pricesIncludeTax: boolean;
  minimumEngagementZar: number;
  /** Internal only — never exposed in PublicEstimateResult. */
  targetMargin: number;
  roundingBands: RoundingBand[];
};

export type ScenarioDefinition = {
  id: ScenarioId;
  name: string;
  description: string;
  /** Explicit package set — never a % adjustment of another scenario. */
  packageIds: string[];
  /** Capabilities presented as included for this scenario. */
  capabilityIds: CapabilityId[];
};

export type DiscoveryConfig = {
  packageId: string;
  unknownWeightThreshold: number;
  riskWeightThreshold: number;
  lowConfidenceTriggers: string[];
  offeringBullets: string[];
};

export type UncertaintyRule = {
  id: string;
  description: string;
  trigger: ModifierTrigger;
  widenFactor: number;
  plainLanguage: string;
};

export type RoleRate = {
  roleId: RoleId;
  title: string;
  /** PLACEHOLDER sell rate ZAR / hour — internal only. */
  sellRateZarPerHour: number;
};

export type PricingConfig = {
  pricingVersion: string;
  isPlaceholder: boolean;
  roles: RoleRate[];
  workPackages: WorkPackage[];
  /** Package IDs always added (cross-cutting foundations). */
  foundationPackageIds: string[];
  modifiers: Modifier[];
  riskFactors: RiskFactor[];
  uncertaintyRules: UncertaintyRule[];
  discovery: DiscoveryConfig;
  commercial: CommercialConfig;
  scenarios: ScenarioDefinition[];
  /** Optional Monte Carlo; when enabled, seeded from answers+config checksum. */
  monteCarlo?: {
    enabled: boolean;
    iterations: number;
  };
  timeline: {
    hoursPerWeekPerLane: number;
    reviewCycleWeeks: number;
    externalApprovalWeeks: number;
    stabilisationWeeks: number;
    appStoreWeeks: number;
  };
};

/**
 * Engine input answers. Compatible with domain BlueprintAnswers;
 * budget fields are stored for commercial fit only and ignored for math.
 */
export type EngineAnswers = {
  route?: string;
  startingPoint?: string;
  outcome?: string;
  surfaces?: string[];
  mobileFollowUps?: string[];
  users?: string[];
  roles?: string[] | string;
  scale?: string;
  capabilities?: string[];
  integrations?: string[];
  integrationDocs?: string;
  integrationQuality?: string;
  migration?: string | boolean;
  dataQuality?: string;
  quality?: string[];
  security?: string[];
  regulated?: string | boolean;
  cloud?: string[];
  assets?: string[];
  productLevel?: string;
  timing?: string;
  deadline?: string;
  decisionMakers?: string;
  /** Ignored for calculation — commercial-fit context only. */
  budget?: unknown;
  budgetBand?: unknown;
  ideaText?: string;
  unknowns?: string[];
  notSure?: string[];
  adviceNeeded?: string[];
  multiTenant?: boolean;
  [key: string]: unknown;
};

export type ResolvedSelection = {
  packageIds: string[];
  appliedModifierIds: string[];
  riskFlagIds: string[];
  uncertaintyRuleIds: string[];
  mandatoryPackageIds: string[];
  capabilityIds: CapabilityId[];
};

export type PackageCostTrace = {
  packageId: string;
  name: string;
  hours: ThreePoint;
  costZar: ThreePoint;
  expectedHours: number;
  expectedCostZar: number;
  varianceHours: number;
  appliedModifiers: string[];
  uncertaintyWiden: number;
};

export type ScenarioInternal = {
  id: ScenarioId;
  name: string;
  packageIds: string[];
  capabilityIds: CapabilityId[];
  costZar: ThreePoint;
  expectedCostZar: number;
  p50Zar: number;
  p80Zar: number;
  varianceCost: number;
  packages: PackageCostTrace[];
  timeline: TimelineRange;
};

export type CalculationTrace = {
  estimateId: string;
  pricingVersion: string;
  answersChecksum: string;
  configChecksum: string;
  combinedChecksum: string;
  selectedPackageIds: string[];
  appliedModifiers: string[];
  riskFlags: string[];
  uncertaintyRules: string[];
  discoveryFirst: boolean;
  discoveryPackageId?: string;
  scenarios: ScenarioInternal[];
  /** Internal commercial — never public. */
  internalCommercial: {
    currency: "ZAR";
    taxRate: number;
    targetMargin: number;
    minimumEngagementZar: number;
    rawExpectedBeforeFloor: number;
    sellRatesUsed: Array<{ roleId: RoleId; sellRateZarPerHour: number }>;
  };
  notes: string[];
};

export type InternalEstimate = {
  publicResult: PublicEstimateResult;
  privateTrace: CalculationTrace;
};

export type PublicScenario = {
  id: ScenarioId;
  name: string;
  description?: string;
  range: MoneyRange;
  /** Rounded display strings e.g. "R1.2m–R1.6m". */
  rangeDisplay: string;
  timeline: TimelineRange;
  includedCapabilities: CapabilityId[];
  includedPackages: string[];
};

export type PhaseBreakdownItem = {
  phase: string;
  range: MoneyRange;
  rangeDisplay: string;
  shareOfLikely: number;
};

export type CostDriver = {
  id: string;
  label: string;
  explanation: string;
  range: MoneyRange;
  rangeDisplay: string;
};

export type PublicConfidence = {
  level: ConfidenceLevel;
  explanation: string;
  unknowns: string[];
};

/**
 * Client-safe estimate result. Must never include rates, margins, hours, or tax internals.
 */
export type PublicEstimateResult = {
  estimateId: string;
  pricingVersion: string;
  currency: "ZAR";
  recommendedScenario: PublicScenario;
  alternativeScenarios: PublicScenario[];
  phaseBreakdown: PhaseBreakdownItem[];
  costDrivers: CostDriver[];
  confidence: PublicConfidence;
  assumptions: string[];
  exclusions: string[];
  recommendedNextStep: string;
  calculationTraceReference: string;
  /** Present when discovery-first is recommended; still accompanied by full-product ranges. */
  discoveryFirst?: {
    recommended: boolean;
    summary: string;
    offering: string[];
    discoveryRange?: MoneyRange;
    discoveryRangeDisplay?: string;
  };
};
