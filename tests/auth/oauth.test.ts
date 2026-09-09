import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    oAuthAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { isDatabaseConfigured, prisma } from "@/lib/db";
import {
  extractOAuthIdentity,
  pickVerifiedGithubEmail,
  upsertOAuthUser,
} from "@/lib/auth/oauth";

const identity = {
  provider: "google",
  providerAccountId: "google-sub-1",
  email: "Ada@Example.com",
  name: "Ada",
  emailVerified: true,
};

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada",
    role: UserRole.CUSTOMER,
    isActive: true,
    ...overrides,
  };
}

describe("pickVerifiedGithubEmail", () => {
  it("prefers the verified primary email", () => {
    expect(
      pickVerifiedGithubEmail([
        { email: "other@example.com", verified: true, primary: false },
        { email: "ada@example.com", verified: true, primary: true },
        { email: "unverified@example.com", verified: false, primary: true },
      ]),
    ).toBe("ada@example.com");
  });

  it("returns null when nothing is verified", () => {
    expect(
      pickVerifiedGithubEmail([
        { email: "ada@example.com", verified: false, primary: true },
      ]),
    ).toBeNull();
  });
});

describe("extractOAuthIdentity", () => {
  it("accepts a verified Google profile", () => {
    expect(
      extractOAuthIdentity({
        provider: "google",
        providerAccountId: "sub-1",
        user: { email: "ada@example.com", name: "Ada" },
        profile: { email: "ada@example.com", email_verified: true, name: "Ada" },
      }),
    ).toEqual({
      ok: true,
      identity: {
        provider: "google",
        providerAccountId: "sub-1",
        email: "ada@example.com",
        name: "Ada",
        emailVerified: true,
      },
    });
  });

  it("rejects unverified Google email", () => {
    expect(
      extractOAuthIdentity({
        provider: "google",
        providerAccountId: "sub-1",
        user: { email: "ada@example.com" },
        profile: { email: "ada@example.com", email_verified: false },
      }),
    ).toEqual({ ok: false, reason: "email" });
  });

  it("rejects missing email", () => {
    expect(
      extractOAuthIdentity({
        provider: "github",
        providerAccountId: "99",
        profile: { email_verified: true },
      }),
    ).toEqual({ ok: false, reason: "email" });
  });

  it("accepts Microsoft email when email_verified is omitted", () => {
    const result = extractOAuthIdentity({
      provider: "microsoft-entra-id",
      providerAccountId: "oid-1",
      profile: { email: "ada@contoso.com", name: "Ada" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.identity.email).toBe("ada@contoso.com");
    }
  });
});

describe("upsertOAuthUser", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.oAuthAccount.findUnique).mockReset();
    vi.mocked(prisma.oAuthAccount.create).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.create).mockReset();
    vi.mocked(prisma.user.update).mockReset();
    vi.mocked(prisma.oAuthAccount.create).mockResolvedValue({} as never);
  });

  it("creates a CUSTOMER with no password for a new verified identity", async () => {
    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      name: "Ada",
      role: UserRole.CUSTOMER,
    } as never);

    await expect(upsertOAuthUser(identity)).resolves.toEqual({
      ok: true,
      user: {
        id: "user-1",
        email: "ada@example.com",
        name: "Ada",
        role: UserRole.CUSTOMER,
      },
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "ada@example.com",
          passwordHash: null,
          role: UserRole.CUSTOMER,
          oauthAccounts: {
            create: {
              provider: "google",
              providerAccountId: "google-sub-1",
            },
          },
        }),
      }),
    );
  });

  it("returns the existing user for the same provider account", async () => {
    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue({
      user: userRow(),
    } as never);

    await expect(upsertOAuthUser(identity)).resolves.toMatchObject({
      ok: true,
      user: { id: "user-1", role: UserRole.CUSTOMER },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.oAuthAccount.create).not.toHaveBeenCalled();
  });

  it("links a new provider to an existing ADMIN without changing role", async () => {
    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      userRow({ role: UserRole.ADMIN }) as never,
    );

    await expect(
      upsertOAuthUser({ ...identity, provider: "github", providerAccountId: "gh-1" }),
    ).resolves.toEqual({
      ok: true,
      user: {
        id: "user-1",
        email: "ada@example.com",
        name: "Ada",
        role: UserRole.ADMIN,
      },
    });

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        provider: "github",
        providerAccountId: "gh-1",
      },
    });
  });

  it("rejects unverified email without writing", async () => {
    await expect(
      upsertOAuthUser({ ...identity, emailVerified: false }),
    ).resolves.toEqual({ ok: false, reason: "email" });
    expect(prisma.oAuthAccount.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an inactive linked user", async () => {
    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue({
      user: userRow({ isActive: false }),
    } as never);

    await expect(upsertOAuthUser(identity)).resolves.toEqual({
      ok: false,
      reason: "inactive",
    });
  });

  it("rejects an inactive user matched by email", async () => {
    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      userRow({ isActive: false }) as never,
    );

    await expect(upsertOAuthUser(identity)).resolves.toEqual({
      ok: false,
      reason: "inactive",
    });
    expect(prisma.oAuthAccount.create).not.toHaveBeenCalled();
  });

  it("retries as a link when create hits a unique conflict", async () => {
    vi.mocked(prisma.oAuthAccount.findUnique)
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(null as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(userRow() as never);
    vi.mocked(prisma.user.create).mockRejectedValueOnce({ code: "P2002" });

    await expect(upsertOAuthUser(identity)).resolves.toMatchObject({
      ok: true,
      user: { id: "user-1" },
    });
    expect(prisma.oAuthAccount.create).toHaveBeenCalled();
  });
});
