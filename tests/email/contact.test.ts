import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/account/estimates", async () => {
  const actual = await vi.importActual<typeof import("@/lib/account/estimates")>(
    "@/lib/account/estimates",
  );
  return {
    ...actual,
    listSavedEstimates: vi.fn(),
    getOwnedCalculatedEstimate: vi.fn(),
  };
});

import { getOwnedCalculatedEstimate, listSavedEstimates } from "@/lib/account/estimates";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { CONTACT_NO_ESTIMATE } from "@/lib/email/constants";
import {
  buildContactEnquiryEmail,
  estimateSnippetFromRecord,
  resolveContactEnquiry,
} from "@/lib/email/contact";

const USER = "11111111-1111-4111-8111-111111111111";
const ESTIMATE = "22222222-2222-4222-8222-222222222222";

const savedItem = {
  id: ESTIMATE,
  savedToProfileAt: new Date().toISOString(),
  productSummary: "Comprehensive Fitness Application",
  rangeLabel: "R800k–R1.8m",
};

const ownedEstimate = {
  id: ESTIMATE,
  savedToProfileAt: new Date(),
  concept: {
    headline: "Comprehensive Fitness Application",
    summary:
      "An innovative mobile application designed to seamlessly integrate workout and nutrition tracking, enhanced by AI food scanning technology.",
    whoItsFor:
      "individuals seeking to improve their fitness and nutrition through a holistic approach.",
    coreCapabilities: [],
    assumptions: [],
  },
  results: [
    {
      id: "result-1",
      createdAt: new Date(),
      publicResult: {
        productSummary: "Comprehensive Fitness Application",
      },
    },
  ],
};

describe("buildContactEnquiryEmail", () => {
  it("includes the estimate reference and the visible description", () => {
    const email = buildContactEnquiryEmail({
      name: "Ben",
      email: "ben@example.com",
      phone: "+27 83 000 0000",
      details: "",
      fromAccount: true,
      estimate: {
        referenceId: ESTIMATE,
        productSummary: "Comprehensive Fitness Application",
        summary:
          "An innovative mobile application designed to seamlessly integrate workout and nutrition tracking.",
        whoItsFor: "individuals seeking to improve their fitness and nutrition.",
      },
    });

    expect(email.subject).toContain("Comprehensive Fitness Application");
    expect(email.text).toContain(`Reference: ${ESTIMATE}`);
    expect(email.text).toContain("Comprehensive Fitness Application");
    expect(email.text).toContain("innovative mobile application");
    expect(email.text).toContain("For: individuals seeking to improve their fitness");
    expect(email.html).toContain(ESTIMATE);
  });

  it("uses the project details field when no estimate is selected", () => {
    const email = buildContactEnquiryEmail({
      name: "Ada",
      email: "ada@example.com",
      phone: "",
      details: "We need a dealer portal.",
      fromAccount: false,
      estimate: null,
    });

    expect(email.subject).toBe("New project enquiry from Ada");
    expect(email.text).toContain("We need a dealer portal.");
    expect(email.text).not.toContain("Reference:");
  });

  it("HTML-encodes markup in the enquiry body", () => {
    const email = buildContactEnquiryEmail({
      name: "O'Brien",
      email: "obrien@example.com",
      phone: "",
      details: `<script>alert("xss")</script>`,
      fromAccount: false,
      estimate: null,
    });

    expect(email.html).toContain("O&#039;Brien");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>alert");
  });
});

describe("estimateSnippetFromRecord", () => {
  it("prefers the stored concept for the visible description", () => {
    const snippet = estimateSnippetFromRecord(ownedEstimate);
    expect(snippet).toMatchObject({
      referenceId: ESTIMATE,
      productSummary: "Comprehensive Fitness Application",
      summary: ownedEstimate.concept.summary,
      whoItsFor: ownedEstimate.concept.whoItsFor,
    });
  });
});

describe("resolveContactEnquiry", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(listSavedEstimates).mockReset();
    vi.mocked(getOwnedCalculatedEstimate).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("validates guest submissions", async () => {
    const result = await resolveContactEnquiry(
      { name: "Ada", email: "ada@example.com", details: "A new app" },
      null,
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fromAccount).toBe(false);
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it("keeps apostrophes and accents in guest names", async () => {
    const result = await resolveContactEnquiry(
      { name: "José O'Brien", email: "jose@example.com", details: "A new app" },
      null,
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("José O'Brien");
    }
  });

  it("strips markup from guest names", async () => {
    const result = await resolveContactEnquiry(
      {
        name: "Ada <script>alert(1)</script>",
        email: "ada@example.com",
        details: "A new app",
      },
      null,
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ada");
    }
  });

  it("uses the signed-in profile and ignores spoofed contact fields", async () => {
    vi.mocked(listSavedEstimates).mockResolvedValue([savedItem]);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      name: "Ben",
      email: "ben@goodcode.example",
      phone: "083 560 3912",
    } as never);
    vi.mocked(getOwnedCalculatedEstimate).mockResolvedValue(ownedEstimate);

    const result = await resolveContactEnquiry(
      {
        name: "Attacker",
        email: "attacker@example.com",
        phone: "000",
        estimateId: ESTIMATE,
        details: "ignore me",
      },
      { id: USER, role: "CUSTOMER" },
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fromAccount).toBe(true);
      expect(result.data.name).toBe("Ben");
      expect(result.data.email).toBe("ben@goodcode.example");
      expect(result.data.phone).toBe("083 560 3912");
      expect(result.data.estimate?.referenceId).toBe(ESTIMATE);
      expect(result.data.estimate?.summary).toContain("workout and nutrition");
    }
  });

  it("requires project details when the customer selects no estimate", async () => {
    vi.mocked(listSavedEstimates).mockResolvedValue([savedItem]);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      name: "Ben",
      email: "ben@goodcode.example",
      phone: null,
    } as never);

    const missing = await resolveContactEnquiry(
      { estimateId: CONTACT_NO_ESTIMATE },
      { id: USER, role: "CUSTOMER" },
    );
    expect(missing.success).toBe(false);

    const ok = await resolveContactEnquiry(
      { estimateId: CONTACT_NO_ESTIMATE, details: "A workshop booking tool" },
      { id: USER, role: "CUSTOMER" },
    );
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.estimate).toBeNull();
      expect(ok.data.details).toBe("A workshop booking tool");
    }
  });

  it("does not attach another user's estimate", async () => {
    vi.mocked(listSavedEstimates).mockResolvedValue([savedItem]);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      name: "Ben",
      email: "ben@goodcode.example",
      phone: null,
    } as never);
    vi.mocked(getOwnedCalculatedEstimate).mockResolvedValue(null);

    const result = await resolveContactEnquiry(
      { estimateId: ESTIMATE },
      { id: USER, role: "CUSTOMER" },
    );
    expect(result).toEqual({
      success: false,
      error: "Estimate not found.",
      status: 404,
    });
  });
});
