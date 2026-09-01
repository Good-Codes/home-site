/**
 * Capability foundation dependencies that cannot be removed while a dependent remains.
 */

export type CapabilityDependencyRule = {
  /** If this capability (or prefix) is selected… */
  capabilityId: string;
  /** …these foundation capability IDs are required and non-removable. */
  requires: string[];
  /** Human explanation for the UI when removal is blocked. */
  reason: string;
};

/**
 * Foundations automatically pulled in by higher-level capabilities.
 * Consumers should merge these into the effective capability set and
 * prevent users from removing required foundations while dependents remain.
 */
export const CAPABILITY_DEPENDENCIES: CapabilityDependencyRule[] = [
  {
    capabilityId: "cap.payments.",
    requires: [
      "cap.access.registration_login",
      "cap.access.role_permissions",
      "cap.data.audit_history",
      "foundation.transaction_logging",
      "foundation.security_baseline",
      "foundation.testing_baseline",
    ],
    reason:
      "Payments require authenticated users, permission controls, transaction logging, security hardening, and regression-safe testing.",
  },
  {
    capabilityId: "cap.payments.marketplace",
    requires: [
      "cap.payments.one_time",
      "cap.payments.payouts",
      "cap.payments.reconciliation",
      "cap.access.org_onboarding",
    ],
    reason:
      "Marketplace transactions need onboarding, payouts, and reconciliation in addition to core payment foundations.",
  },
  {
    capabilityId: "cap.payments.refunds",
    requires: ["cap.payments.one_time", "foundation.transaction_logging"],
    reason: "Refunds depend on an original payment path and durable transaction history.",
  },
  {
    capabilityId: "cap.payments.subscriptions",
    requires: ["cap.payments.recurring", "cap.access.registration_login"],
    reason: "Subscriptions need recurring billing and lasting customer accounts.",
  },
  {
    capabilityId: "cap.access.kyc",
    requires: [
      "cap.access.registration_login",
      "cap.data.files",
      "cap.data.audit_history",
      "foundation.security_baseline",
    ],
    reason:
      "Identity verification needs accounts, secure document handling, audit history, and a security baseline.",
  },
  {
    capabilityId: "cap.access.mfa",
    requires: ["cap.access.registration_login"],
    reason: "Multi-factor authentication builds on a primary login flow.",
  },
  {
    capabilityId: "cap.access.sso",
    requires: ["cap.access.registration_login"],
    reason: "Single sign-on still requires an application identity boundary.",
  },
  {
    capabilityId: "cap.access.role_permissions",
    requires: ["cap.access.registration_login"],
    reason: "Role management assumes authenticated users.",
  },
  {
    capabilityId: "cap.workflow.approvals",
    requires: [
      "cap.access.registration_login",
      "cap.access.role_permissions",
      "cap.data.audit_history",
    ],
    reason: "Approvals need authenticated actors, permissions, and an auditable history.",
  },
  {
    capabilityId: "cap.workflow.case_management",
    requires: ["cap.workflow.status_tracking", "cap.access.registration_login"],
    reason: "Case management depends on status tracking and signed-in users.",
  },
  {
    capabilityId: "cap.workflow.configurable",
    requires: ["cap.workflow.status_tracking", "cap.access.role_permissions"],
    reason: "Configurable workflows need status models and permission-aware administration.",
  },
  {
    capabilityId: "cap.data.signatures",
    requires: ["cap.data.files", "cap.data.audit_history"],
    reason: "Digital signatures need document storage and a verifiable audit trail.",
  },
  {
    capabilityId: "cap.ai.",
    requires: ["foundation.security_baseline", "foundation.testing_baseline"],
    reason: "AI-assisted features need security controls and evaluation-minded testing.",
  },
  {
    capabilityId: "cap.ai.human_reviewed",
    requires: ["cap.access.role_permissions", "cap.data.audit_history"],
    reason: "Human-reviewed AI workflows need permissions and review history.",
  },
  {
    capabilityId: "cap.comms.push",
    requires: ["cap.access.registration_login"],
    reason: "Push notifications require identifiable app users and device registration.",
  },
];

/** Synthetic foundation IDs that are not selectable cards but still block removal. */
export const FOUNDATION_IDS = [
  "foundation.transaction_logging",
  "foundation.security_baseline",
  "foundation.testing_baseline",
] as const;

export type FoundationId = (typeof FOUNDATION_IDS)[number];

function matchesRule(selectedId: string, ruleCapabilityId: string): boolean {
  if (ruleCapabilityId.endsWith(".")) {
    return selectedId.startsWith(ruleCapabilityId);
  }
  return selectedId === ruleCapabilityId;
}

/** Expand selected capabilities with all required foundations. */
export function resolveCapabilityDependencies(selected: string[]): string[] {
  const resolved = new Set(selected);

  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...resolved]) {
      for (const rule of CAPABILITY_DEPENDENCIES) {
        if (!matchesRule(id, rule.capabilityId)) continue;
        for (const req of rule.requires) {
          if (!resolved.has(req)) {
            resolved.add(req);
            changed = true;
          }
        }
      }
    }
  }

  return [...resolved];
}

export type RemovalBlock = {
  capabilityId: string;
  blockedBy: string[];
  reasons: string[];
};

/**
 * Determine whether a capability can be removed given the remaining selection.
 * Foundations required by still-selected dependents cannot be removed.
 */
export function getCapabilityRemovalBlock(
  capabilityId: string,
  selected: string[],
): RemovalBlock | null {
  const remaining = selected.filter((id) => id !== capabilityId);
  const blockedBy: string[] = [];
  const reasons: string[] = [];

  for (const other of remaining) {
    for (const rule of CAPABILITY_DEPENDENCIES) {
      if (!matchesRule(other, rule.capabilityId)) continue;
      if (rule.requires.includes(capabilityId)) {
        blockedBy.push(other);
        reasons.push(rule.reason);
      }
    }
  }

  if (blockedBy.length === 0) return null;
  return { capabilityId, blockedBy: [...new Set(blockedBy)], reasons: [...new Set(reasons)] };
}

export function canRemoveCapability(capabilityId: string, selected: string[]): boolean {
  return getCapabilityRemovalBlock(capabilityId, selected) === null;
}

/**
 * Apply a toggle while preserving mandatory foundations.
 * Returns the next selection and any blocked removals.
 */
export function toggleCapability(
  capabilityId: string,
  selected: string[],
  enabled: boolean,
): { next: string[]; blocked: RemovalBlock | null } {
  if (enabled) {
    return {
      next: resolveCapabilityDependencies([...selected, capabilityId]),
      blocked: null,
    };
  }

  const blocked = getCapabilityRemovalBlock(capabilityId, selected);
  if (blocked) {
    return { next: selected, blocked };
  }

  return {
    next: resolveCapabilityDependencies(selected.filter((id) => id !== capabilityId)),
    blocked: null,
  };
}
