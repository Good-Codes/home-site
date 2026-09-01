import type {
  ConfidenceLevel,
  EngineAnswers,
  PricingConfig,
  ResolvedSelection,
  ThreePoint,
} from "./types";

export type DiscoveryDecision = {
  recommended: boolean;
  reasons: string[];
  summary: string;
  offering: string[];
  packageId: string;
  confidenceLevel: ConfidenceLevel;
};

function asArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}

function countUnknownWeight(answers: EngineAnswers): number {
  let weight = 0;
  weight += asArray(answers.unknowns).length;
  weight += asArray(answers.notSure).length;
  weight += asArray(answers.adviceNeeded).length;

  const maybeUnknownPaths: Array<keyof EngineAnswers | string> = [
    "scale",
    "integrationDocs",
    "dataQuality",
    "startingPoint",
    "timing",
  ];
  for (const path of maybeUnknownPaths) {
    const v = String(answers[path as string] ?? "").toLowerCase();
    if (
      v === "unknown" ||
      v === "not_sure" ||
      v === "unsure" ||
      v === "undocumented" ||
      v === "need_discovery"
    ) {
      weight += 1;
    }
  }
  return weight;
}

function riskWeight(
  config: PricingConfig,
  riskFlagIds: string[],
): number {
  return config.riskFactors
    .filter((r) => riskFlagIds.includes(r.id))
    .reduce((sum, r) => sum + r.weight, 0);
}

function isLegacyUndocumented(answers: EngineAnswers): boolean {
  const start = String(answers.startingPoint ?? "").toLowerCase();
  const legacy =
    start.includes("legacy") ||
    start.includes("replace") ||
    start === "legacy_replacement";
  const docs = String(answers.integrationDocs ?? "").toLowerCase();
  const undocumented =
    docs === "none" ||
    docs === "poor" ||
    docs === "unknown" ||
    docs === "undocumented";
  const hasIntegrations = asArray(answers.integrations).length > 0;
  return legacy && (undocumented || hasIntegrations);
}

/**
 * Discovery-first when low confidence / many unknowns / legacy+undocumented integrations.
 * Still expects calculateEstimate to return a broad full-product planning range.
 */
export function evaluateDiscovery(
  answers: EngineAnswers,
  config: PricingConfig,
  resolved: ResolvedSelection,
): DiscoveryDecision {
  const reasons: string[] = [];
  const unknownWeight = countUnknownWeight(answers);
  const risks = riskWeight(config, resolved.riskFlagIds);

  if (unknownWeight >= config.discovery.unknownWeightThreshold) {
    reasons.push(
      `Several important inputs are still unknown (weight ${unknownWeight}).`,
    );
  }
  if (risks >= config.discovery.riskWeightThreshold) {
    reasons.push(`Combined delivery risk weight is elevated (${risks}).`);
  }
  if (isLegacyUndocumented(answers)) {
    reasons.push(
      "Legacy replacement combined with integrations that still need technical review.",
    );
  }

  const start = String(answers.startingPoint ?? "").toLowerCase();
  for (const trigger of config.discovery.lowConfidenceTriggers) {
    if (start.includes(trigger) || asArray(answers.unknowns).some((u) => u.includes(trigger))) {
      reasons.push(`Low-confidence trigger matched: ${trigger}.`);
    }
  }

  if (answers.regulated && asArray(answers.notSure).length > 0) {
    reasons.push("Regulated workflow with unresolved choices.");
  }

  const recommended = reasons.length > 0 && (
    unknownWeight >= config.discovery.unknownWeightThreshold ||
    risks >= config.discovery.riskWeightThreshold ||
    isLegacyUndocumented(answers) ||
    start.includes("need_discovery") ||
    start.includes("discovery")
  );

  let confidenceLevel: ConfidenceLevel = "high";
  if (recommended || unknownWeight >= 4 || risks >= 6) {
    confidenceLevel = "early";
  } else if (unknownWeight >= 2 || risks >= 3 || resolved.riskFlagIds.length > 0) {
    confidenceLevel = "moderate";
  }

  const summary = recommended
    ? "Begin with a discovery and architecture engagement."
    : "Proceed with a scoped implementation estimate; refine through review as needed.";

  return {
    recommended,
    reasons: [...new Set(reasons)],
    summary,
    offering: config.discovery.offeringBullets,
    packageId: config.discovery.packageId,
    confidenceLevel,
  };
}

export function discoveryPackageCost(
  config: PricingConfig,
  computePackageCost: (packageId: string) => ThreePoint | null,
): ThreePoint | null {
  return computePackageCost(config.discovery.packageId);
}
