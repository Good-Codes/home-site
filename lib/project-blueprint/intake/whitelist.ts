/**
 * High-impact clarifying questions for AI intake.
 * At most three are shown, and they map onto catalogue answer keys.
 */

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
      const next = { ...answers, surfaces: chosen };
      if (answers.unknowns?.["q.surfaces.channels"]) {
        const { "q.surfaces.channels": _drop, ...rest } = answers.unknowns;
        void _drop;
        next.unknowns = rest;
      }
      return next;
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
      return { ...answers, startingPoint: chosen };
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
        return {
          ...answers,
          capabilities: (answers.capabilities ?? []).filter(
            (id) => !id.startsWith("cap.payments."),
          ),
        };
      }
      if (chosen === "pay.one_time") {
        return {
          ...answers,
          capabilities: withCapabilities(answers, ["cap.payments.one_time"]),
        };
      }
      if (chosen === "pay.recurring") {
        return {
          ...answers,
          capabilities: withCapabilities(answers, [
            "cap.payments.recurring",
            "cap.payments.subscriptions",
          ]),
        };
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
        return { ...answers, integrations: ["integration.none"] };
      }
      return {
        ...answers,
        integrations: chosen.filter((id) => id !== "integration.none"),
      };
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
      return {
        ...answers,
        userGroups: chosen,
        multiTenant:
          chosen.includes("users.tenants") ? true : answers.multiTenant,
      };
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
      return { ...answers, userScale: chosen };
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
        return { ...answers, qualityRequirements: [] };
      }
      return {
        ...answers,
        qualityRequirements: chosen.filter((id) => id !== "quality.none"),
      };
    },
  },
  {
    id: "q.delivery.timing",
    prompt: "Is there a timing target?",
    help: "Dates guide planning. We will not promise an unrealistic deadline against this scope.",
    kind: "single",
    options: [
      { id: "timing.no_deadline", label: "No fixed deadline" },
      { id: "timing.within_3_months", label: "Within three months" },
      { id: "timing.3_to_6_months", label: "Three to six months" },
      { id: "timing.6_to_12_months", label: "Six to twelve months" },
      NOT_SURE,
    ],
    apply(answers, values) {
      const chosen = withoutUnknown(values)[0];
      if (!chosen) return markUnknown(answers, "q.delivery.timing");
      return { ...answers, timing: chosen };
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

export function inferGapQuestionIds(
  answers: ProjectBlueprintAnswers,
  ideaText: string,
): string[] {
  const gaps: string[] = [];
  const text = ideaText.toLowerCase();

  if (!answers.surfaces?.length) gaps.push("q.surfaces.channels");
  if (!answers.startingPoint) gaps.push("q.context.starting_point");

  const hasPayments = (answers.capabilities ?? []).some((id) =>
    id.startsWith("cap.payments."),
  );
  const mentionsPay = /\b(pay|payment|checkout|subscription|billing|invoice)\b/i.test(
    text,
  );
  if (!hasPayments && !mentionsPay && !answers.unknowns?.["q.intake.payments"]) {
    gaps.push("q.intake.payments");
  }

  const integrations = answers.integrations ?? [];
  const hasIntegrationSignal =
    integrations.length > 0 && !integrations.includes("integration.unknown");
  const mentionsIntegrate =
    /\b(integrat|erp|crm|xero|sage|salesforce|api|webhook)\b/i.test(text);
  if (!hasIntegrationSignal && mentionsIntegrate) {
    gaps.push("q.integrations.systems");
  }

  if (!answers.userGroups?.length) gaps.push("q.users.groups");

  const hasQuality = (answers.qualityRequirements ?? []).length > 0;
  const mentionsSensitive =
    /\b(popia|gdpr|personal data|financ|regulated|compliance|pci)\b/i.test(text);
  if (!hasQuality && mentionsSensitive) gaps.push("q.quality.requirements");

  return gaps;
}

export function selectClarifyingQuestions(args: {
  requestedIds?: string[];
  answers: ProjectBlueprintAnswers;
  ideaText: string;
  round: number;
  forceReady?: boolean;
}): IntakeClarifyingQuestion[] {
  if (args.forceReady || args.round >= 2) return [];

  const picked: string[] = [];
  for (const id of args.requestedIds ?? []) {
    if (!WHITELIST_BY_ID.has(id) || picked.includes(id)) continue;
    picked.push(id);
    if (picked.length >= 3) break;
  }

  if (picked.length < 3) {
    for (const id of inferGapQuestionIds(args.answers, args.ideaText)) {
      if (picked.includes(id)) continue;
      picked.push(id);
      if (picked.length >= 3) break;
    }
  }

  return picked
    .map((id) => WHITELIST_BY_ID.get(id))
    .filter((question): question is IntakeWhitelistQuestion => Boolean(question))
    .map(toPublicQuestion);
}
