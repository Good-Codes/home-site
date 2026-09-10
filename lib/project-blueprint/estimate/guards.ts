/**
 * Commercial guards around the model payload. Not a second estimator.
 */

import { roundMoneyRange } from "../round";
import type { MoneyRange, TimelineRange } from "../types";
import {
  CEILING_LIKELY_ZAR,
  MAX_TIMELINE_WEEKS,
  MINIMUM_ENGAGEMENT_ZAR,
  MIN_TIMELINE_WEEKS,
} from "./constants";
import type { EstimateModelPayload } from "./schema";

export type GuardAdjustment = {
  code: string;
  detail: string;
};

const TAXONOMY_ID =
  /\b(?:q|cap|route|surface|start|outcome|users|quality|integration|migration|level|timing|mod|wp|pay|band)\.[a-z0-9_.]+\b/gi;

export function stripTaxonomyIds(text: string): string {
  return text
    .replace(TAXONOMY_ID, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function cleanText(text: string, fallback: string): string {
  const cleaned = stripTaxonomyIds(text);
  return cleaned || fallback;
}

function expectedCost(range: MoneyRange): number {
  return (range.low + 4 * range.likely + range.high) / 6;
}

function scaleRange(range: MoneyRange, factor: number): MoneyRange {
  return {
    low: Math.round(range.low * factor),
    likely: Math.round(range.likely * factor),
    high: Math.round(range.high * factor),
  };
}

function orderRange(range: MoneyRange): MoneyRange {
  const values = [range.low, range.likely, range.high]
    .map((value) => Math.max(0, Math.round(value)))
    .sort((a, b) => a - b);
  return { low: values[0]!, likely: values[1]!, high: values[2]! };
}

function clampWeeks(value: number): number {
  const rounded = Math.max(MIN_TIMELINE_WEEKS, Math.round(value));
  return Math.min(MAX_TIMELINE_WEEKS, rounded);
}

function orderTimeline(timeline: TimelineRange): TimelineRange {
  const min = clampWeeks(timeline.minimumWeeks);
  const likely = clampWeeks(timeline.likelyWeeks);
  const max = clampWeeks(timeline.maximumWeeks ?? likely);
  const values = [min, likely, max].sort((a, b) => a - b);
  return {
    minimumWeeks: values[0]!,
    likelyWeeks: values[1]!,
    maximumWeeks: values[2],
  };
}

function isPercentageHaircut(alt: MoneyRange, rec: MoneyRange): boolean {
  if (rec.likely <= 0 || rec.low <= 0 || rec.high <= 0) return true;
  const ratios = [alt.low / rec.low, alt.likely / rec.likely, alt.high / rec.high];
  const mean = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
  const spread = Math.max(...ratios) - Math.min(...ratios);
  if (mean > 0.92 && mean < 1.08) return true;
  return spread < 0.08 && (mean < 0.9 || mean > 1.1);
}

function bandRatio(range: MoneyRange): number {
  if (range.low <= 0) return 99;
  return range.high / range.low;
}

export type GuardedEstimate = {
  payload: EstimateModelPayload;
  range: MoneyRange;
  timeline: TimelineRange;
  adjustments: GuardAdjustment[];
  withheldHeadline: boolean;
};

export function applyEstimateGuards(payload: EstimateModelPayload): GuardedEstimate {
  const adjustments: GuardAdjustment[] = [];
  let kind = payload.kind;
  let withheldHeadline = false;

  let range = orderRange({
    low: payload.range.low,
    likely: payload.range.likely,
    high: payload.range.high,
  });
  if (
    payload.range.low > payload.range.likely ||
    payload.range.likely > payload.range.high
  ) {
    adjustments.push({
      code: "range_reordered",
      detail: "Reordered low / likely / high so the band is increasing.",
    });
  }

  const timeline = orderTimeline(payload.timeline);

  if (kind === "custom_build" && expectedCost(range) < MINIMUM_ENGAGEMENT_ZAR) {
    const lift = MINIMUM_ENGAGEMENT_ZAR / Math.max(expectedCost(range), 1);
    range = scaleRange(range, lift);
    adjustments.push({
      code: "floor",
      detail: `Lifted custom-build band to the R${MINIMUM_ENGAGEMENT_ZAR.toLocaleString("en-ZA")} commercial floor.`,
    });
  }

  if (range.likely > CEILING_LIKELY_ZAR) {
    withheldHeadline = true;
    kind = "discovery_first";
    range = orderRange({
      low: Math.min(range.low, 2_000_000),
      likely: CEILING_LIKELY_ZAR,
      high: CEILING_LIKELY_ZAR,
    });
    adjustments.push({
      code: "ceiling",
      detail:
        "Likely exceeded the planning ceiling; capped the public band and recommended a conversation.",
    });
  }

  if (payload.confidence.level === "early" && bandRatio(range) < 2) {
    range = {
      low: Math.round(range.low * 0.75),
      likely: range.likely,
      high: Math.round(range.high * 1.5),
    };
    range = orderRange(range);
    adjustments.push({
      code: "widen_early",
      detail: "Widened an early-confidence band that was too tight.",
    });
  }

  range = roundMoneyRange(range);
  if (payload.discoveryRange) {
    payload.discoveryRange = roundMoneyRange(orderRange(payload.discoveryRange));
  }

  const alternatives = (payload.alternativeScenarios ?? []).filter((scenario) => {
    const alt = orderRange(scenario.range);
    if (isPercentageHaircut(alt, range)) {
      adjustments.push({
        code: "drop_haircut_scenario",
        detail: `Dropped “${scenario.name}” because it was a percentage of the same scope.`,
      });
      return false;
    }
    return true;
  });

  const cleaned: EstimateModelPayload = {
    ...payload,
    kind,
    discoveryRecommended:
      payload.discoveryRecommended || kind === "discovery_first" || withheldHeadline,
    productSummary: cleanText(payload.productSummary, "Custom software"),
    nextStepRecommendation: cleanText(
      payload.nextStepRecommendation,
      "Talk with a Good Code specialist to refine this into a reviewed quotation.",
    ),
    discoverySummary: payload.discoverySummary
      ? cleanText(payload.discoverySummary, payload.discoverySummary)
      : payload.discoverySummary,
    concept: payload.concept
      ? {
          headline: cleanText(payload.concept.headline, "Custom software"),
          summary: cleanText(payload.concept.summary, payload.productSummary),
          whoItsFor: cleanText(payload.concept.whoItsFor, "The team that will use this product"),
          coreCapabilities: payload.concept.coreCapabilities.map((item) =>
            cleanText(item, item),
          ),
          assumptions: payload.concept.assumptions.map((item) => cleanText(item, item)),
        }
      : payload.concept,
    confidence: {
      ...payload.confidence,
      explanation: cleanText(
        payload.confidence.explanation,
        "Confidence reflects how complete the brief is.",
      ),
      unknowns: payload.confidence.unknowns.map((item) => cleanText(item, item)),
      improvements: payload.confidence.improvements.map((item) => cleanText(item, item)),
    },
    costDrivers: payload.costDrivers.map((driver, index) => ({
      ...driver,
      id: driver.id ?? `driver-${index + 1}`,
      title: cleanText(driver.title, "Cost driver"),
      explanation: cleanText(driver.explanation, "This affects the planning range."),
    })),
    exclusions: payload.exclusions.map((item) => cleanText(item, item)),
    alternativeScenarios: alternatives.map((scenario) => ({
      ...scenario,
      name: cleanText(scenario.name, "Alternative"),
      summary: cleanText(scenario.summary, scenario.summary),
      range: roundMoneyRange(orderRange(scenario.range)),
      timeline: scenario.timeline ? orderTimeline(scenario.timeline) : timeline,
    })),
    range,
    timeline,
  };

  return { payload: cleaned, range, timeline, adjustments, withheldHeadline };
}

export function validPhaseBreakdown(
  phases: EstimateModelPayload["phaseBreakdown"],
): NonNullable<EstimateModelPayload["phaseBreakdown"]> {
  const list = (phases ?? []).filter(
    (phase) => typeof phase.share === "number" && phase.share > 0,
  );
  if (!list.length) return [];
  const sum = list.reduce((total, phase) => total + (phase.share ?? 0), 0);
  if (sum < 0.85 || sum > 1.15) return [];
  return list;
}
