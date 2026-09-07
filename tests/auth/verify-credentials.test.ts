import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { verifyCredentials } from "@/lib/auth/verify-credentials";

describe("verifyCredentials", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("returns the user when the password matches", async () => {
    const passwordHash = await hashPassword("a-sufficiently-long-pass");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      name: "Ada",
      role: UserRole.CUSTOMER,
      isActive: true,
      passwordHash,
    } as never);

    await expect(
      verifyCredentials("Ada@Example.com", "a-sufficiently-long-pass"),
    ).resolves.toMatchObject({
      id: "user-1",
      email: "ada@example.com",
      role: UserRole.CUSTOMER,
    });
  });

  it("rejects a bad password", async () => {
    const passwordHash = await hashPassword("a-sufficiently-long-pass");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      name: "Ada",
      role: UserRole.CUSTOMER,
      isActive: true,
      passwordHash,
    } as never);

    await expect(
      verifyCredentials("ada@example.com", "definitely-wrong-12"),
    ).resolves.toBeNull();
  });

  it("rejects an inactive user even with the right password", async () => {
    const passwordHash = await hashPassword("a-sufficiently-long-pass");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      name: "Ada",
      role: UserRole.CUSTOMER,
      isActive: false,
      passwordHash,
    } as never);

    await expect(
      verifyCredentials("ada@example.com", "a-sufficiently-long-pass"),
    ).resolves.toBeNull();
  });
});
