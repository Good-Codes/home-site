import type {
  CapabilityId,
  PricingConfig,
  ResolvedSelection,
  ScenarioDefinition,
  ScenarioId,
  WorkPackage,
} from "./types";

/**
 * Scenario generation from explicit package sets — never % adjustments.
 * Mandatory safety dependencies are preserved in every scenario.
 */

const SCENARIO_ORDER: ScenarioId[] = ["lean", "recommended", "scale_ready"];

function packageById(config: PricingConfig): Map<string, WorkPackage> {
  return new Map(config.workPackages.map((p) => [p.id, p]));
}

/** Preserve mandatory foundations inside a scenario package list. */
export function preserveMandatoryDeps(
  packageIds: string[],
  mandatoryPackageIds: string[],
  available: Map<string, WorkPackage>,
): string[] {
  const set = new Set(packageIds.filter((id) => available.has(id)));
  for (const id of mandatoryPackageIds) {
    if (available.has(id)) set.add(id);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...set]) {
      const pkg = available.get(id);
      if (!pkg) continue;
      for (const dep of pkg.dependsOn) {
        if (available.has(dep) && !set.has(dep)) {
          set.add(dep);
          changed = true;
        }
      }
    }
  }

  return [...set].sort();
}

/**
 * Build one scenario from its configured package set.
 * - lean: definition packages ∩ (resolved ∪ foundations), no scale-only extras
 * - recommended: definition packages + resolved packages except scale-only
 * - scale_ready: definition packages ∪ resolved ∪ scale ops
 */
export function buildScenarioPackageSet(
  definition: ScenarioDefinition,
  resolved: ResolvedSelection,
  config: PricingConfig,
): { packageIds: string[]; capabilityIds: CapabilityId[] } {
  const available = packageById(config);
  const definitionSet = new Set(definition.packageIds.filter((id) => available.has(id)));
  const resolvedSet = new Set(resolved.packageIds);
  const selected = new Set<string>();

  if (definition.id === "lean") {
    // Explicit lean set only — intersect with resolved so unused surfaces drop out,
    // but always keep foundations / mandatory.
    for (const id of definitionSet) {
      const pkg = available.get(id);
      if (!pkg) continue;
      if (pkg.isFoundation || resolved.mandatoryPackageIds.includes(id)) {
        selected.add(id);
        continue;
      }
      // Include lean definition package when capability was inferred / selected
      if (resolvedSet.has(id) || resolved.capabilityIds.includes(pkg.capabilityId)) {
        selected.add(id);
      }
    }
    // Lean never includes scale ops or discovery-only by default
    selected.delete("wp.scale.ops");
    if (!resolved.capabilityIds.includes("discovery") && !resolvedSet.has("wp.discovery")) {
      selected.delete("wp.discovery");
    }
    // Optional heavy packages only if present in lean definition AND resolved
    for (const optional of ["wp.mobile", "wp.integrations", "wp.cloud", "wp.migration"]) {
      if (definitionSet.has(optional) && resolvedSet.has(optional)) {
        selected.add(optional);
      } else if (!definitionSet.has(optional)) {
        selected.delete(optional);
      } else if (!resolvedSet.has(optional)) {
        selected.delete(optional);
      }
    }
  } else if (definition.id === "recommended") {
    for (const id of definitionSet) selected.add(id);
    for (const id of resolvedSet) {
      const pkg = available.get(id);
      if (!pkg) continue;
      if (pkg.scenarioTags?.includes("scale_ready") && !pkg.scenarioTags.includes("recommended")) {
        continue;
      }
      if (id === "wp.scale.ops") continue;
      selected.add(id);
    }
    selected.delete("wp.scale.ops");
  } else {
    // scale_ready
    for (const id of definitionSet) selected.add(id);
    for (const id of resolvedSet) selected.add(id);
    if (available.has("wp.scale.ops")) selected.add("wp.scale.ops");
  }

  const packageIds = preserveMandatoryDeps(
    [...selected],
    resolved.mandatoryPackageIds,
    available,
  );

  const capabilityIds = [
    ...new Set([
      ...definition.capabilityIds,
      ...packageIds
        .map((id) => available.get(id)?.capabilityId)
        .filter((c): c is CapabilityId => Boolean(c)),
    ]),
  ].sort();

  return { packageIds, capabilityIds };
}

export function buildAllScenarios(
  resolved: ResolvedSelection,
  config: PricingConfig,
): Array<ScenarioDefinition & { packageIds: string[]; capabilityIds: CapabilityId[] }> {
  const byId = new Map(config.scenarios.map((s) => [s.id, s]));
  return SCENARIO_ORDER.map((id) => {
    const def = byId.get(id);
    if (!def) {
      throw new Error(`Missing scenario definition: ${id}`);
    }
    const built = buildScenarioPackageSet(def, resolved, config);
    return {
      ...def,
      packageIds: built.packageIds,
      capabilityIds: built.capabilityIds,
    };
  });
}
