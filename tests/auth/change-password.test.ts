import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { isDatabaseConfigured, prisma } from "@/lib/db";
import {
  ChangePasswordError,
  changePassword,
} from "@/lib/auth/change-password";
import { comparePassword, hashPassword } from "@/lib/auth/password";

const CURRENT = "a-sufficiently-long-pass";
const NEXT = "another-long-password";

describe("changePassword", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.update).mockReset();
  });

  it("rejects mismatched confirmation", async () => {
    await expect(
      changePassword({
        userId: "user-1",
        currentPassword: CURRENT,
        newPassword: NEXT,
        confirmPassword: "does-not-match-12",
      }),
    ).rejects.toMatchObject({
      name: "ChangePasswordError",
      code: "VALIDATION",
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects short new passwords", async () => {
    await expect(
      changePassword({
        userId: "user-1",
        currentPassword: CURRENT,
        newPassword: "short",
        confirmPassword: "short",
      }),
    ).rejects.toBeInstanceOf(ChangePasswordError);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects an incorrect current password", async () => {
    const passwordHash = await hashPassword(CURRENT);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      passwordHash,
    } as never);

    await expect(
      changePassword({
        userId: "user-1",
        currentPassword: "wrong-password-12",
        newPassword: NEXT,
        confirmPassword: NEXT,
      }),
    ).rejects.toMatchObject({
      name: "ChangePasswordError",
      code: "UNAUTHORIZED",
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("updates the stored hash on success", async () => {
    const passwordHash = await hashPassword(CURRENT);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      passwordHash,
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: "user-1" } as never);

    await changePassword({
      userId: "user-1",
      currentPassword: CURRENT,
      newPassword: NEXT,
      confirmPassword: NEXT,
    });

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    const updateArg = vi.mocked(prisma.user.update).mock.calls[0]?.[0];
    const nextHash = String(updateArg?.data.passwordHash ?? "");
    expect(nextHash).not.toBe(NEXT);
    expect(nextHash).not.toBe(passwordHash);
    await expect(comparePassword(NEXT, nextHash)).resolves.toBe(true);
  });
});
