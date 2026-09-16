import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/email/contact", async () => {
  const actual = await vi.importActual<typeof import("@/lib/email/contact")>(
    "@/lib/email/contact",
  );
  return {
    ...actual,
    resolveContactEnquiry: vi.fn(),
  };
});

vi.mock("@/lib/email/resend", () => ({
  sendContactEnquiryEmail: vi.fn(),
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

import { auth } from "@/auth";
import { POST } from "@/app/api/contact/route";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { resolveContactEnquiry } from "@/lib/email/contact";
import { sendContactEnquiryEmail } from "@/lib/email/resend";

const enquiry = {
  name: "Ben",
  email: "ben@example.com",
  phone: "083 560 3912",
  details: "",
  fromAccount: true,
  estimate: {
    referenceId: "22222222-2222-4222-8222-222222222222",
    productSummary: "Comprehensive Fitness Application",
    summary: "Workout and nutrition tracking.",
    whoItsFor: "people who want a holistic fitness plan",
  },
};

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(resolveContactEnquiry).mockReset();
    vi.mocked(sendContactEnquiryEmail).mockReset();
    vi.mocked(checkAuthRateLimit).mockReturnValue(true);
  });

  it("sends the enquiry to the contact inbox with a reply-to", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", role: "CUSTOMER" },
    } as never);
    vi.mocked(resolveContactEnquiry).mockResolvedValue({
      success: true,
      data: enquiry,
    });
    vi.mocked(sendContactEnquiryEmail).mockResolvedValue({
      ok: true,
      messageId: "msg-1",
      stub: true,
    });

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId: enquiry.estimate.referenceId }),
      }),
    );

    expect(response.status).toBe(200);
    expect(sendContactEnquiryEmail).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(sendContactEnquiryEmail).mock.calls[0]?.[0];
    expect(payload?.replyTo).toBe("ben@example.com");
    expect(payload?.subject).toContain("Comprehensive Fitness Application");
    expect(payload?.text).toContain(enquiry.estimate.referenceId);
    expect(payload?.text).toContain("Workout and nutrition tracking.");
  });

  it("returns 400 when the enquiry is invalid", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    vi.mocked(resolveContactEnquiry).mockResolvedValue({
      success: false,
      error: "Name, email, and project details are required.",
      status: 400,
    });

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    expect(sendContactEnquiryEmail).not.toHaveBeenCalled();
  });
});
