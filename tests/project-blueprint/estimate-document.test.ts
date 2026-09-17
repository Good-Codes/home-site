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
  alternativeScenarios: [
    {
      id: "lean",
      name: "Lean",
      summary: "Core portal only.",
      includedCapabilityIds: [],
      range: { low: 380_000, likely: 520_000, high: 740_000 },
      timeline: { minimumWeeks: 12, likelyWeeks: 16, maximumWeeks: 20 },
    },
  ],
  phaseBreakdown: [
    {
      id: "build",
      name: "Build",
      description: "Product engineering.",
      allocation: { low: 300_000, likely: 480_000, high: 700_000 },
    },
  ],
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
    unknowns: ["Final payment provider is not chosen."],
    improvements: [],
  },
  assumptions: [{ id: "a1", text: "First release is web-only." }],
  exclusions: ["Cloud usage"],
  discoveryRecommended: false,
  nextStepRecommendation: "Talk with a Good Code specialist.",
};

describe("estimate PDF HTML", () => {
  it("includes the rough-estimate disclaimer, retention notice, range, and contact", () => {
    const html = renderEstimateDocumentHtml({
      result,
      referenceId: "est-123",
    });

    expect(html).toContain(ESTIMATE_PDF_DISCLAIMER);
    expect(html.toLowerCase()).toContain("subject to change");
    expect(html.toLowerCase()).toContain("we keep the description");
    expect(html).toContain("A dealership finance portal");
    expect(html).not.toContain("est-123");
    expect(html).toContain("Good Code");
    expect(html).toContain("admin@goodcode.co.za");
    expect(html).not.toContain("calculationTrace");
    expect(html).not.toContain("sellRates");
    expect(html).toContain(
      new Intl.DateTimeFormat("en-ZA", {
        dateStyle: "medium",
        timeZone: "Africa/Johannesburg",
      }).format(new Date(result.generatedAt)),
    );
  });

  it("uses the Good Code document system instead of the previous serif template", () => {
    const html = renderEstimateDocumentHtml({
      result,
      referenceId: "est-123",
      concept: {
        headline: "Dealership finance portal",
        summary: "A portal for monthly vehicle finance.",
        whoItsFor: "Dealership finance teams",
        coreCapabilities: ["Document collection", "Monthly payments"],
        assumptions: [],
      },
    });

    expect(html).toContain("Geist Sans");
    expect(html).toContain("Geist Mono");
    expect(html).toContain("#67AFA7");
    expect(html).toContain("#0F1117");
    expect(html).toContain("#ECEFF4");
    expect(html).toContain("#171B21");
    expect(html).toContain("color-scheme: dark");
    expect(html).toContain("sheet-top");
    expect(html).toContain("sheet-bottom");
    expect(html).toContain("Good Code");
    expect(html).toContain("Built by people. Powered by good code.");
    expect(html).toContain("data:image/png;base64,");
    expect(html).toContain("Moderate confidence");
    expect(html).toContain("Cost by phase");
    expect(html).toContain("Other scenarios");
    expect(html).toContain("Document collection");
    expect(html).not.toContain("est-123");
    expect(html).not.toContain("page-veil");
    expect(html).toContain("border-radius: 12px");
    expect(html).toContain("class=\"keep\"");
    expect(html).not.toContain("Georgia");
    expect(html).not.toContain("#F9FAFB");
    expect(html).not.toContain("#f4e7d8");
    expect(html).not.toContain("#c4a574");
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
