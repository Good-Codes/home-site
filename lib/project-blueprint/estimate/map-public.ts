import { formatZarRange } from "../format";
import type {
  IntakeConcept,
  PhaseBreakdownItem,
  PublicEstimateResult,
  PublicScenarioResult,
} from "../types";
import { PROMPT_VERSION, USING_SEEDED_EXAMPLES } from "./constants";
import { validPhaseBreakdown, type GuardedEstimate } from "./guards";

function scenario(
  id: PublicScenarioResult["id"],
  name: string,
  summary: string,
  range: GuardedEstimate["range"],
  timeline: GuardedEstimate["timeline"],
): PublicScenarioResult {
  return {
    id,
    name,
    summary,
    includedCapabilityIds: [],
    range,
    timeline,
  };
}

export function mapEstimateToPublicResult(input: {
  guarded: GuardedEstimate;
  estimateId: string;
  generatedAt: string;
  confirmedConcept: IntakeConcept | null;
}): PublicEstimateResult {
  const { payload, range, timeline, withheldHeadline } = input.guarded;
  const concept = payload.concept ?? input.confirmedConcept ?? undefined;

  const recommended = scenario(
    "recommended",
    "Recommended",
    payload.productSummary,
    range,
    timeline,
  );

  const alternativeScenarios: PublicScenarioResult[] = (payload.alternativeScenarios ?? [])
    .map((item) => {
      const id =
        item.id === "lean" || item.id === "scale" || item.id === "recommended"
          ? item.id
          : "scale";
      return scenario(
        id,
        item.name,
        item.summary,
        item.range,
        item.timeline ?? timeline,
      );
    })
    .filter((item) => item.id !== "recommended");

  const phases = validPhaseBreakdown(payload.phaseBreakdown);
  const phaseBreakdown: PhaseBreakdownItem[] = phases.map((phase, index) => ({
    id: phase.id ?? `phase-${index + 1}`,
    name: phase.name,
    description: phase.description,
    allocation: { share: phase.share ?? 0 },
  }));

  const nextStep = withheldHeadline
    ? "This brief is larger than a self-serve planning band. Talk to the Good Code team before treating any figure as a plan."
    : payload.nextStepRecommendation;

  return {
    estimateId: input.estimateId,
    pricingVersion: PROMPT_VERSION,
    currency: "ZAR",
    generatedAt: input.generatedAt,
    productSummary: payload.productSummary,
    recommendedScenario: recommended,
    alternativeScenarios,
    phaseBreakdown,
    costDrivers: payload.costDrivers.map((driver, index) => ({
      id: driver.id ?? `driver-${index + 1}`,
      title: driver.title,
      explanation: driver.explanation,
    })),
    confidence: payload.confidence,
    assumptions: (concept?.assumptions ?? []).map((text, index) => ({
      id: `assumption-${index + 1}`,
      text,
      source: "model" as const,
    })),
    exclusions:
      payload.exclusions.length > 0
        ? payload.exclusions
        : [
            "Software licences and cloud usage",
            "App-store fees",
            "Legal advice",
            "Ongoing care or hosting retainers",
          ],
    discoveryRecommended: payload.discoveryRecommended || withheldHeadline,
    discoverySummary: payload.discoverySummary,
    nextStepRecommendation: nextStep,
    usingPlaceholderConfiguration: USING_SEEDED_EXAMPLES,
    ...(concept
      ? {
          concept,
        }
      : {}),
    ...(payload.discoveryRecommended || withheldHeadline
      ? {
          discoveryFirst: {
            recommended: true,
            summary: payload.discoverySummary,
            discoveryRangeDisplay: payload.discoveryRange
              ? formatZarRange(payload.discoveryRange)
              : undefined,
          },
        }
      : {}),
  } as PublicEstimateResult;
}
