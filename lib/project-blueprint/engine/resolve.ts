import { resolveCapabilityDependencies } from "../branching/dependencies";
import type {
  CapabilityId,
  EngineAnswers,
  Modifier,
  ModifierTrigger,
  PricingConfig,
  ResolvedSelection,
  RiskFactor,
  UncertaintyRule,
} from "./types";

/**
 * Minimal capability dependency map kept for documentation / fallback.
 * Runtime expansion uses ../branching/dependencies.resolveCapabilityDependencies.
 */
export const CAPABILITY_DEPENDENCIES: Record<string, string[]> = {
  "cap.payments.one_time": [
    "cap.access.registration_login",
    "foundation.transaction_logging",
    "foundation.security_baseline",
  ],
  "cap.payments.subscriptions": [
    "cap.access.registration_login",
    "foundation.transaction_logging",
    "foundation.security_baseline",
  ],
  "cap.access.multi_tenant": [
    "cap.access.registration_login",
    "foundation.security_baseline",
  ],
};

/** Expand selected capabilities with mandatory foundations (non-removable). */
export function expandCapabilityDependencies(selected: string[]): string[] {
  return resolveCapabilityDependencies(selected).sort();
}

function readPath(answers: EngineAnswers, path: string): unknown {
  if (path in answers) return answers[path];
  const parts = path.split(".");
  let cur: unknown = answers;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function isUnknownish(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    const v = value.toLowerCase();
    return (
      v === "unknown" ||
      v === "not_sure" ||
      v === "unsure" ||
      v === "need_advice" ||
      v === "i_am_not_sure" ||
      v === "help_me_choose"
    );
  }
  return false;
}

export function triggerMatches(
  answers: EngineAnswers,
  trigger: ModifierTrigger,
): boolean {
  const value = readPath(answers, trigger.answerPath);

  if (trigger.whenUnknown) {
    if (Array.isArray(value)) return value.some(isUnknownish) || value.length === 0;
    return isUnknownish(value);
  }

  if (trigger.minCount !== undefined) {
    if (Array.isArray(value)) return value.length >= trigger.minCount;
    if (typeof value === "string" && value.includes(",")) {
      return value.split(",").filter(Boolean).length >= trigger.minCount;
    }
    if (typeof value === "number") return value >= trigger.minCount;
    return false;
  }

  if (trigger.whenPresent) {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.length > 0 && !["false", "no", "none", "n/a"].includes(value.toLowerCase());
    }
    return value !== null && value !== undefined;
  }

  if (trigger.anyOf && trigger.anyOf.length > 0) {
    const needles = trigger.anyOf.map((n) => String(n).toLowerCase());
    if (Array.isArray(value)) {
      return value.some((v) => needles.includes(String(v).toLowerCase()));
    }
    if (typeof value === "boolean" || typeof value === "number") {
      return needles.includes(String(value).toLowerCase());
    }
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      return needles.some((n) => lower === n || lower.includes(n));
    }
  }

  return false;
}

const SURFACE_TO_CAPABILITY: Record<string, CapabilityId> = {
  "surface.public_web": "frontend",
  "surface.customer_portal": "frontend",
  "surface.admin": "frontend",
  "surface.mobile_web": "frontend",
  "surface.mobile_app": "mobile",
  "surface.api": "backend",
  "surface.jobs": "backend",
  "surface.reporting": "backend",
  "surface.cloud": "cloud",
  public_web: "frontend",
  customer_portal: "frontend",
  admin: "frontend",
  mobile_web: "frontend",
  mobile_app: "mobile",
  ios_android: "mobile",
  api: "backend",
  cloud: "cloud",
};

const CAP_STRING_TO_PACKAGE: Partial<Record<CapabilityId, string>> = {
  discovery: "wp.discovery",
  ux: "wp.ux",
  frontend: "wp.frontend",
  backend: "wp.backend",
  mobile: "wp.mobile",
  integrations: "wp.integrations",
  cloud: "wp.cloud",
  qa: "wp.qa",
  security: "wp.security",
  pm: "wp.pm",
  launch: "wp.launch",
};

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return [value];
  return [];
}

function migrationInScope(answers: EngineAnswers): boolean {
  const migration = answers.migration;
  if (migration === undefined || migration === null || migration === false) return false;
  if (typeof migration === "string") {
    const v = migration.toLowerCase();
    return v.length > 0 && v !== "none" && v !== "no" && v !== "false";
  }
  return true;
}

function inferCapabilities(answers: EngineAnswers): CapabilityId[] {
  const caps = new Set<CapabilityId>(["ux", "frontend", "backend", "qa", "security", "pm", "launch"]);

  for (const surface of asStringArray(answers.surfaces)) {
    const mapped = SURFACE_TO_CAPABILITY[surface] ?? SURFACE_TO_CAPABILITY[surface.toLowerCase()];
    if (mapped) caps.add(mapped);
  }

  for (const raw of asStringArray(answers.capabilities)) {
    const lower = raw.toLowerCase();
    if (lower.includes("payment") || lower.includes("workflow") || lower.includes("data")) {
      caps.add("backend");
    }
    if (lower.includes("ai") || lower.includes("intelligence")) {
      caps.add("backend");
    }
    if (lower.includes("multi_tenant") || lower.includes("auth") || lower.includes("kyc")) {
      caps.add("security");
      caps.add("backend");
    }
  }

  if (asStringArray(answers.integrations).length > 0) caps.add("integrations");
  if (migrationInScope(answers)) {
    caps.add("integrations");
  }
  if (asStringArray(answers.cloud).length > 0) caps.add("cloud");

  const start = String(answers.startingPoint ?? "").toLowerCase();
  if (start.includes("discovery") || start.includes("need_discovery")) {
    caps.add("discovery");
  }

  return [...caps];
}

function packagesForCapabilities(
  config: PricingConfig,
  capabilities: CapabilityId[],
  answers: EngineAnswers,
): string[] {
  const ids = new Set<string>();

  for (const cap of capabilities) {
    const mapped = CAP_STRING_TO_PACKAGE[cap];
    if (mapped) ids.add(mapped);
  }

  for (const foundationId of config.foundationPackageIds) {
    ids.add(foundationId);
  }

  // Conditional packages
  if (capabilities.includes("mobile")) ids.add("wp.mobile");
  if (capabilities.includes("integrations")) ids.add("wp.integrations");
  if (capabilities.includes("cloud")) ids.add("wp.cloud");
  if (capabilities.includes("discovery")) ids.add("wp.discovery");

  if (migrationInScope(answers)) {
    ids.add("wp.migration");
  }

  // Audit foundation when payments / regulated / multi-tenant
  const caps = asStringArray(answers.capabilities).map((c) => c.toLowerCase());
  if (
    caps.some((c) => c.includes("payment") || c.includes("multi_tenant")) ||
    answers.regulated
  ) {
    ids.add("wp.foundation.audit");
  }

  if (capabilities.includes("frontend")) {
    ids.add("wp.foundation.a11y_responsive");
  }

  // Always include launch when building product
  ids.add("wp.launch");

  // Drop packages that don't exist in config
  const known = new Set(config.workPackages.map((p) => p.id));
  return [...ids].filter((id) => known.has(id)).sort();
}

function collectApplied(
  answers: EngineAnswers,
  items: Array<Modifier | RiskFactor | UncertaintyRule>,
): string[] {
  return items.filter((item) => triggerMatches(answers, item.trigger)).map((i) => i.id);
}

/**
 * Map answers → selected work packages + applied modifiers + risk flags
 * using dependency rules. Budget fields are ignored.
 */
export function resolveSelection(
  answers: EngineAnswers,
  config: PricingConfig,
): ResolvedSelection {
  // Strip budget before any logic that might inspect unknown keys incidentally
  const { budget: _b, budgetBand: _bb, ...scoped } = answers;
  void _b;
  void _bb;

  const expandedCaps = expandCapabilityDependencies(
    asStringArray(scoped.capabilities),
  );
  const inferred = inferCapabilities({
    ...scoped,
    capabilities: expandedCaps,
  });

  const packageIds = packagesForCapabilities(config, inferred, scoped);

  // Ensure dependency packages referenced by work packages are present
  const byId = new Map(config.workPackages.map((p) => [p.id, p]));
  const withDeps = new Set(packageIds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...withDeps]) {
      const pkg = byId.get(id);
      if (!pkg) continue;
      for (const dep of pkg.dependsOn) {
        if (byId.has(dep) && !withDeps.has(dep)) {
          withDeps.add(dep);
          changed = true;
        }
      }
    }
  }

  const mandatoryPackageIds = [
    ...config.foundationPackageIds,
    ...config.workPackages.filter((p) => p.isFoundation).map((p) => p.id),
  ]
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .sort();

  for (const id of mandatoryPackageIds) {
    if (byId.has(id)) withDeps.add(id);
  }

  const appliedModifierIds = collectApplied(scoped, config.modifiers);
  const riskFlagIds = collectApplied(scoped, config.riskFactors);
  const uncertaintyRuleIds = collectApplied(scoped, config.uncertaintyRules);

  // Migration modifier implies package
  if (appliedModifierIds.includes("mod.migration")) {
    withDeps.add("wp.migration");
  }

  return {
    packageIds: [...withDeps].sort(),
    appliedModifierIds,
    riskFlagIds,
    uncertaintyRuleIds,
    mandatoryPackageIds,
    capabilityIds: inferred.sort(),
  };
}
