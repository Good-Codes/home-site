import "server-only";

import type { ProjectBlueprintAnswers } from "../types";
import { formatUnknownQuestionId } from "../unknown-copy";
import { checksum, combineChecksums } from "./checksum";
import { PLACEHOLDER_PRICING_CONFIG } from "./config/placeholder";
import { evaluateDiscovery } from "./discovery";
import {
  approximateP50,
  approximateP80,
  pertExpected,
  pertExpectedFrom,
  pertVariance,
  runCostMonteCarlo,
  scaleThreePoint,
  seedFromChecksum,
  sumThreePoint,
} from "./pert";
import { resolveSelection } from "./resolve";
import { formatZarRange, roundMoneyRange } from "./round";
import { buildAllScenarios } from "./scenarios";
import { estimateTimeline } from "./timeline";
import type {
  CostDriver,
  EngineAnswers,
  InternalEstimate,
  PackageCostTrace,
  PhaseBreakdownItem,
  PricingConfig,
  PublicEstimateResult,
  PublicScenario,
  RoleId,
  ScenarioInternal,
  ThreePoint,
  WorkPackage,
} from "./types";
import {
  applyUncertaintyToHours,
  buildUncertaintyMap,
  collectUncertaintyExplanations,
} from "./uncertainty";

function isProjectBlueprintAnswers(
  answers: EngineAnswers | ProjectBlueprintAnswers,
): answers is ProjectBlueprintAnswers {
  return (
    "primaryOutcome" in answers ||
    "userGroups" in answers ||
    "qualityRequirements" in answers ||
    "migrationProfile" in answers ||
    (answers.unknowns !== undefined &&
      typeof answers.unknowns === "object" &&
      !Array.isArray(answers.unknowns))
  );
}

/**
 * Map domain answers into the flatter engine answer bag.
 * Budget fields are stripped so they cannot affect math.
 */
export function toEngineAnswers(
  answers: EngineAnswers | ProjectBlueprintAnswers,
): EngineAnswers {
  if (!isProjectBlueprintAnswers(answers)) {
    const { budget: _b, budgetBand: _bb, ...rest } = answers;
    void _b;
    void _bb;
    return rest;
  }

  const unknownEntries = Object.entries(answers.unknowns ?? {});
  const unknowns = unknownEntries.map(([key]) => key);
  const notSure = unknownEntries
    .filter(([, v]) => v === "not_sure" || v === "help_me_choose")
    .map(([key]) => key);
  const adviceNeeded = unknownEntries
    .filter(([, v]) => v === "need_advice")
    .map(([key]) => key);

  const mobileFollowUps: string[] = [];
  const mobile = answers.mobileFollowUps;
  if (mobile) {
    if (mobile.pushNotifications === true) mobileFollowUps.push("push");
    if (mobile.offlineCapability === true) mobileFollowUps.push("offline");
    if (mobile.storeDeployment === true) mobileFollowUps.push("store");
    if (Array.isArray(mobile.deviceFeatures)) {
      mobileFollowUps.push(...mobile.deviceFeatures.map(String));
    }
  }

  const capabilities = [...(answers.capabilities ?? [])];
  if (answers.multiTenant === true && !capabilities.includes("cap.access.multi_tenant")) {
    capabilities.push("cap.access.multi_tenant");
  }

  const cloud: string[] = [];
  if (answers.cloudFollowUps) {
    if (Array.isArray(answers.cloudFollowUps.environments)) {
      cloud.push(...answers.cloudFollowUps.environments.map(String));
    }
    if (answers.cloudFollowUps.cicd === true) cloud.push("cicd");
    if (answers.cloudFollowUps.monitoring === true) cloud.push("monitoring");
  }

  const regulated =
    (answers.regulatedControls && answers.regulatedControls.length > 0) ||
    Boolean(answers.regulatedFollowUps);

  return {
    route: answers.route ?? undefined,
    startingPoint: answers.startingPoint ?? undefined,
    outcome: answers.primaryOutcome ?? undefined,
    surfaces: answers.surfaces ?? [],
    mobileFollowUps,
    users: answers.userGroups ?? [],
    roles: answers.roleCountBand ?? undefined,
    scale: answers.userScale ?? undefined,
    capabilities,
    integrations: answers.integrations ?? [],
    migration: answers.migrationProfile ?? undefined,
    dataQuality: answers.legacyFollowUps?.dataQuality ?? undefined,
    quality: answers.qualityRequirements ?? [],
    security: answers.qualityRequirements ?? [],
    regulated,
    cloud,
    assets: answers.existingAssets ?? [],
    productLevel: answers.productLevel ?? undefined,
    timing: answers.timing ?? undefined,
    deadline: answers.deadlineConflictResolution ?? undefined,
    ideaText: answers.ideaText ?? undefined,
    unknowns,
    notSure,
    adviceNeeded,
    integrationDocs:
      answers.existingProductFollowUps?.documentationQuality ??
      (Object.values(answers.integrationDetails ?? {}).some(
        (d) =>
          d.documentationAvailable === false ||
          d.apiStyle === "undocumented" ||
          d.apiStyle === "unknown",
      )
        ? "undocumented"
        : undefined),
  };
}

function rateMap(config: PricingConfig): Map<RoleId, number> {
  return new Map(config.roles.map((r) => [r.roleId, r.sellRateZarPerHour]));
}

function applyModifiersToHours(
  pkg: WorkPackage,
  baseHours: ThreePoint,
  config: PricingConfig,
  appliedModifierIds: string[],
): { hours: ThreePoint; applied: string[] } {
  let hours = { ...baseHours };
  const applied: string[] = [];
  for (const mod of config.modifiers) {
    if (!appliedModifierIds.includes(mod.id)) continue;
    const scoped =
      mod.packageIds.includes(pkg.id) ||
      (mod.packageIds.length === 0 &&
        (mod.capabilityIds?.includes(pkg.capabilityId) ?? false));
    if (!scoped && mod.packageIds.length > 0) continue;
    if (
      !scoped &&
      mod.packageIds.length === 0 &&
      !(mod.capabilityIds?.length)
    ) {
      continue;
    }
    if (!scoped) continue;
    hours = scaleThreePoint(hours, mod.effortMultiplier);
    applied.push(mod.id);
  }
  return { hours, applied };
}

function packageBaseHours(pkg: WorkPackage): ThreePoint {
  return sumThreePoint(pkg.roleEffort.map((r) => r.hours));
}

function costFromHours(
  pkg: WorkPackage,
  hours: ThreePoint,
  rates: Map<RoleId, number>,
): ThreePoint {
  const roleLikely = pkg.roleEffort.map((r) => ({
    roleId: r.roleId,
    likely: r.hours.likely,
  }));
  const totalLikely = roleLikely.reduce((s, r) => s + r.likely, 0) || 1;

  const cost = { low: 0, likely: 0, high: 0 };
  for (const role of roleLikely) {
    const rate = rates.get(role.roleId) ?? 0;
    const share = role.likely / totalLikely;
    cost.low += hours.low * share * rate;
    cost.likely += hours.likely * share * rate;
    cost.high += hours.high * share * rate;
  }
  return cost;
}

/**
 * Sell rates are already customer-facing. Margin stays internal.
 * Lift the three-point band only when expected cost is below the minimum engagement.
 */
function applyCommercialFloor(cost: ThreePoint, minimum: number): ThreePoint {
  const expected = pertExpected(cost.low, cost.likely, cost.high);
  if (expected >= minimum) return cost;
  const lift = minimum / Math.max(expected, 1);
  return scaleThreePoint(cost, lift);
}

function buildAssumptions(answers: EngineAnswers, config: PricingConfig): string[] {
  const assumptions = [
    "This is a planning estimate, not a fixed quotation.",
    `Currency is ${config.commercial.currency}; figures are ${config.commercial.pricesIncludeTax ? "inclusive" : "exclusive"} of tax.`,
    "Scope is inferred from the answers provided; clarified requirements may change the range.",
    "Cross-cutting foundations such as security, testing, and delivery management are included.",
  ];
  if (config.isPlaceholder) {
    assumptions.push(
      "Rates and effort bands are PLACEHOLDER configuration pending Good Code calibration.",
    );
  }
  if (answers.productLevel) {
    assumptions.push(`Product maturity indicated as “${String(answers.productLevel)}”.`);
  }
  return assumptions;
}

function buildExclusions(): string[] {
  return [
    "Third-party licence fees, cloud usage charges, and app-store fees",
    "Hardware, devices, and non-software procurement",
    "Legal advice and formal compliance certification unless explicitly scoped",
    "Ongoing care plans beyond initial stabilisation",
    "Work outside the capabilities reflected in each scenario",
  ];
}

function phaseBreakdownFromPackages(
  packages: PackageCostTrace[],
  config: PricingConfig,
): PhaseBreakdownItem[] {
  const byId = new Map(config.workPackages.map((p) => [p.id, p]));
  const phases = new Map<string, ThreePoint>();
  for (const row of packages) {
    const phase = byId.get(row.packageId)?.phase ?? "Other";
    const current = phases.get(phase) ?? { low: 0, likely: 0, high: 0 };
    phases.set(phase, {
      low: current.low + row.costZar.low,
      likely: current.likely + row.costZar.likely,
      high: current.high + row.costZar.high,
    });
  }
  const totalLikely =
    [...phases.values()].reduce((s, p) => s + p.likely, 0) || 1;

  return [...phases.entries()]
    .map(([phase, range]) => {
      const rounded = roundMoneyRange(range, config.commercial.roundingBands);
      return {
        phase,
        range: rounded,
        rangeDisplay: formatZarRange(rounded),
        shareOfLikely: range.likely / totalLikely,
      };
    })
    .sort((a, b) => b.range.likely - a.range.likely);
}

function costDriversFromPackages(
  packages: PackageCostTrace[],
  limit = 5,
): CostDriver[] {
  return [...packages]
    .sort((a, b) => b.expectedCostZar - a.expectedCostZar)
    .slice(0, limit)
    .map((row) => ({
      id: row.packageId,
      label: row.name,
      explanation: `A primary cost driver based on scoped effort for ${row.name.toLowerCase()}.`,
      range: row.costZar,
      rangeDisplay: formatZarRange(row.costZar),
    }));
}

function scoreScenario(scenario: ScenarioInternal, discoveryFirst: boolean): number {
  if (scenario.id === "recommended") return 100;
  if (scenario.id === "lean") return discoveryFirst ? 40 : 60;
  return 50;
}

/**
 * Deterministic estimate:
 * same answers + pricingConfig checksum → same result.
 * Budget answers are ignored for math.
 *
 * Pipeline: resolve → modifiers → uncertainty → PERT cost → scenarios →
 * timeline → discovery → rounding → { publicResult, privateTrace }.
 */
export function calculateEstimate(
  answers: EngineAnswers | ProjectBlueprintAnswers,
  pricingConfig: PricingConfig = PLACEHOLDER_PRICING_CONFIG,
): InternalEstimate {
  const mathAnswers = toEngineAnswers(answers);

  const answersChecksum = checksum(mathAnswers);
  const configChecksum = checksum({
    pricingVersion: pricingConfig.pricingVersion,
    isPlaceholder: pricingConfig.isPlaceholder,
    roles: pricingConfig.roles,
    workPackages: pricingConfig.workPackages,
    foundationPackageIds: pricingConfig.foundationPackageIds,
    modifiers: pricingConfig.modifiers,
    riskFactors: pricingConfig.riskFactors,
    uncertaintyRules: pricingConfig.uncertaintyRules,
    discovery: pricingConfig.discovery,
    commercial: pricingConfig.commercial,
    scenarios: pricingConfig.scenarios,
    monteCarlo: pricingConfig.monteCarlo,
    timeline: pricingConfig.timeline,
  });
  const combinedChecksum = combineChecksums(answersChecksum, configChecksum);
  const estimateId = `est_${combinedChecksum}`;
  const calculationTraceReference = `trace_${combinedChecksum}`;

  // 1. Resolve capabilities → packages + modifiers + risk flags
  const resolved = resolveSelection(mathAnswers, pricingConfig);

  // 2. Discovery gate (still return full-product ranges when recommended)
  const discovery = evaluateDiscovery(mathAnswers, pricingConfig, resolved);
  const rates = rateMap(pricingConfig);
  const byId = new Map(pricingConfig.workPackages.map((p) => [p.id, p]));

  // 3. Explicit scenario package sets (never % haircuts)
  const scenarioDefs = buildAllScenarios(resolved, pricingConfig);

  const scenarioInternals: ScenarioInternal[] = scenarioDefs.map((def) => {
    // 4. Uncertainty widen per package
    const uncertainty = buildUncertaintyMap(
      mathAnswers,
      pricingConfig,
      def.packageIds,
      resolved.riskFlagIds,
      resolved.uncertaintyRuleIds,
    );

    const packageTraces: PackageCostTrace[] = [];
    const hoursByPackage = new Map<string, ThreePoint>();

    for (const packageId of def.packageIds) {
      const pkg = byId.get(packageId);
      if (!pkg) continue;

      // 5. Base hours → modifiers → uncertainty → PERT cost
      const base = packageBaseHours(pkg);
      const modified = applyModifiersToHours(
        pkg,
        base,
        pricingConfig,
        resolved.appliedModifierIds,
      );
      const widen = uncertainty.get(packageId)?.widenFactor ?? 1;
      const hours = applyUncertaintyToHours(modified.hours, widen);
      hoursByPackage.set(packageId, hours);

      const costZar = costFromHours(pkg, hours, rates);
      const expectedHours = pertExpectedFrom(hours);
      const expectedCostZar = pertExpected(
        costZar.low,
        costZar.likely,
        costZar.high,
      );

      packageTraces.push({
        packageId,
        name: pkg.name,
        hours,
        costZar,
        expectedHours,
        expectedCostZar,
        varianceHours: pertVariance(hours.low, hours.high),
        appliedModifiers: modified.applied,
        uncertaintyWiden: widen,
      });
    }

    let costZar = sumThreePoint(packageTraces.map((p) => p.costZar));
    costZar = applyCommercialFloor(
      costZar,
      pricingConfig.commercial.minimumEngagementZar,
    );

    const varianceCost = packageTraces.reduce(
      (s, p) => s + pertVariance(p.costZar.low, p.costZar.high),
      0,
    );

    const expectedAfterFloor = pertExpected(
      costZar.low,
      costZar.likely,
      costZar.high,
    );
    let p50 = approximateP50(expectedAfterFloor, varianceCost);
    let p80 = approximateP80(expectedAfterFloor, varianceCost);

    if (pricingConfig.monteCarlo?.enabled) {
      const mc = runCostMonteCarlo(
        packageTraces.map((p) => p.costZar),
        pricingConfig.monteCarlo.iterations,
        seedFromChecksum(combinedChecksum),
      );
      p50 = mc.p50;
      p80 = mc.p80;
    }

    // 6. Timeline from dependency graph + parallel lanes
    const timeline = estimateTimeline(
      def.packageIds,
      pricingConfig,
      mathAnswers,
      hoursByPackage,
    );

    return {
      id: def.id,
      name: def.name,
      packageIds: def.packageIds,
      capabilityIds: def.capabilityIds,
      costZar,
      expectedCostZar: expectedAfterFloor,
      p50Zar: p50,
      p80Zar: p80,
      varianceCost,
      packages: packageTraces,
      timeline: {
        minimumWeeks: timeline.minimumWeeks,
        likelyWeeks: timeline.likelyWeeks,
      },
    };
  });

  const recommendedInternal =
    scenarioInternals.find((s) => s.id === "recommended") ??
    [...scenarioInternals].sort(
      (a, b) =>
        scoreScenario(b, discovery.recommended) -
        scoreScenario(a, discovery.recommended),
    )[0]!;

  // 7. Public rounding
  const toPublicScenario = (
    s: ScenarioInternal,
    description?: string,
  ): PublicScenario => {
    const rounded = roundMoneyRange(
      s.costZar,
      pricingConfig.commercial.roundingBands,
    );
    const publicRange = {
      low: rounded.low,
      likely: rounded.likely,
      high: Math.max(
        rounded.high,
        roundMoneyRange(
          { low: s.p80Zar, likely: s.p80Zar, high: s.p80Zar },
          pricingConfig.commercial.roundingBands,
        ).high,
      ),
    };
    return {
      id: s.id,
      name: s.name,
      description,
      range: publicRange,
      rangeDisplay: formatZarRange(publicRange),
      timeline: s.timeline,
      includedCapabilities: s.capabilityIds,
      includedPackages: s.packageIds,
    };
  };

  const defById = new Map(scenarioDefs.map((d) => [d.id, d]));
  const recommendedScenario = toPublicScenario(
    recommendedInternal,
    defById.get(recommendedInternal.id)?.description,
  );
  const alternativeScenarios = scenarioInternals
    .filter((s) => s.id !== recommendedInternal.id)
    .map((s) => toPublicScenario(s, defById.get(s.id)?.description));

  const roundedPackages = recommendedInternal.packages.map((p) => ({
    ...p,
    costZar: roundMoneyRange(p.costZar, pricingConfig.commercial.roundingBands),
  }));

  const uncertaintyExplanations = collectUncertaintyExplanations(
    mathAnswers,
    pricingConfig,
    resolved.riskFlagIds,
    resolved.uncertaintyRuleIds,
  );

  let discoveryRange: ThreePoint | undefined;
  let discoveryRangeDisplay: string | undefined;
  const discoveryPkg = byId.get(pricingConfig.discovery.packageId);
  if (discoveryPkg) {
    const hours = packageBaseHours(discoveryPkg);
    const cost = costFromHours(discoveryPkg, hours, rates);
    const rounded = roundMoneyRange(cost, pricingConfig.commercial.roundingBands);
    discoveryRange = rounded;
    discoveryRangeDisplay = formatZarRange(rounded);
  }

  const recommendedNextStep = discovery.recommended
    ? "Begin with a discovery and architecture engagement."
    : "Review the recommended release with a Good Code specialist and confirm priorities for a formal quotation.";

  const publicResult: PublicEstimateResult = {
    estimateId,
    pricingVersion: pricingConfig.pricingVersion,
    currency: "ZAR",
    recommendedScenario,
    alternativeScenarios,
    phaseBreakdown: phaseBreakdownFromPackages(roundedPackages, pricingConfig),
    costDrivers: costDriversFromPackages(roundedPackages).map((d) => ({
      ...d,
      range: roundMoneyRange(d.range, pricingConfig.commercial.roundingBands),
      rangeDisplay: formatZarRange(
        roundMoneyRange(d.range, pricingConfig.commercial.roundingBands),
      ),
    })),
    confidence: {
      level: discovery.confidenceLevel,
      explanation:
        discovery.confidenceLevel === "high"
          ? "Key scope choices are clear enough for a focused planning range."
          : discovery.confidenceLevel === "moderate"
            ? "Some uncertainty remains; the range accounts for open decisions."
            : "Confidence is early — discovery is recommended before locking implementation scope.",
      unknowns: [
        ...uncertaintyExplanations,
        ...((mathAnswers.unknowns as string[] | undefined) ?? []).map(
          formatUnknownQuestionId,
        ),
      ].filter((v, i, arr) => arr.indexOf(v) === i),
    },
    assumptions: buildAssumptions(mathAnswers, pricingConfig),
    exclusions: buildExclusions(),
    recommendedNextStep,
    calculationTraceReference,
    discoveryFirst: {
      recommended: discovery.recommended,
      summary: discovery.summary,
      offering: discovery.offering,
      discoveryRange,
      discoveryRangeDisplay,
    },
  };

  const privateTrace = {
    estimateId,
    pricingVersion: pricingConfig.pricingVersion,
    answersChecksum,
    configChecksum,
    combinedChecksum,
    selectedPackageIds: resolved.packageIds,
    appliedModifiers: resolved.appliedModifierIds,
    riskFlags: resolved.riskFlagIds,
    uncertaintyRules: resolved.uncertaintyRuleIds,
    discoveryFirst: discovery.recommended,
    discoveryPackageId: pricingConfig.discovery.packageId,
    scenarios: scenarioInternals,
    internalCommercial: {
      currency: "ZAR" as const,
      taxRate: pricingConfig.commercial.taxRate,
      targetMargin: pricingConfig.commercial.targetMargin,
      minimumEngagementZar: pricingConfig.commercial.minimumEngagementZar,
      rawExpectedBeforeFloor: recommendedInternal.expectedCostZar,
      sellRatesUsed: pricingConfig.roles.map((r) => ({
        roleId: r.roleId,
        sellRateZarPerHour: r.sellRateZarPerHour,
      })),
    },
    notes: [
      ...(pricingConfig.isPlaceholder
        ? ["PLACEHOLDER configuration — not calibrated."]
        : []),
      ...discovery.reasons,
      "Budget answers were ignored for calculation math.",
    ],
  };

  return { publicResult, privateTrace };
}
