import { describe, expect, it } from "vitest";

import { applyEstimateGuards, stripTaxonomyIds } from "@/lib/project-blueprint/estimate/guards";
import { parseEstimatePayload } from "@/lib/project-blueprint/estimate/coerce";
import {
  buildEstimateSystemPrompt,
  buildEstimateUserPrompt,
} from "@/lib/project-blueprint/estimate/prompt";
import { runAiEstimate } from "@/lib/project-blueprint/estimate/run";
import { buildScopeSnapshot } from "@/lib/project-blueprint/estimate/scope";
import { CEILING_LIKELY_ZAR, MINIMUM_ENGAGEMENT_ZAR, PROMPT_VERSION } from "@/lib/project-blueprint/estimate/constants";
import {
  FIXTURE_BRIEFS,
  PORTAL_VS_INTERNAL_MIN_RATIO,
} from "./fixtures/briefs";
import type { EstimateModelPayload } from "@/lib/project-blueprint/estimate/schema";

function basePayload(
  overrides: Partial<EstimateModelPayload> &
    Pick<EstimateModelPayload, "productSummary" | "range">,
): EstimateModelPayload {
  return {
    kind: "custom_build",
    timeline: { minimumWeeks: 8, likelyWeeks: 12, maximumWeeks: 16 },
    confidence: {
      level: "moderate",
      explanation: "The brief is clear enough for a planning band.",
      unknowns: [],
      improvements: [],
    },
    costDrivers: [
      {
        id: "driver-1",
        title: "Core product build",
        explanation: "Design, engineering, and QA for the first release.",
      },
    ],
    exclusions: ["Cloud usage", "Software licences"],
    phaseBreakdown: [],
    alternativeScenarios: [],
    discoveryRecommended: false,
    nextStepRecommendation:
      "Talk with a Good Code specialist to refine this into a reviewed quotation.",
    ...overrides,
  };
}

/** CI contract payloads the live eval must also satisfy. */
const MOCK_BY_BRIEF: Record<string, EstimateModelPayload> = {
  internalStaffJobTool: basePayload({
    productSummary: "Internal staff job board",
    concept: FIXTURE_BRIEFS.internalStaffJobTool.concept,
    range: { low: 160_000, likely: 250_000, high: 380_000 },
  }),
  dealershipFinancePortal: basePayload({
    productSummary: "Dealership finance portal with monthly payments",
    concept: FIXTURE_BRIEFS.dealershipFinancePortal.concept,
    range: { low: 550_000, likely: 850_000, high: 1_300_000 },
    timeline: { minimumWeeks: 16, likelyWeeks: 22, maximumWeeks: 28 },
    costDrivers: [
      {
        id: "payments",
        title: "Recurring payments and a payment gateway",
        explanation: "Monthly collections, reconciliation, and financial data raise the band.",
      },
    ],
  }),
  nativeFieldApp: basePayload({
    productSummary: "Native iOS and Android field app, no public web",
    concept: FIXTURE_BRIEFS.nativeFieldApp.concept,
    range: { low: 650_000, likely: 950_000, high: 1_600_000 },
    timeline: { minimumWeeks: 18, likelyWeeks: 24, maximumWeeks: 32 },
    costDrivers: [
      {
        id: "stores",
        title: "App Store and Play Store delivery",
        explanation: "Two native apps and store submission dominate this first release.",
      },
    ],
  }),
  vagueApp: basePayload({
    kind: "discovery_first",
    productSummary: "A custom app still being defined",
    concept: FIXTURE_BRIEFS.vagueApp.concept,
    range: { low: 200_000, likely: 700_000, high: 1_500_000 },
    confidence: {
      level: "early",
      explanation: "The brief is too thin for a tight number.",
      unknowns: ["Who will use it", "Web versus native"],
      improvements: ["Describe the first-release workflows"],
    },
    discoveryRecommended: true,
    discoverySummary: "A short discovery would replace guesses with a first-release plan.",
    nextStepRecommendation: "Start with discovery rather than a fixed build quote.",
  }),
};

function publicStrings(value: unknown): string[] {
  const texts: string[] = [];
  const walk = (node: unknown) => {
    if (typeof node === "string") {
      texts.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object") {
      Object.values(node).forEach(walk);
    }
  };
  walk(value);
  return texts;
}

describe("estimator prompt pack", () => {
  it("includes seed examples, ZAR rules, and budget isolation", () => {
    const prompt = buildEstimateSystemPrompt();
    expect(prompt).toContain("ZAR");
    expect(prompt).toMatch(/SEED EXAMPLES/i);
    expect(prompt).toContain("Internal staff job");
    expect(prompt).toContain("Dealership finance portal");
    expect(prompt).toContain("website_handoff");
    expect(prompt).toMatch(/ignore it when choosing the number/i);
    expect(prompt).not.toMatch(/R2,?850/);
  });

  it("never puts budget fields in the user prompt", () => {
    const brief = FIXTURE_BRIEFS.dealershipFinancePortal;
    const user = buildEstimateUserPrompt({
      ideaText: brief.ideaText,
      concept: brief.concept,
      scope: buildScopeSnapshot({
        ...brief.answers,
        budgetBand: "band.under_500k",
        budgetNotes: "Please keep this under R400k",
      }),
      promptVersion: PROMPT_VERSION,
    });
    expect(user).not.toContain("budgetBand");
    expect(user).not.toContain("budgetNotes");
    expect(user).not.toContain("band.under_500k");
  });
});

describe("guards", () => {
  it("reorders and floors a too-small custom-build band", () => {
    const parsed = parseEstimatePayload(
      basePayload({
        productSummary: "Tiny build",
        range: { low: 40_000, likely: 20_000, high: 30_000 },
      }),
    );
    expect(parsed).not.toBeNull();
    const guarded = applyEstimateGuards(parsed!);
    expect(guarded.range.low).toBeLessThanOrEqual(guarded.range.likely);
    expect(guarded.range.likely).toBeLessThanOrEqual(guarded.range.high);
    expect(guarded.range.likely).toBeGreaterThanOrEqual(MINIMUM_ENGAGEMENT_ZAR);
    expect(guarded.adjustments.some((item) => item.code === "floor")).toBe(true);
  });

  it("caps a fantasy ceiling", () => {
    const parsed = parseEstimatePayload(
      basePayload({
        productSummary: "Unbounded platform",
        range: { low: 9_000_000, likely: 20_000_000, high: 40_000_000 },
      }),
    );
    expect(parsed).not.toBeNull();
    const guarded = applyEstimateGuards(parsed!);
    expect(guarded.range.likely).toBeLessThanOrEqual(CEILING_LIKELY_ZAR);
    expect(guarded.payload.discoveryRecommended).toBe(true);
  });

  it("strips catalogue IDs from customer copy", () => {
    expect(stripTaxonomyIds("Need cap.payments.recurring and q.surfaces.channels")).not.toMatch(
      /q\.|cap\./,
    );
  });
});

describe("runAiEstimate (mocked model)", () => {
  async function runBrief(id: keyof typeof FIXTURE_BRIEFS) {
    const brief = FIXTURE_BRIEFS[id];
    return runAiEstimate(
      { answers: brief.answers, concept: brief.concept },
      {
        completeJson: async () => MOCK_BY_BRIEF[id],
        model: "gpt-4o",
      },
    );
  }

  it("prices the portal materially higher than the internal tool", async () => {
    const internal = await runBrief("internalStaffJobTool");
    const portal = await runBrief("dealershipFinancePortal");
    expect(internal.ok).toBe(true);
    expect(portal.ok).toBe(true);
    if (!internal.ok || !portal.ok) return;
    expect(portal.publicResult.recommendedScenario.range.likely).toBeGreaterThanOrEqual(
      internal.publicResult.recommendedScenario.range.likely * PORTAL_VS_INTERNAL_MIN_RATIO,
    );
    expect(portal.publicResult.currency).toBe("ZAR");
  });

  it("keeps native mobile in scope for the field app", async () => {
    const result = await runBrief("nativeFieldApp");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const blob = [
      result.publicResult.productSummary,
      ...result.publicResult.costDrivers.map((driver) => `${driver.title} ${driver.explanation}`),
    ].join(" ");
    expect(blob).toMatch(/iOS|Android|native|App Store|Play Store/i);
    expect(blob).not.toMatch(/brochure|marketing website/i);
  });

  it("does not invent a custom ZAR build for a brochure website", async () => {
    const brief = FIXTURE_BRIEFS.brochureWebsite;
    let called = 0;
    const result = await runAiEstimate(
      { answers: brief.answers, concept: brief.concept },
      {
        completeJson: async () => {
          called += 1;
          return MOCK_BY_BRIEF.internalStaffJobTool;
        },
      },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("website_handoff");
    expect(called).toBe(0);
  });

  it("treats a one-sentence app brief as discovery or a wide early band", async () => {
    const result = await runBrief("vagueApp");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const range = result.publicResult.recommendedScenario.range;
    const wide = range.high / Math.max(range.low, 1) >= 2;
    expect(
      result.publicResult.discoveryRecommended ||
        result.publicResult.confidence.level === "early" ||
        wide,
    ).toBe(true);
  });

  it("never leaks raw q.* IDs in customer copy", async () => {
    const result = await runBrief("dealershipFinancePortal");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const text of publicStrings(result.publicResult)) {
      expect(text).not.toMatch(/\bq\./);
      expect(text).not.toMatch(/\bcap\./);
      expect(text).not.toMatch(/\broute\./);
    }
  });

  it("retries once when the first payload fails schema", async () => {
    const brief = FIXTURE_BRIEFS.internalStaffJobTool;
    let calls = 0;
    const result = await runAiEstimate(
      { answers: brief.answers, concept: brief.concept },
      {
        completeJson: async () => {
          calls += 1;
          if (calls === 1) return { nope: true };
          return MOCK_BY_BRIEF.internalStaffJobTool;
        },
      },
    );
    expect(calls).toBe(2);
    expect(result.ok).toBe(true);
  });

  it("fails honestly when the model is unavailable", async () => {
    const brief = FIXTURE_BRIEFS.internalStaffJobTool;
    const result = await runAiEstimate(
      { answers: brief.answers, concept: brief.concept },
      { estimateEnabled: false },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("unavailable");
  });
});
