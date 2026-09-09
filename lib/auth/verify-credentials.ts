import "server-only";

import type { UserRole } from "@prisma/client";

import { isDatabaseConfigured, prisma } from "@/lib/db";

import {
  LOGIN_LOCKOUT_MAX_ATTEMPTS,
  LOGIN_LOCKOUT_MS,
} from "./constants";
import { comparePassword } from "./password";

export type VerifiedUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

export type VerifyCredentialsResult =
  | { ok: true; user: VerifiedUser }
  | { ok: false; reason: "invalid" | "locked" | "unavailable" };

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<VerifyCredentialsResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "unavailable" };
  }

  const normalised = email.trim().toLowerCase();
  if (!normalised || !password) {
    return { ok: false, reason: "invalid" };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalised },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      passwordHash: true,
      failedLoginCount: true,
      lockedUntil: true,
    },
  });

  if (!user || !user.isActive) {
    return { ok: false, reason: "invalid" };
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
    return { ok: false, reason: "locked" };
  }

  const lockExpired = Boolean(
    user.lockedUntil && user.lockedUntil.getTime() <= now.getTime(),
  );
  const matches = await comparePassword(password, user.passwordHash);

  if (matches) {
    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }
    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  const nextCount = lockExpired ? 1 : user.failedLoginCount + 1;
  const lockedUntil =
    nextCount >= LOGIN_LOCKOUT_MAX_ATTEMPTS
      ? new Date(now.getTime() + LOGIN_LOCKOUT_MS)
      : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: nextCount,
      lockedUntil,
    },
  });

  return { ok: false, reason: "invalid" };
}
