/**
 * Project Blueprint estimation engine — server barrel.
 * Exports calculateEstimate, placeholder config accessors, and public types.
 * Rate cards and margins must never be re-exported from the client-safe package barrel.
 */

export { calculateEstimate, toEngineAnswers } from "./calculate";
export {
  getPlaceholderConfig,
  PLACEHOLDER_PRICING_CONFIG,
} from "./config/placeholder";

export type {
  ConfidenceLevel,
  CostDriver,
  EngineAnswers,
  InternalEstimate,
  MoneyRange,
  PhaseBreakdownItem,
  PricingConfig,
  PublicConfidence,
  PublicEstimateResult,
  PublicScenario,
  ScenarioId,
  ThreePoint,
  TimelineRange,
} from "./types";
