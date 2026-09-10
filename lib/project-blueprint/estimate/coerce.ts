/**
 * Tidy messy estimator JSON into the Zod shape.
 */

import { estimateModelPayloadSchema, type EstimateModelPayload } from "./schema";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function truncate(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trim();
}

function parseMoney(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[R$,\s]/gi, "").replace(/zar/gi, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n);
}

function parseWeeks(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const n = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function asMoneyRange(value: unknown): Record<string, unknown> | undefined {
  if (!isPlainObject(value)) return undefined;
  const low = parseMoney(value.low ?? value.min);
  const likely = parseMoney(value.likely ?? value.expected ?? value.mid);
  const high = parseMoney(value.high ?? value.max);
  if (low == null || likely == null || high == null) return undefined;
  return { low, likely, high };
}

function asTimeline(value: unknown): Record<string, unknown> | undefined {
  if (!isPlainObject(value)) return undefined;
  const minimumWeeks = parseWeeks(value.minimumWeeks ?? value.minWeeks ?? value.min);
  const likelyWeeks = parseWeeks(value.likelyWeeks ?? value.likely ?? value.expected);
  const maximumWeeks = parseWeeks(value.maximumWeeks ?? value.maxWeeks ?? value.max);
  if (minimumWeeks == null || likelyWeeks == null) return undefined;
  return {
    minimumWeeks,
    likelyWeeks,
    ...(maximumWeeks != null ? { maximumWeeks } : {}),
  };
}

function asStringList(value: unknown, itemMax: number, listMax: number): string[] {
  const parts = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n;]+/)
      : [];
  const unique: string[] = [];
  for (const part of parts) {
    const text =
      typeof part === "string"
        ? part
        : isPlainObject(part)
          ? String(part.text ?? part.title ?? part.label ?? "")
          : "";
    const item = truncate(text, itemMax);
    if (!item || unique.includes(item)) continue;
    unique.push(item);
    if (unique.length >= listMax) break;
  }
  return unique;
}

function coerceKind(value: unknown): EstimateModelPayload["kind"] | undefined {
  const raw = String(value ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (raw.includes("website") || raw.includes("brochure")) return "website_handoff";
  if (raw.includes("discovery")) return "discovery_first";
  if (raw.includes("custom") || raw === "build" || raw === "custom_build") {
    return "custom_build";
  }
  return undefined;
}

function coerceConfidenceLevel(value: unknown): "high" | "moderate" | "early" {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "high") return "high";
  if (raw === "moderate" || raw === "medium") return "moderate";
  return "early";
}

export function coerceEstimatePayload(value: unknown): unknown | null {
  if (!isPlainObject(value)) return null;

  const range = asMoneyRange(value.range ?? value.investment ?? value.cost);
  const timeline = asTimeline(value.timeline ?? value.delivery);
  if (!range || !timeline) return null;

  const conceptRaw = isPlainObject(value.concept) ? value.concept : {};
  const confidenceRaw = isPlainObject(value.confidence) ? value.confidence : {};

  const kind =
    coerceKind(value.kind) ??
    (value.discoveryRecommended === true ? "discovery_first" : "custom_build");

  const driversRaw = Array.isArray(value.costDrivers) ? value.costDrivers : [];
  const phasesRaw = Array.isArray(value.phaseBreakdown) ? value.phaseBreakdown : [];
  const alternativesRaw = Array.isArray(value.alternativeScenarios)
    ? value.alternativeScenarios
    : [];

  return {
    kind,
    productSummary: truncate(
      String(value.productSummary ?? conceptRaw.headline ?? "Custom software"),
      240,
    ),
    concept: {
      headline: truncate(String(conceptRaw.headline ?? value.productSummary ?? "Custom software"), 180),
      summary: truncate(String(conceptRaw.summary ?? value.productSummary ?? "Custom software"), 1600),
      whoItsFor: truncate(String(conceptRaw.whoItsFor ?? "The team that will use this product"), 500),
      coreCapabilities: asStringList(conceptRaw.coreCapabilities, 160, 12),
      assumptions: asStringList(conceptRaw.assumptions, 280, 10),
    },
    range,
    timeline,
    confidence: {
      level: coerceConfidenceLevel(confidenceRaw.level),
      explanation: truncate(
        String(confidenceRaw.explanation ?? "Confidence reflects how complete the brief is."),
        800,
      ),
      unknowns: asStringList(confidenceRaw.unknowns, 240, 12),
      improvements: asStringList(confidenceRaw.improvements, 240, 12),
    },
    costDrivers: driversRaw
      .filter(isPlainObject)
      .slice(0, 8)
      .map((driver, index) => ({
        id: truncate(String(driver.id ?? `driver-${index + 1}`), 80),
        title: truncate(String(driver.title ?? driver.label ?? "Cost driver"), 120),
        explanation: truncate(String(driver.explanation ?? driver.detail ?? ""), 400),
      }))
      .filter((driver) => driver.title && driver.explanation),
    exclusions: asStringList(value.exclusions, 240, 12),
    phaseBreakdown: phasesRaw.filter(isPlainObject).slice(0, 8).map((phase, index) => ({
      id: truncate(String(phase.id ?? `phase-${index + 1}`), 80),
      name: truncate(String(phase.name ?? `Phase ${index + 1}`), 120),
      description:
        typeof phase.description === "string"
          ? truncate(phase.description, 280)
          : undefined,
      share:
        typeof phase.share === "number"
          ? phase.share
          : typeof phase.allocation === "number"
            ? phase.allocation
            : undefined,
    })),
    alternativeScenarios: alternativesRaw
      .filter(isPlainObject)
      .slice(0, 3)
      .flatMap((scenario) => {
        const altRange = asMoneyRange(scenario.range);
        if (!altRange) return [];
        return [
          {
            id: truncate(String(scenario.id ?? "alternative"), 40),
            name: truncate(String(scenario.name ?? "Alternative"), 80),
            summary: truncate(String(scenario.summary ?? ""), 280),
            range: altRange,
            timeline: asTimeline(scenario.timeline) ?? timeline,
          },
        ];
      }),
    discoveryRecommended: Boolean(value.discoveryRecommended) || kind === "discovery_first",
    discoverySummary:
      typeof value.discoverySummary === "string"
        ? truncate(value.discoverySummary, 800)
        : undefined,
    discoveryRange: asMoneyRange(value.discoveryRange),
    nextStepRecommendation: truncate(
      String(
        value.nextStepRecommendation ??
          "Talk with a Good Code specialist to refine this into a reviewed quotation.",
      ),
      500,
    ),
  };
}

export function parseEstimatePayload(value: unknown): EstimateModelPayload | null {
  const coerced = coerceEstimatePayload(value);
  if (!coerced) return null;
  const parsed = estimateModelPayloadSchema.safeParse(coerced);
  if (!parsed.success) {
    console.error(
      "AI estimate Zod rejection",
      parsed.error.issues.map((issue) => ({
        path: issue.path.join(".") || "(root)",
        message: issue.message,
      })),
    );
    return null;
  }
  return parsed.data;
}

export function formatEstimateValidationIssues(value: unknown): string {
  const coerced = coerceEstimatePayload(value);
  const parsed = estimateModelPayloadSchema.safeParse(coerced ?? value);
  if (parsed.success) return "Payload did not meet estimator rules.";
  return parsed.error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}
