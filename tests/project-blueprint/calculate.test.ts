import { describe, expect, it } from "vitest";

import { checksum } from "@/lib/project-blueprint/engine/checksum";
import {
  calculateEstimate,
  toEngineAnswers,
} from "@/lib/project-blueprint/engine/calculate";
import { PLACEHOLDER_PRICING_CONFIG } from "@/lib/project-blueprint/engine/config/placeholder";
import { evaluateDiscovery } from "@/lib/project-blueprint/engine/discovery";
import { resolveSelection } from "@/lib/project-blueprint/engine/resolve";
import type { ProjectBlueprintAnswers } from "@/lib/project-blueprint/types";

function sampleAnswers(
  overrides: Partial<ProjectBlueprintAnswers> = {},
): ProjectBlueprintAnswers {
  return {
    route: "route.custom_web_platform",
    startingPoint: "start.new_idea",
    primaryOutcome: "outcome.revenue_product",
    surfaces: ["surface.public_web"],
    userGroups: ["users.customers"],
    capabilities: ["cap.access.registration_login"],
    integrations: ["integration.none"],
    qualityRequirements: [],
    ...overrides,
  };
}

describe("checksum identity", () => {
  it("ignores budgetBand so commercial fit does not change math identity", () => {
    const base = toEngineAnswers(sampleAnswers({ budgetBand: "band.under_500k" }));
    const other = toEngineAnswers(sampleAnswers({ budgetBand: "band.over_2m" }));
    expect(checksum(base)).toBe(checksum(other));

    const withBudgetKey = checksum({
      route: "route.custom_web_platform",
      budgetBand: "band.under_500k",
      capabilities: ["cap.access.registration_login"],
    });
    const withoutBudgetKey = checksum({
      route: "route.custom_web_platform",
      capabilities: ["cap.access.registration_login"],
    });
    expect(withBudgetKey).toBe(withoutBudgetKey);
  });
});

describe("calculateEstimate determinism", () => {
  it("returns the same checksum and ranges for identical answers", () => {
    const answers = sampleAnswers();
    const a = calculateEstimate(answers, PLACEHOLDER_PRICING_CONFIG);
    const b = calculateEstimate(answers, PLACEHOLDER_PRICING_CONFIG);

    expect(a.publicResult.estimateId).toBe(b.publicResult.estimateId);
    expect(a.privateTrace.combinedChecksum).toBe(b.privateTrace.combinedChecksum);
    expect(a.publicResult.recommendedScenario.range).toEqual(
      b.publicResult.recommendedScenario.range,
    );
  });

  it("does not change ranges when only budgetBand changes", () => {
    const lowBudget = calculateEstimate(
      sampleAnswers({ budgetBand: "band.under_500k" }),
      PLACEHOLDER_PRICING_CONFIG,
    );
    const highBudget = calculateEstimate(
      sampleAnswers({ budgetBand: "band.over_2m" }),
      PLACEHOLDER_PRICING_CONFIG,
    );

    expect(lowBudget.publicResult.estimateId).toBe(
      highBudget.publicResult.estimateId,
    );
    expect(lowBudget.publicResult.recommendedScenario.range).toEqual(
      highBudget.publicResult.recommendedScenario.range,
    );
  });
});

describe("discovery triggers", () => {
  it("recommends discovery when many unknowns are present", () => {
    const answers = toEngineAnswers(
      sampleAnswers({
        unknowns: {
          "q.users.scale": "not_sure",
          "q.integrations.systems": "need_advice",
          "q.context.starting_point": "help_me_choose",
          "q.delivery.timing": "not_sure",
        },
        startingPoint: "start.needs_discovery",
      }),
    );
    const resolved = resolveSelection(answers, PLACEHOLDER_PRICING_CONFIG);
    const discovery = evaluateDiscovery(
      answers,
      PLACEHOLDER_PRICING_CONFIG,
      resolved,
    );
    expect(discovery.recommended).toBe(true);

    const estimate = calculateEstimate(
      sampleAnswers({
        unknowns: {
          "q.users.scale": "not_sure",
          "q.integrations.systems": "need_advice",
          "q.context.starting_point": "help_me_choose",
          "q.delivery.timing": "not_sure",
        },
        startingPoint: "start.needs_discovery",
      }),
      PLACEHOLDER_PRICING_CONFIG,
    );
    expect(estimate.publicResult.discoveryFirst?.recommended).toBe(true);
  });

  it("recommends discovery for legacy replacement with undocumented integrations", () => {
    const answers = toEngineAnswers(
      sampleAnswers({
        startingPoint: "start.legacy_replacement",
        integrations: ["integration.erp"],
        existingProductFollowUps: { documentationQuality: "poor" },
      }),
    );
    const resolved = resolveSelection(answers, PLACEHOLDER_PRICING_CONFIG);
    const discovery = evaluateDiscovery(
      answers,
      PLACEHOLDER_PRICING_CONFIG,
      resolved,
    );
    expect(discovery.recommended).toBe(true);
  });
});
