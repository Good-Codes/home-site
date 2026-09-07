import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { RegisterError, registerCustomer } from "@/lib/auth/register";

describe("registerCustomer", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.create).mockReset();
  });

  it("always creates CUSTOMER even if a staff role is supplied", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      name: "Ada",
      role: UserRole.CUSTOMER,
    } as never);

    const user = await registerCustomer({
      email: "Ada@Example.com",
      password: "a-sufficiently-long-pass",
      name: "Ada",
      role: "ADMIN",
    });

    expect(user.role).toBe(UserRole.CUSTOMER);
    expect(user.email).toBe("ada@example.com");
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: UserRole.CUSTOMER,
          email: "ada@example.com",
        }),
      }),
    );
    const createArg = vi.mocked(prisma.user.create).mock.calls[0]?.[0];
    expect(createArg?.data).not.toHaveProperty("role", "ADMIN");
    expect(String(createArg?.data.passwordHash ?? "")).not.toBe(
      "a-sufficiently-long-pass",
    );
  });

  it("rejects short passwords", async () => {
    await expect(
      registerCustomer({
        email: "ada@example.com",
        password: "short",
      }),
    ).rejects.toBeInstanceOf(RegisterError);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
