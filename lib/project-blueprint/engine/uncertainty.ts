import type {
  EngineAnswers,
  PricingConfig,
  RiskFactor,
  ThreePoint,
  UncertaintyRule,
  WorkPackage,
} from "./types";
import { widenThreePoint } from "./pert";
import { triggerMatches } from "./resolve";

export type UncertaintyApplication = {
  packageId: string;
  widenFactor: number;
  explanations: string[];
  ruleIds: string[];
  riskIds: string[];
};

/**
 * Widen ranges for unknowns / risk factors and collect plain-language explanations.
 * Never hide uncertainty inside an unexplained contingency line.
 */
export function collectUncertaintyExplanations(
  answers: EngineAnswers,
  config: PricingConfig,
  appliedRiskIds: string[],
  appliedUncertaintyIds: string[],
): string[] {
  const explanations: string[] = [];
  const risks = config.riskFactors.filter((r) => appliedRiskIds.includes(r.id));
  const rules = config.uncertaintyRules.filter((u) =>
    appliedUncertaintyIds.includes(u.id),
  );

  for (const risk of risks) {
    explanations.push(risk.plainLanguage);
  }
  for (const rule of rules) {
    explanations.push(rule.plainLanguage);
  }

  const unknowns = [
    ...((answers.unknowns as string[] | undefined) ?? []),
    ...((answers.notSure as string[] | undefined) ?? []),
  ];
  if (unknowns.length > 0) {
    explanations.push(
      `Several answers are still open (${unknowns.length}), so the planning range stays wider until they are clarified.`,
    );
  }

  // Dedupe while preserving order
  return [...new Set(explanations)];
}

function packageMatchesScope(
  pkg: WorkPackage,
  risk: RiskFactor | UncertaintyRule,
): boolean {
  const packageIds = "packageIds" in risk ? risk.packageIds ?? [] : [];
  const capabilityIds =
    "capabilityIds" in risk ? (risk as RiskFactor).capabilityIds ?? [] : [];

  if (packageIds.length === 0 && capabilityIds.length === 0) return true;
  if (packageIds.includes(pkg.id)) return true;
  if (capabilityIds.includes(pkg.capabilityId)) return true;
  return false;
}

/**
 * Compute per-package widen factors from applied risks + uncertainty rules.
 */
export function buildUncertaintyMap(
  answers: EngineAnswers,
  config: PricingConfig,
  packageIds: string[],
  appliedRiskIds: string[],
  appliedUncertaintyIds: string[],
): Map<string, UncertaintyApplication> {
  const byId = new Map(config.workPackages.map((p) => [p.id, p]));
  const map = new Map<string, UncertaintyApplication>();

  const ensure = (packageId: string): UncertaintyApplication => {
    let row = map.get(packageId);
    if (!row) {
      row = {
        packageId,
        widenFactor: 1,
        explanations: [],
        ruleIds: [],
        riskIds: [],
      };
      map.set(packageId, row);
    }
    return row;
  };

  for (const id of packageIds) {
    ensure(id);
  }

  for (const risk of config.riskFactors) {
    if (!appliedRiskIds.includes(risk.id) && !triggerMatches(answers, risk.trigger)) {
      continue;
    }
    for (const packageId of packageIds) {
      const pkg = byId.get(packageId);
      if (!pkg || !packageMatchesScope(pkg, risk)) continue;
      const row = ensure(packageId);
      row.widenFactor *= risk.rangeWidenFactor;
      row.explanations.push(risk.plainLanguage);
      row.riskIds.push(risk.id);
    }
  }

  for (const rule of config.uncertaintyRules) {
    if (
      !appliedUncertaintyIds.includes(rule.id) &&
      !triggerMatches(answers, rule.trigger)
    ) {
      continue;
    }
    for (const packageId of packageIds) {
      const row = ensure(packageId);
      row.widenFactor *= rule.widenFactor;
      row.explanations.push(rule.plainLanguage);
      row.ruleIds.push(rule.id);
    }
  }

  return map;
}

export function applyUncertaintyToHours(
  hours: ThreePoint,
  widenFactor: number,
): ThreePoint {
  return widenThreePoint(hours, widenFactor);
}
