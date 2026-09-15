import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/email/resend", () => ({
  sendPasswordResetEmail: vi.fn(async () => ({
    ok: true,
    messageId: "stub",
    stub: true,
  })),
}));

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import { PASSWORD_RESET_SUCCESS_MESSAGE } from "@/lib/auth/constants";
import { comparePassword } from "@/lib/auth/password";
import {
  hashResetToken,
  requestPasswordReset,
  resetPassword,
} from "@/lib/auth/password-reset";

const NEW_PASSWORD = "another-long-password";

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.$transaction).mockReset();
    vi.mocked(sendPasswordResetEmail).mockClear();
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        passwordResetToken: {
          updateMany: vi.fn(),
          create: vi.fn(),
        },
      };
      return fn(tx as never);
    });
  });

  it("returns the same message when no account exists and does not email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await requestPasswordReset("missing@example.com");

    expect(result.message).toBe(PASSWORD_RESET_SUCCESS_MESSAGE);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not email inactive users", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      isActive: false,
    } as never);

    const result = await requestPasswordReset("ada@example.com");

    expect(result.message).toBe(PASSWORD_RESET_SUCCESS_MESSAGE);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("emails an active OAuth-only user so they can set a password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      isActive: true,
    } as never);

    const result = await requestPasswordReset("Ada@Example.com");

    expect(result.message).toBe(PASSWORD_RESET_SUCCESS_MESSAGE);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(sendPasswordResetEmail).mock.calls[0]?.[0];
    expect(payload?.to).toBe("ada@example.com");
    expect(payload?.resetUrl).toMatch(/\/reset-password\?token=/);
  });
});

describe("resetPassword", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.$transaction).mockReset();
  });

  it("rejects expired or used tokens", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        passwordResetToken: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
        user: { update: vi.fn() },
      };
      return fn(tx as never);
    });

    await expect(
      resetPassword({
        token: "missing-token",
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      }),
    ).rejects.toMatchObject({
      name: "PasswordResetError",
      code: "INVALID_TOKEN",
    });
  });

  it("sets a password for an OAuth-only user and unlocks the account", async () => {
    const rawToken = "reset-token-value";
    const tokenHash = hashResetToken(rawToken);
    const userUpdate = vi.fn().mockResolvedValue({ id: "user-1" });
    const tokenUpdate = vi.fn();

    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        passwordResetToken: {
          findUnique: vi.fn().mockResolvedValue({
            id: "tok-1",
            userId: "user-1",
            tokenHash,
            expiresAt: new Date(Date.now() + 60_000),
            usedAt: null,
            user: { id: "user-1", isActive: true },
          }),
          update: tokenUpdate,
          updateMany: vi.fn(),
        },
        user: { update: userUpdate },
      };
      return fn(tx as never);
    });

    await resetPassword({
      token: rawToken,
      newPassword: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    });

    expect(userUpdate).toHaveBeenCalledTimes(1);
    const data = userUpdate.mock.calls[0]?.[0]?.data as {
      passwordHash: string;
      failedLoginCount: number;
      lockedUntil: Date | null;
    };
    expect(data.failedLoginCount).toBe(0);
    expect(data.lockedUntil).toBeNull();
    await expect(comparePassword(NEW_PASSWORD, data.passwordHash)).resolves.toBe(
      true,
    );
    expect(tokenUpdate).toHaveBeenCalled();
  });
});
