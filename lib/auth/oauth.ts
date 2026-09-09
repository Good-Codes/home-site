import "server-only";

import { UserRole } from "@prisma/client";

import { isDatabaseConfigured, prisma } from "@/lib/db";

export type OAuthIdentity = {
  provider: string;
  providerAccountId: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
};

export type OAuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

export type UpsertOAuthResult =
  | { ok: true; user: OAuthUser }
  | { ok: false; reason: "email" | "inactive" | "unavailable" };

export type ExtractOAuthResult =
  | { ok: true; identity: OAuthIdentity }
  | { ok: false; reason: "email" };

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
} as const;

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

function stringField(
  record: Record<string, unknown> | null | undefined,
  key: string,
): string {
  const value = record?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function isExplicitlyVerified(flag: unknown): boolean {
  return flag === true || flag === "true";
}

function isExplicitlyUnverified(flag: unknown): boolean {
  return flag === false || flag === "false";
}

export function pickVerifiedGithubEmail(emails: unknown): string | null {
  if (!Array.isArray(emails)) return null;
  const rows = emails.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const email = "email" in row && typeof row.email === "string" ? row.email.trim() : "";
    if (!email || !email.includes("@")) return [];
    const verified = "verified" in row && row.verified === true;
    const primary = "primary" in row && row.primary === true;
    return [{ email, verified, primary }];
  });
  const verified = rows.filter((row) => row.verified);
  const chosen = verified.find((row) => row.primary) ?? verified[0];
  return chosen?.email ?? null;
}

function profileEmailVerified(
  provider: string,
  profile: Record<string, unknown> | null,
): boolean {
  const flag = profile?.email_verified;
  if (provider === "google" || provider === "github") {
    return isExplicitlyVerified(flag);
  }
  if (provider === "microsoft-entra-id") {
    return !isExplicitlyUnverified(flag);
  }
  return isExplicitlyVerified(flag);
}

export function extractOAuthIdentity(input: {
  provider?: string | null;
  providerAccountId?: string | null;
  user?: { email?: string | null; name?: string | null } | null;
  profile?: Record<string, unknown> | null;
}): ExtractOAuthResult {
  const provider = input.provider?.trim() ?? "";
  const providerAccountId = input.providerAccountId?.trim() ?? "";
  if (!provider || !providerAccountId) {
    return { ok: false, reason: "email" };
  }

  const profile = input.profile;
  const preferred = stringField(profile, "preferred_username");
  const emailRaw =
    stringField(profile, "email") ||
    input.user?.email?.trim() ||
    (preferred.includes("@") ? preferred : "") ||
    "";

  if (!emailRaw || !emailRaw.includes("@") || emailRaw.length > 254) {
    return { ok: false, reason: "email" };
  }

  if (!profileEmailVerified(provider, profile ?? null)) {
    return { ok: false, reason: "email" };
  }

  const name =
    input.user?.name?.trim() || stringField(profile, "name") || null;

  return {
    ok: true,
    identity: {
      provider,
      providerAccountId,
      email: emailRaw.toLowerCase(),
      name,
      emailVerified: true,
    },
  };
}

async function loadLinkedUser(
  provider: string,
  providerAccountId: string,
): Promise<UpsertOAuthResult | null> {
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    select: { user: { select: USER_SELECT } },
  });
  if (!existingAccount) return null;
  if (!existingAccount.user.isActive) {
    return { ok: false, reason: "inactive" };
  }
  return {
    ok: true,
    user: {
      id: existingAccount.user.id,
      email: existingAccount.user.email,
      name: existingAccount.user.name,
      role: existingAccount.user.role,
    },
  };
}

async function linkExistingUser(
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    isActive: boolean;
  },
  identity: OAuthIdentity,
): Promise<UpsertOAuthResult> {
  if (!user.isActive) {
    return { ok: false, reason: "inactive" };
  }

  try {
    await prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: identity.provider,
        providerAccountId: identity.providerAccountId,
      },
    });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
  }

  if (!user.name && identity.name) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: identity.name },
    });
    return {
      ok: true,
      user: { id: user.id, email: user.email, name: identity.name, role: user.role },
    };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function upsertOAuthUser(
  input: OAuthIdentity,
  attempt = 0,
): Promise<UpsertOAuthResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "unavailable" };
  }

  const email = input.email.trim().toLowerCase();
  if (
    !input.emailVerified ||
    !email ||
    !email.includes("@") ||
    email.length > 254
  ) {
    return { ok: false, reason: "email" };
  }

  const provider = input.provider.trim();
  const providerAccountId = input.providerAccountId.trim();
  if (!provider || !providerAccountId) {
    return { ok: false, reason: "email" };
  }

  const identity: OAuthIdentity = {
    provider,
    providerAccountId,
    email,
    name: input.name?.trim() || null,
    emailVerified: true,
  };

  const linked = await loadLinkedUser(provider, providerAccountId);
  if (linked) return linked;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: USER_SELECT,
  });
  if (existingUser) {
    return linkExistingUser(existingUser, identity);
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name: identity.name,
        passwordHash: null,
        role: UserRole.CUSTOMER,
        isActive: true,
        oauthAccounts: {
          create: { provider, providerAccountId },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    return { ok: true, user };
  } catch (error) {
    if (!isUniqueConflict(error) || attempt >= 1) {
      throw error;
    }
    return upsertOAuthUser(identity, attempt + 1);
  }
}
