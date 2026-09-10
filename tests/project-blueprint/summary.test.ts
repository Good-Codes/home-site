import { describe, expect, it } from "vitest";

import { buildEstimateFacts, buildReviewSummary } from "@/lib/project-blueprint/summary";
import { normalizeAnswers } from "@/lib/project-blueprint/answers";
import {
  formatUnknownMarker,
  formatUnknownQuestionId,
} from "@/lib/project-blueprint/unknown-copy";

describe("unknown copy", () => {
  it("turns question ids into plain language", () => {
    expect(formatUnknownMarker("q.users.groups", "not_sure")).toBe(
      "Who will use the product is still open.",
    );
    expect(formatUnknownMarker("q.intake.payments", "need_advice")).toBe(
      "Whether people will pay inside the product needs specialist advice.",
    );
    expect(formatUnknownQuestionId("q.cap.access")).toBe(
      "How people will sign in is still open.",
    );
  });

  it("never returns a raw q.* id", () => {
    const text = formatUnknownMarker("q.quality.requirements", "not_sure");
    expect(text).not.toMatch(/^q\./);
    expect(text).not.toMatch(/not_sure/);
  });
});

describe("review summary unknowns", () => {
  it("lists human-readable unknowns instead of field names", () => {
    const summary = buildReviewSummary(
      normalizeAnswers({
        route: "route.custom_web_platform",
        timing: "timing.not_sure",
        userScale: "scale.unknown",
        productLevel: "level.not_sure",
        unknowns: {
          "q.users.groups": "not_sure",
          "q.delivery.timing": "not_sure",
          "q.quality.requirements": "not_sure",
          "q.integrations.systems": "not_sure",
          "q.intake.payments": "not_sure",
          "q.cap.access": "not_sure",
        },
      }),
    );

    expect(summary.unknowns.some((item) => item.startsWith("q."))).toBe(false);
    expect(summary.unknowns).toEqual(
      expect.arrayContaining([
        "Who will use the product is still open.",
        "Delivery timing is still open.",
        "Whether this handles sensitive or regulated information is still open.",
        "Whether this needs to connect to other systems is still open.",
        "Whether people will pay inside the product is still open.",
        "How people will sign in is still open.",
      ]),
    );
    expect(summary.unknowns.filter((item) => /timing/i.test(item))).toHaveLength(1);
  });
});

describe("estimate facts", () => {
  it("summarises surfaces, payments, integrations, and quality without catalogue IDs", () => {
    const facts = buildEstimateFacts(
      normalizeAnswers({
        surfaces: ["surface.admin_workspace"],
        capabilities: ["cap.workflow.status_tracking"],
        integrations: ["integration.none"],
        qualityRequirements: [],
      }),
    );
    expect(facts.map((fact) => fact.id)).toEqual([
      "surfaces",
      "payments",
      "integrations",
      "quality",
    ]);
    const blob = facts.map((fact) => fact.body).join(" ");
    expect(blob).not.toMatch(/\bq\./);
    expect(blob).toMatch(/not part of the first release/i);
  });
});
