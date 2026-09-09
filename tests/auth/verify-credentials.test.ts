import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";

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
import { LOGIN_LOCKOUT_MAX_ATTEMPTS } from "@/lib/auth/constants";
import { hashPassword } from "@/lib/auth/password";
import { verifyCredentials } from "@/lib/auth/verify-credentials";

const PASSWORD = "a-sufficiently-long-pass";

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada",
    role: UserRole.CUSTOMER,
    isActive: true,
    failedLoginCount: 0,
    lockedUntil: null,
    passwordHash: "",
    ...overrides,
  };
}

describe("verifyCredentials", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.update).mockReset();
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
  });

  it("returns the user when the password matches", async () => {
    const passwordHash = await hashPassword(PASSWORD);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      userRow({ passwordHash }) as never,
    );

    await expect(verifyCredentials("Ada@Example.com", PASSWORD)).resolves.toEqual({
      ok: true,
      user: {
        id: "user-1",
        email: "ada@example.com",
        name: "Ada",
        role: UserRole.CUSTOMER,
      },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("increments failed attempts on a bad password", async () => {
    const passwordHash = await hashPassword(PASSWORD);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      userRow({ passwordHash, failedLoginCount: 1 }) as never,
    );

    await expect(
      verifyCredentials("ada@example.com", "definitely-wrong-12"),
    ).resolves.toEqual({ ok: false, reason: "invalid" });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { failedLoginCount: 2, lockedUntil: null },
    });
  });

  it("locks the account after too many failed attempts", async () => {
    const passwordHash = await hashPassword(PASSWORD);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      userRow({
        passwordHash,
        failedLoginCount: LOGIN_LOCKOUT_MAX_ATTEMPTS - 1,
      }) as never,
    );

    await expect(
      verifyCredentials("ada@example.com", "definitely-wrong-12"),
    ).resolves.toEqual({ ok: false, reason: "invalid" });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          failedLoginCount: LOGIN_LOCKOUT_MAX_ATTEMPTS,
          lockedUntil: expect.any(Date),
        }),
      }),
    );
  });

  it("rejects a locked account even with the right password", async () => {
    const passwordHash = await hashPassword(PASSWORD);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      userRow({
        passwordHash,
        failedLoginCount: LOGIN_LOCKOUT_MAX_ATTEMPTS,
        lockedUntil: new Date(Date.now() + 60_000),
      }) as never,
    );

    await expect(verifyCredentials("ada@example.com", PASSWORD)).resolves.toEqual({
      ok: false,
      reason: "locked",
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("clears lockout after a successful login", async () => {
    const passwordHash = await hashPassword(PASSWORD);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      userRow({
        passwordHash,
        failedLoginCount: 2,
        lockedUntil: new Date(Date.now() - 1_000),
      }) as never,
    );

    await expect(verifyCredentials("ada@example.com", PASSWORD)).resolves.toMatchObject({
      ok: true,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  });

  it("rejects an inactive user even with the right password", async () => {
    const passwordHash = await hashPassword(PASSWORD);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      userRow({ passwordHash, isActive: false }) as never,
    );

    await expect(verifyCredentials("ada@example.com", PASSWORD)).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects a social-only user without incrementing lockout", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      userRow({ passwordHash: null }) as never,
    );

    await expect(
      verifyCredentials("ada@example.com", PASSWORD),
    ).resolves.toEqual({ ok: false, reason: "invalid" });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
