/**
 * Tidy messy OpenAI intake JSON into the shape Zod already expects.
 * Does not invent prices — only normalises types and lengths.
 */

const UNKNOWN_CHOICES = new Set([
  "not_sure",
  "help_me_choose",
  "need_advice",
  "unknown",
]);

type UnknownChoice = "not_sure" | "help_me_choose" | "need_advice" | "unknown";

const SCALAR_ANSWER_KEYS = [
  "route",
  "startingPoint",
  "primaryOutcome",
  "userScale",
  "roleCountBand",
  "migrationProfile",
  "productLevel",
  "timing",
] as const;

const LIST_ANSWER_CAPS: Record<string, number> = {
  surfaces: 8,
  userGroups: 8,
  capabilities: 20,
  integrations: 12,
  qualityRequirements: 12,
  existingAssets: 10,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function truncate(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trim();
}

function itemLabel(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (isPlainObject(value)) {
    if (typeof value.label === "string") return value.label;
    if (typeof value.id === "string") return value.id;
    if (typeof value.text === "string") return value.text;
  }
  return "";
}

/** Turn a string or mixed array into a capped list of trimmed strings. */
export function toStringList(
  value: unknown,
  itemMax: number,
  listMax: number,
): string[] {
  if (value == null || value === "") return [];

  let parts: string[] = [];
  if (Array.isArray(value)) {
    parts = value.map(itemLabel);
  } else if (typeof value === "string") {
    parts = value.split(/[\n;]+|,\s*/);
  } else {
    const label = itemLabel(value);
    parts = label ? [label] : [];
  }

  const unique: string[] = [];
  for (const part of parts) {
    const item = truncate(part, itemMax);
    if (!item) continue;
    if (unique.includes(item)) continue;
    unique.push(item);
    if (unique.length >= listMax) break;
  }
  return unique;
}

export function coerceIntakeStatus(
  value: unknown,
): "needs_clarification" | "ready" | "website_handoff" {
  const raw = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  if (
    raw === "ready" ||
    raw === "complete" ||
    raw === "done" ||
    raw === "ok"
  ) {
    return "ready";
  }
  if (
    raw === "website_handoff" ||
    raw === "website" ||
    raw.includes("website_package") ||
    raw.includes("brochure")
  ) {
    return "website_handoff";
  }
  return "needs_clarification";
}

export function coerceUnknowns(
  value: unknown,
): Record<string, UnknownChoice> {
  if (value == null) return {};

  if (Array.isArray(value)) {
    const next: Record<string, UnknownChoice> = {};
    for (const item of value) {
      if (typeof item === "string" && item.trim()) {
        next[item.trim()] = "not_sure";
        continue;
      }
      if (isPlainObject(item) && typeof item.id === "string" && item.id.trim()) {
        const choice = String(item.value ?? item.choice ?? "not_sure");
        next[item.id.trim()] = UNKNOWN_CHOICES.has(choice)
          ? (choice as UnknownChoice)
          : "not_sure";
      }
    }
    return next;
  }

  if (!isPlainObject(value)) return {};

  const next: Record<string, UnknownChoice> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!key.trim()) continue;
    const choice = String(raw ?? "not_sure");
    next[key] = UNKNOWN_CHOICES.has(choice)
      ? (choice as UnknownChoice)
      : "not_sure";
  }
  return next;
}

function coerceConcept(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const summary = truncate(value, 1600);
    if (!summary) return null;
    return {
      headline: truncate(value, 180) || "A custom software product",
      summary,
      whoItsFor: "The people described in the idea.",
      coreCapabilities: [],
      assumptions: [],
    };
  }

  if (!isPlainObject(value)) return null;

  const headline =
    truncate(
      String(value.headline ?? value.title ?? "A custom software product"),
      180,
    ) || "A custom software product";
  const summary =
    truncate(
      String(
        value.summary ??
          value.description ??
          value.headline ??
          "A custom software product described by the prospect.",
      ),
      1600,
    ) || "A custom software product described by the prospect.";
  const whoItsFor =
    truncate(
      String(
        value.whoItsFor ??
          value.audience ??
          value.users ??
          "The people described in the idea.",
      ),
      500,
    ) || "The people described in the idea.";

  return {
    headline,
    summary,
    whoItsFor,
    coreCapabilities: toStringList(
      value.coreCapabilities ?? value.capabilities,
      160,
      12,
    ),
    assumptions: toStringList(value.assumptions, 280, 10),
  };
}

function coerceBoolish(value: unknown): boolean | UnknownChoice | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (v === "true" || v === "yes") return true;
    if (v === "false" || v === "no") return false;
    if (UNKNOWN_CHOICES.has(v)) return v as UnknownChoice;
  }
  return undefined;
}

function coerceAnswers(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) return {};

  const next: Record<string, unknown> = {};

  for (const key of SCALAR_ANSWER_KEYS) {
    if (value[key] == null || value[key] === "") continue;
    const text = String(value[key]).trim();
    if (text) next[key] = text;
  }

  for (const [key, cap] of Object.entries(LIST_ANSWER_CAPS)) {
    if (value[key] == null) continue;
    const list = toStringList(value[key], 120, cap);
    if (list.length) next[key] = list;
  }

  if (value.unknowns != null) {
    next.unknowns = coerceUnknowns(value.unknowns);
  }

  const multiTenant = coerceBoolish(value.multiTenant);
  if (multiTenant !== undefined) next.multiTenant = multiTenant;

  const roleBasedPermissions = coerceBoolish(value.roleBasedPermissions);
  if (roleBasedPermissions !== undefined) {
    next.roleBasedPermissions = roleBasedPermissions;
  }

  return next;
}

const DEFAULT_CONCEPT = {
  headline: "A custom software product",
  summary: "The idea was classified with limited structured detail.",
  whoItsFor: "The people described in the idea.",
  coreCapabilities: [] as string[],
  assumptions: [] as string[],
};

/**
 * Returns a Zod-ready object, or null when the model output is not a JSON object.
 */
export function coerceIntakePayload(
  value: unknown,
): Record<string, unknown> | null {
  if (!isPlainObject(value)) return null;

  const concept = coerceConcept(value.concept);
  const answers = coerceAnswers(value.answers);
  const hasAnswers = Object.keys(answers).length > 0;

  if (!concept && !hasAnswers) return null;

  return {
    status: coerceIntakeStatus(value.status),
    concept: concept ?? DEFAULT_CONCEPT,
    answers,
    clarifyingQuestionIds: toStringList(
      value.clarifyingQuestionIds ?? value.questionsRequiringConfirmation,
      80,
      3,
    ),
  };
}
