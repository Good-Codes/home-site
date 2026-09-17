/**
 * High-impact clarifying questions for AI intake.
 * Every question is shown after the description so inferred fields can be confirmed.
 */

import { clearUnknownMarker } from "../answer-path";
import type {
  IntakeClarifyingQuestion,
  ProjectBlueprintAnswers,
} from "../types";

const NOT_SURE = { id: "not_sure", label: "I’m not sure yet" };

export type ClarificationApply = (
  answers: ProjectBlueprintAnswers,
  values: string[],
) => ProjectBlueprintAnswers;

export type IntakeWhitelistQuestion = IntakeClarifyingQuestion & {
  apply: ClarificationApply;
};

function withoutUnknown(values: string[]): string[] {
  return values.filter(
    (value) =>
      value !== "not_sure" &&
      value !== "unknown" &&
      value !== "need_advice" &&
      value !== "help_me_choose",
  );
}

function markUnknown(
  answers: ProjectBlueprintAnswers,
  questionId: string,
): ProjectBlueprintAnswers {
  return {
    ...answers,
    unknowns: {
      ...answers.unknowns,
      [questionId]: "not_sure",
    },
  };
}

function applyKnown(
  answers: ProjectBlueprintAnswers,
  questionId: string,
  patch: Partial<ProjectBlueprintAnswers>,
): ProjectBlueprintAnswers {
  return clearUnknownMarker({ ...answers, ...patch }, questionId);
}

function withCapabilities(
  answers: ProjectBlueprintAnswers,
  extra: string[],
  removePrefix?: string,
): string[] {
  const current = (answers.capabilities ?? []).filter((id) =>
    removePrefix ? !id.startsWith(removePrefix) : true,
  );
  return [...new Set([...current, ...extra])];
}

export const INTAKE_WHITELIST: IntakeWhitelistQuestion[] = [
  {
    id: "q.surfaces.channels",
    prompt: "Where will people use this product first?",
    help: "Choose every channel needed in the first meaningful release.",
    kind: "multi",
    options: [
      { id: "surface.public_web", label: "Public website or web app" },
      { id: "surface.customer_portal", label: "Signed-in customer or client portal" },
      { id: "surface.admin_workspace", label: "Staff or admin workspace" },
      { id: "surface.native_mobile", label: "iOS / Android app" },
      { id: "surface.public_api", label: "API for other systems" },
      NOT_SURE,
    ],
    apply(answers, values) {
      const chosen = withoutUnknown(values).filter((id) => id.startsWith("surface."));
      if (!chosen.length) return markUnknown(answers, "q.surfaces.channels");
      return applyKnown(answers, "q.surfaces.channels", { surfaces: chosen });
    },
  },
  {
    id: "q.context.starting_point",
    prompt: "Where are you starting from?",
    help: "This shapes how much discovery and reuse we should assume.",
    kind: "single",
    options: [
      { id: "start.new_idea", label: "A new idea" },
      { id: "start.validated_concept", label: "A validated concept" },
      { id: "start.existing_product", label: "An existing product that needs new work" },
      { id: "start.legacy_replacement", label: "Replacing a legacy system" },
      { id: "start.connect_systems", label: "Connecting existing systems" },
      NOT_SURE,
    ],
    apply(answers, values) {
      const chosen = withoutUnknown(values)[0];
      if (!chosen) return markUnknown(answers, "q.context.starting_point");
      return applyKnown(answers, "q.context.starting_point", {
        startingPoint: chosen,
      });
    },
  },
  {
    id: "q.intake.payments",
    prompt: "Will people pay inside the product?",
    help: "In-product payments change scope more than most other features.",
    kind: "single",
    options: [
      { id: "pay.one_time", label: "Yes — one-time or checkout payments" },
      { id: "pay.recurring", label: "Yes — subscriptions or recurring billing" },
      { id: "pay.none", label: "No — payments are not part of the first release" },
      NOT_SURE,
    ],
    apply(answers, values) {
      const chosen = withoutUnknown(values)[0];
      if (!chosen) return markUnknown(answers, "q.intake.payments");
      if (chosen === "pay.none") {
        return applyKnown(answers, "q.intake.payments", {
          capabilities: (answers.capabilities ?? []).filter(
            (id) => !id.startsWith("cap.payments."),
          ),
          paymentsFollowUps: {
            ...answers.paymentsFollowUps,
            paymentModes: ["pay.none"],
          },
        });
      }
      if (chosen === "pay.one_time") {
        return applyKnown(answers, "q.intake.payments", {
          capabilities: withCapabilities(answers, ["cap.payments.one_time"]),
          paymentsFollowUps: {
            ...answers.paymentsFollowUps,
            paymentModes: ["pay.one_time"],
          },
        });
      }
      if (chosen === "pay.recurring") {
        return applyKnown(answers, "q.intake.payments", {
          capabilities: withCapabilities(answers, [
            "cap.payments.recurring",
            "cap.payments.subscriptions",
          ]),
          paymentsFollowUps: {
            ...answers.paymentsFollowUps,
            paymentModes: ["pay.recurring"],
          },
        });
      }
      return answers;
    },
  },
  {
    id: "q.integrations.systems",
    prompt: "Does this product need to connect to other systems?",
    help: "Integrations and data movement often drive both cost and uncertainty.",
    kind: "multi",
    options: [
      { id: "integration.none", label: "No integrations in the first release" },
      { id: "integration.payment_gateway", label: "Payment gateway" },
      { id: "integration.accounting_erp", label: "Accounting or ERP" },
      { id: "integration.crm", label: "CRM" },
      { id: "integration.internal_system", label: "An existing internal system" },
      { id: "integration.other_api", label: "Another external API" },
      NOT_SURE,
    ],
    apply(answers, values) {
      const chosen = withoutUnknown(values);
      if (!chosen.length) return markUnknown(answers, "q.integrations.systems");
      if (chosen.includes("integration.none") && chosen.length === 1) {
        return applyKnown(answers, "q.integrations.systems", {
          integrations: ["integration.none"],
        });
      }
      return applyKnown(answers, "q.integrations.systems", {
        integrations: chosen.filter((id) => id !== "integration.none"),
      });
    },
  },
  {
    id: "q.users.groups",
    prompt: "Who will use it?",
    help: "Approximate groups are enough — exact counts can wait.",
    kind: "multi",
    options: [
      { id: "users.customers", label: "Customers or clients" },
      { id: "users.employees", label: "Internal staff" },
      { id: "users.administrators", label: "Administrators" },
      { id: "users.partners", label: "Partners or suppliers" },
      { id: "users.tenants", label: "Multiple organisations / tenants" },
      NOT_SURE,
    ],
    apply(answers, values) {
      const chosen = withoutUnknown(values).filter((id) => id.startsWith("users."));
      if (!chosen.length) return markUnknown(answers, "q.users.groups");
      return applyKnown(answers, "q.users.groups", {
        userGroups: chosen,
        multiTenant: chosen.includes("users.tenants") ? true : answers.multiTenant,
      });
    },
  },
  {
    id: "q.users.scale",
    prompt: "Roughly how many people will use it?",
    help: "A planning band is enough.",
    kind: "single",
    options: [
      { id: "scale.under_100", label: "Fewer than 100" },
      { id: "scale.100_1000", label: "100–1,000" },
      { id: "scale.1000_10000", label: "1,000–10,000" },
      { id: "scale.10000_100000", label: "10,000 or more" },
      NOT_SURE,
    ],
    apply(answers, values) {
      const chosen = withoutUnknown(values)[0];
      if (!chosen) return markUnknown(answers, "q.users.scale");
      return applyKnown(answers, "q.users.scale", { userScale: chosen });
    },
  },
  {
    id: "q.quality.requirements",
    prompt: "Does this handle sensitive or regulated information?",
    help: "Only select what is genuinely required — overstating this widens the range.",
    kind: "multi",
    options: [
      { id: "quality.none", label: "No particular sensitivity beyond a normal business app" },
      { id: "quality.personal_sensitive", label: "Personal or sensitive information" },
      { id: "quality.financial_info", label: "Financial information" },
      { id: "quality.payment_card_info", label: "Payment-card information" },
      { id: "quality.popia_privacy", label: "POPIA or privacy obligations" },
      { id: "quality.industry_compliance", label: "Industry-specific compliance" },
      NOT_SURE,
    ],
    apply(answers, values) {
      const chosen = withoutUnknown(values);
      if (!chosen.length) return markUnknown(answers, "q.quality.requirements");
      if (chosen.includes("quality.none") && chosen.length === 1) {
        return applyKnown(answers, "q.quality.requirements", {
          qualityRequirements: ["quality.none"],
        });
      }
      return applyKnown(answers, "q.quality.requirements", {
        qualityRequirements: chosen.filter((id) => id !== "quality.none"),
      });
    },
  },
  {
    id: "q.delivery.timing",
    prompt: "When do you want this project completed?",
    help: "Pick the planning window that fits. This is a target, not a guaranteed delivery date.",
    kind: "single",
    options: [
      { id: "timing.within_3_months", label: "1–3 months" },
      { id: "timing.3_to_6_months", label: "3–6 months" },
      { id: "timing.6_to_12_months", label: "6–12 months" },
      { id: "timing.over_12_months", label: "12+ months" },
    ],
    apply(answers, values) {
      const chosen = withoutUnknown(values)[0];
      if (!chosen) return markUnknown(answers, "q.delivery.timing");
      return applyKnown(answers, "q.delivery.timing", { timing: chosen });
    },
  },
];

const WHITELIST_BY_ID = new Map(
  INTAKE_WHITELIST.map((question) => [question.id, question]),
);

export function getWhitelistIds(): string[] {
  return INTAKE_WHITELIST.map((question) => question.id);
}

export function getWhitelistQuestion(
  id: string,
): IntakeWhitelistQuestion | undefined {
  return WHITELIST_BY_ID.get(id);
}

export function toPublicQuestion(
  question: IntakeWhitelistQuestion,
): IntakeClarifyingQuestion {
  const { apply: _apply, ...publicQuestion } = question;
  void _apply;
  return publicQuestion;
}

export function applyClarifications(
  answers: ProjectBlueprintAnswers,
  clarifications: Array<{ questionId: string; values: string[] }>,
): ProjectBlueprintAnswers {
  let next = answers;
  for (const clarification of clarifications) {
    const def = WHITELIST_BY_ID.get(clarification.questionId);
    if (!def) continue;
    next = def.apply(next, clarification.values);
  }
  return next;
}

function isMarkedUnknown(
  answers: ProjectBlueprintAnswers,
  questionId: string,
): boolean {
  return Boolean(answers.unknowns?.[questionId]);
}

/**
 * True when OpenAI, fallback, or a real user click already filled the field.
 * “No payments” / “no extra quality” are not visible as filled fields — those
 * rely on excludeIds / unknowns instead.
 */
function isFieldFilled(
  questionId: string,
  answers: ProjectBlueprintAnswers,
): boolean {
  switch (questionId) {
    case "q.surfaces.channels":
      return (answers.surfaces?.length ?? 0) > 0;
    case "q.context.starting_point":
      return Boolean(answers.startingPoint);
    case "q.intake.payments":
      return (
        (answers.capabilities ?? []).some((id) =>
          id.startsWith("cap.payments."),
        ) ||
        (answers.paymentsFollowUps?.paymentModes ?? []).includes("pay.none")
      );
    case "q.integrations.systems": {
      const integrations = answers.integrations ?? [];
      return (
        integrations.length > 0 && !integrations.includes("integration.unknown")
      );
    }
    case "q.users.groups":
      return (answers.userGroups?.length ?? 0) > 0;
    case "q.users.scale":
      return Boolean(answers.userScale);
    case "q.quality.requirements":
      return (answers.qualityRequirements?.length ?? 0) > 0;
    case "q.delivery.timing":
      return Boolean(answers.timing);
    default:
      return false;
  }
}

export function isQuestionSettled(
  questionId: string,
  answers: ProjectBlueprintAnswers,
  excludeIds: Iterable<string> = [],
): boolean {
  const excluded = excludeIds instanceof Set ? excludeIds : new Set(excludeIds);
  if (excluded.has(questionId)) return true;
  if (isMarkedUnknown(answers, questionId)) return true;
  return isFieldFilled(questionId, answers);
}

export function inferGapQuestionIds(
  answers: ProjectBlueprintAnswers,
  _ideaText: string,
  excludeIds: Iterable<string> = [],
): string[] {
  return INTAKE_WHITELIST.map((question) => question.id).filter(
    (id) => !isQuestionSettled(id, answers, excludeIds),
  );
}

export function selectClarifyingQuestions(args: {
  requestedIds?: string[];
  answers: ProjectBlueprintAnswers;
  ideaText: string;
  round: number;
  forceReady?: boolean;
  excludeIds?: string[];
}): IntakeClarifyingQuestion[] {
  void args.requestedIds;
  void args.answers;
  void args.ideaText;
  void args.round;
  if (args.forceReady) return [];

  const excludeIds = new Set(args.excludeIds ?? []);
  return INTAKE_WHITELIST.filter((question) => !excludeIds.has(question.id)).map(
    toPublicQuestion,
  );
}

function paymentSelection(answers: ProjectBlueprintAnswers): string[] {
  const modes = answers.paymentsFollowUps?.paymentModes ?? [];
  if (modes.includes("pay.none")) return ["pay.none"];
  const caps = answers.capabilities ?? [];
  if (caps.some((id) => id.includes("recurring") || id.includes("subscription"))) {
    return ["pay.recurring"];
  }
  if (caps.some((id) => id.startsWith("cap.payments."))) {
    return ["pay.one_time"];
  }
  if (answers.unknowns?.["q.intake.payments"]) return ["not_sure"];
  return [];
}

/**
 * Map already-inferred answers onto whitelist option IDs so the form can
 * pre-select without hiding the question.
 */
export function selectionsFromAnswers(
  answers: ProjectBlueprintAnswers,
  questions: IntakeClarifyingQuestion[] = INTAKE_WHITELIST,
): Record<string, string[]> {
  const raw: Record<string, string[]> = {};
  if (answers.surfaces?.length) {
    raw["q.surfaces.channels"] = answers.surfaces.filter((id) =>
      id.startsWith("surface."),
    );
  }
  if (answers.startingPoint) {
    raw["q.context.starting_point"] = [answers.startingPoint];
  }
  const payments = paymentSelection(answers);
  if (payments.length) raw["q.intake.payments"] = payments;

  const integrations = (answers.integrations ?? []).filter(
    (id) => id !== "integration.unknown",
  );
  if (integrations.length) raw["q.integrations.systems"] = integrations;

  if (answers.userGroups?.length) {
    raw["q.users.groups"] = answers.userGroups.filter((id) =>
      id.startsWith("users."),
    );
  }
  if (answers.userScale) raw["q.users.scale"] = [answers.userScale];
  if (answers.qualityRequirements?.length) {
    raw["q.quality.requirements"] = answers.qualityRequirements;
  }
  if (answers.timing) raw["q.delivery.timing"] = [answers.timing];

  const allowed = new Map(
    questions.map((question) => [
      question.id,
      new Set(question.options.map((option) => option.id)),
    ]),
  );
  const next: Record<string, string[]> = {};
  for (const [questionId, values] of Object.entries(raw)) {
    const optionIds = allowed.get(questionId);
    if (!optionIds) continue;
    const filtered = values.filter((id) => optionIds.has(id));
    if (filtered.length) next[questionId] = filtered;
  }
  return next;
}
