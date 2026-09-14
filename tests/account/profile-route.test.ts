import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/project-blueprint/auth/admin", () => ({
  requireCustomer: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { requireCustomer } from "@/lib/project-blueprint/auth/admin";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { GET, PUT } from "@/app/api/account/profile/route";

const customer = {
  ok: true as const,
  user: {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada",
    role: "CUSTOMER" as const,
  },
};

const profileRow = {
  email: "ada@example.com",
  name: "Ada",
  phone: null,
  preferredContact: null,
  organisation: null,
  jobTitle: null,
  city: null,
  province: null,
  organisationType: null,
  industry: null,
  teamSize: null,
  referralSource: null,
};

describe("GET/PUT /api/account/profile", () => {
  beforeEach(() => {
    vi.mocked(requireCustomer).mockReset();
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.update).mockReset();
  });

  it("returns 403 when the session is not a customer", async () => {
    vi.mocked(requireCustomer).mockResolvedValue({
      ok: false,
      status: 403,
      error: "Customer access required.",
    });

    const response = await GET();
    expect(response.status).toBe(403);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns the customer profile", async () => {
    vi.mocked(requireCustomer).mockResolvedValue(customer);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(profileRow as never);

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.profile.email).toBe("ada@example.com");
    expect(body.profile.name).toBe("Ada");
  });

  it("updates profile fields and ignores email or role in the body", async () => {
    vi.mocked(requireCustomer).mockResolvedValue(customer);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...profileRow,
      organisation: "Acme",
      phone: "082 000 0000",
    } as never);

    const response = await PUT(
      new Request("http://localhost/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Ada",
          phone: "082 000 0000",
          organisation: "Acme",
          email: "hacked@example.com",
          role: "ADMIN",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const updateCall = vi.mocked(prisma.user.update).mock.calls[0]?.[0];
    expect(updateCall?.where).toEqual({ id: "user-1" });
    expect(updateCall?.data).toMatchObject({
      name: "Ada",
      phone: "082 000 0000",
      organisation: "Acme",
    });
    expect(updateCall?.data).not.toHaveProperty("email");
    expect(updateCall?.data).not.toHaveProperty("role");
  });
});
