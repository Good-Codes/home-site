import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/project-blueprint/auth/admin", () => ({
  requireCustomer: vi.fn(),
}));

vi.mock("@/lib/account/estimates", () => ({
  getOwnedCalculatedEstimate: vi.fn(),
}));

vi.mock("@/lib/project-blueprint/document/pdf", () => ({
  htmlToPdf: vi.fn(async () => Buffer.from("%PDF-1.4 mock")),
}));

vi.mock("@/lib/auth/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/rate-limit")>(
    "@/lib/auth/rate-limit",
  );
  return {
    ...actual,
    checkAuthRateLimit: vi.fn(() => true),
  };
});

import { requireCustomer } from "@/lib/project-blueprint/auth/admin";
import { getOwnedCalculatedEstimate } from "@/lib/account/estimates";
import { GET } from "@/app/api/account/estimates/[id]/pdf/route";

const customer = {
  ok: true as const,
  user: {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada",
    role: "CUSTOMER" as const,
  },
};

const estimateId = "22222222-2222-4222-8222-222222222222";

describe("GET /api/account/estimates/[id]/pdf", () => {
  beforeEach(() => {
    vi.mocked(requireCustomer).mockReset();
    vi.mocked(getOwnedCalculatedEstimate).mockReset();
  });

  it("returns 401/403 when the session is not a customer", async () => {
    vi.mocked(requireCustomer).mockResolvedValue({
      ok: false,
      status: 401,
      error: "Authentication required.",
    });

    const response = await GET(new Request("http://localhost/pdf"), {
      params: Promise.resolve({ id: estimateId }),
    });
    expect(response.status).toBe(401);
    expect(getOwnedCalculatedEstimate).not.toHaveBeenCalled();
  });

  it("returns 404 for another user's estimate", async () => {
    vi.mocked(requireCustomer).mockResolvedValue(customer);
    vi.mocked(getOwnedCalculatedEstimate).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/pdf"), {
      params: Promise.resolve({ id: estimateId }),
    });
    expect(response.status).toBe(404);
  });

  it("returns a PDF for the owner", async () => {
    vi.mocked(requireCustomer).mockResolvedValue(customer);
    vi.mocked(getOwnedCalculatedEstimate).mockResolvedValue({
      id: estimateId,
      savedToProfileAt: new Date(),
      concept: null,
      results: [
        {
          id: "result-1",
          createdAt: new Date(),
          publicResult: {
            estimateId,
            pricingVersion: "v1",
            currency: "ZAR",
            generatedAt: "2026-09-15T10:00:00.000Z",
            productSummary: "A portal",
            recommendedScenario: {
              id: "recommended",
              name: "Recommended",
              summary: "A portal",
              includedCapabilityIds: [],
              range: { low: 1, likely: 2, high: 3 },
              timeline: { minimumWeeks: 4, likelyWeeks: 6 },
            },
            alternativeScenarios: [],
            phaseBreakdown: [],
            costDrivers: [],
            confidence: {
              level: "moderate",
              explanation: "ok",
              unknowns: [],
              improvements: [],
            },
            assumptions: [],
            exclusions: [],
            discoveryRecommended: false,
            nextStepRecommendation: "Talk to us",
          },
        },
      ],
    } as never);

    const response = await GET(new Request("http://localhost/pdf"), {
      params: Promise.resolve({ id: estimateId }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/pdf");
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes.toString("utf8", 0, 8)).toContain("%PDF");
  });
});
