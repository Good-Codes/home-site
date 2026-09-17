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
import {
  unlockUser,
  lockUser,
  adminSetUserPassword,
  getAdminUserDetail,
} from "@/lib/auth/admin-users";

describe("admin user management", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.update).mockReset();
    vi.mocked(prisma.auditEvent.create).mockReset();
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
      data: { adminLocked: false, failedLoginCount: 0, lockedUntil: null },
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

  it("locks another account", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never);

    await lockUser({ actorUserId: "admin-1", userId: "user-1" });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { adminLocked: true },
    });
  });

  it("refuses to lock the signed-in admin", async () => {
    await expect(
      lockUser({ actorUserId: "admin-1", userId: "admin-1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("lists a customer's estimates for the admin profile", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      name: "Ada",
      role: "CUSTOMER",
      isActive: true,
      adminLocked: false,
      failedLoginCount: 0,
      lockedUntil: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      phone: null,
      preferredContact: null,
      organisation: "Acme",
      jobTitle: null,
      city: null,
      province: null,
      organisationType: null,
      industry: null,
      teamSize: null,
      referralSource: null,
      estimates: [
        {
          id: "est-1",
          status: "CALCULATED",
          savedToProfileAt: new Date("2026-02-01T00:00:00.000Z"),
          createdAt: new Date("2026-01-15T00:00:00.000Z"),
          updatedAt: new Date("2026-02-01T00:00:00.000Z"),
          results: [
            {
              id: "result-1",
              publicResult: {
                productSummary: "A finance portal",
                recommendedScenario: {
                  range: { low: 100000, likely: 150000, high: 200000 },
                },
              },
            },
          ],
        },
      ],
    } as never);

    const detail = await getAdminUserDetail("user-1");
    expect(detail?.locked).toBe(false);
    expect(detail?.profile.organisation).toBe("Acme");
    expect(detail?.estimates).toEqual([
      expect.objectContaining({
        estimateId: "est-1",
        resultId: "result-1",
        savedToProfile: true,
        productSummary: "A finance portal",
      }),
    ]);
  });
});
