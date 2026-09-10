import { describe, expect, it } from "vitest";

import { runAiEstimate } from "@/lib/project-blueprint/estimate/run";
import {
  FIXTURE_BRIEFS,
  PORTAL_VS_INTERNAL_MIN_RATIO,
} from "./fixtures/briefs";

const live = Boolean(
  process.env.PROJECT_BLUEPRINT_AI_EVAL === "1" && process.env.OPENAI_API_KEY,
);

describe.skipIf(!live)("live AI estimate eval", () => {
  it(
    "prices named fixture briefs with the real estimator",
    async () => {
      const internal = await runAiEstimate({
        answers: FIXTURE_BRIEFS.internalStaffJobTool.answers,
        concept: FIXTURE_BRIEFS.internalStaffJobTool.concept,
      });
      const portal = await runAiEstimate({
        answers: FIXTURE_BRIEFS.dealershipFinancePortal.answers,
        concept: FIXTURE_BRIEFS.dealershipFinancePortal.concept,
      });
      const native = await runAiEstimate({
        answers: FIXTURE_BRIEFS.nativeFieldApp.answers,
        concept: FIXTURE_BRIEFS.nativeFieldApp.concept,
      });
      const website = await runAiEstimate({
        answers: FIXTURE_BRIEFS.brochureWebsite.answers,
        concept: FIXTURE_BRIEFS.brochureWebsite.concept,
      });
      const vague = await runAiEstimate({
        answers: FIXTURE_BRIEFS.vagueApp.answers,
        concept: FIXTURE_BRIEFS.vagueApp.concept,
      });

      expect(website.ok).toBe(false);
      if (!website.ok) expect(website.code).toBe("website_handoff");

      expect(internal.ok).toBe(true);
      expect(portal.ok).toBe(true);
      expect(native.ok).toBe(true);
      expect(vague.ok).toBe(true);
      if (!internal.ok || !portal.ok || !native.ok || !vague.ok) return;

      expect(portal.publicResult.recommendedScenario.range.likely).toBeGreaterThanOrEqual(
        internal.publicResult.recommendedScenario.range.likely *
          PORTAL_VS_INTERNAL_MIN_RATIO,
      );

      const nativeBlob = [
        native.publicResult.productSummary,
        ...native.publicResult.costDrivers.map(
          (driver) => `${driver.title} ${driver.explanation}`,
        ),
      ].join(" ");
      expect(nativeBlob).toMatch(/iOS|Android|native|mobile/i);

      const vagueRange = vague.publicResult.recommendedScenario.range;
      const wide = vagueRange.high / Math.max(vagueRange.low, 1) >= 2;
      expect(
        vague.publicResult.discoveryRecommended ||
          vague.publicResult.confidence.level === "early" ||
          wide,
      ).toBe(true);
    },
    120_000,
  );
});
