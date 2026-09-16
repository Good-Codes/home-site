import { describe, expect, it } from "vitest";

import { ESTIMATE_PDF_DISCLAIMER } from "@/lib/project-blueprint/document/disclaimer";
import { renderEstimateDocumentHtml } from "@/lib/project-blueprint/document/html";
import type { PublicEstimateResult } from "@/lib/project-blueprint/types";

const result: PublicEstimateResult = {
  estimateId: "result-1",
  pricingVersion: "ai-estimate-v1",
  currency: "ZAR",
  generatedAt: "2026-09-15T10:00:00.000Z",
  productSummary: "A dealership finance portal",
  recommendedScenario: {
    id: "recommended",
    name: "Recommended",
    summary: "Portal with documents and monthly payments.",
    includedCapabilityIds: [],
    range: { low: 550_000, likely: 850_000, high: 1_300_000 },
    timeline: { minimumWeeks: 16, likelyWeeks: 22, maximumWeeks: 28 },
  },
  alternativeScenarios: [],
  phaseBreakdown: [],
  costDrivers: [
    {
      id: "payments",
      title: "Monthly payments",
      explanation: "A payment gateway raises the band.",
    },
  ],
  confidence: {
    level: "moderate",
    explanation: "The brief is specific enough for a planning range.",
    unknowns: [],
    improvements: [],
  },
  assumptions: [{ id: "a1", text: "First release is web-only." }],
  exclusions: ["Cloud usage"],
  discoveryRecommended: false,
  nextStepRecommendation: "Talk with a Good Code specialist.",
};

describe("estimate PDF HTML", () => {
  it("includes the not-a-quote disclaimer, range, and contact", () => {
    const html = renderEstimateDocumentHtml({
      result,
      referenceId: "est-123",
    });

    expect(html).toContain(ESTIMATE_PDF_DISCLAIMER);
    expect(html.toLowerCase()).toContain("not an official quotation");
    expect(html).toContain("A dealership finance portal");
    expect(html).toContain("est-123");
    expect(html).toContain("Good Code");
    expect(html).not.toContain("calculationTrace");
    expect(html).not.toContain("sellRates");
  });

  it("encodes quotes in user-influenced PDF text", () => {
    const html = renderEstimateDocumentHtml({
      result: {
        ...result,
        productSummary: `Dealer's portal`,
      },
      referenceId: "est-123",
    });
    expect(html).toContain("Dealer&#039;s portal");
    expect(html).not.toContain("Dealer's portal");
  });
});
