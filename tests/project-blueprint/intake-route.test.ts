import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/project-blueprint/auth/admin", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/project-blueprint/analytics/events", () => ({
  trackBlueprintEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/project-blueprint/intake", () => ({
  checkIntakeRateLimit: () => true,
  clientKeyFromRequest: () => "test",
  runIntake: vi.fn(),
}));

import { requireUser } from "@/lib/project-blueprint/auth/admin";
import { runIntake } from "@/lib/project-blueprint/intake";
import { POST } from "@/app/api/project-blueprint/intake/route";
import type { IntakeResult } from "@/lib/project-blueprint/types";

const IDEA =
  "We need a customer portal where dealerships can upload finance applications and track progress after login.";

describe("POST /api/project-blueprint/intake", () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockReset();
    vi.mocked(runIntake).mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      ok: false,
      status: 401,
      error: "Authentication required.",
    });

    const response = await POST(
      new Request("http://localhost/api/project-blueprint/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaText: IDEA }),
      }),
    );

    expect(response.status).toBe(401);
    expect(runIntake).not.toHaveBeenCalled();
  });

  it("runs intake when authenticated", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      ok: true,
      user: {
        id: "user-1",
        email: "ada@example.com",
        name: "Ada",
        role: "CUSTOMER",
      },
    });
    vi.mocked(runIntake).mockResolvedValue({
      status: "ready",
      concept: {
        headline: "A portal",
        summary: "A signed-in workspace.",
        whoItsFor: "Dealership staff",
        coreCapabilities: ["Uploads"],
        assumptions: [],
      },
      answers: { ideaText: IDEA },
      clarifyingQuestions: [],
      usedFallback: true,
      round: 0,
    } as IntakeResult);

    const response = await POST(
      new Request("http://localhost/api/project-blueprint/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaText: IDEA }),
      }),
    );

    expect(response.status).toBe(200);
    expect(runIntake).toHaveBeenCalledOnce();
    const body = await response.json();
    expect(body.status).toBe("ready");
  });
});
