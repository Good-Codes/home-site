import { describe, expect, it } from "vitest";

import { classifyIdeaKeywords } from "@/lib/project-blueprint/classifier/keyword";

describe("classifyIdeaKeywords", () => {
  it("suggests portal product type and surface for portal language", () => {
    const result = classifyIdeaKeywords(
      "We need a customer portal where dealerships can upload documents, track progress, and manage their accounts after login.",
    );
    const ids = result.suggestions.map((s) => s.id);
    expect(ids).toContain("route.customer_portal");
    expect(ids).toContain("surface.customer_portal");
    expect(result.notes.some((n) => /no prices|no investment/i.test(n))).toBe(
      true,
    );
  });

  it("suggests payment capabilities for checkout language", () => {
    const result = classifyIdeaKeywords(
      "Customers should pay online with card checkout, recurring subscriptions, and refunds when orders are cancelled.",
    );
    const ids = result.suggestions.map((s) => s.id);
    expect(ids).toContain("cap.payments.one_time");
    expect(ids).toContain("cap.payments.recurring");
  });
});
