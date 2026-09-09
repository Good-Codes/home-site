import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { unlockUser, adminSetUserPassword } from "@/lib/auth/admin-users";

describe("admin user management", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.$transaction).mockReset();
    vi.mocked(prisma.$transaction).mockImplementation(async (ops) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops);
      }
      return ops(prisma as never);
    });
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(prisma.auditEvent.create).mockResolvedValue({} as never);
  });

  it("unlocks by clearing failed attempts and lockedUntil", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never);

    await unlockUser({ actorUserId: "admin-1", userId: "user-1" });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  });

  it("sets a new password hash", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never);

    await adminSetUserPassword({
      actorUserId: "admin-1",
      userId: "user-1",
      newPassword: "another-long-password",
      confirmPassword: "another-long-password",
    });

    const updateCall = vi.mocked(prisma.user.update).mock.calls[0]?.[0];
    expect(updateCall?.where).toEqual({ id: "user-1" });
    const hash = (updateCall?.data as { passwordHash: string }).passwordHash;
    expect(hash).not.toBe("another-long-password");
    await expect(hashPassword("x")).resolves.toBeTruthy();
  });
});
