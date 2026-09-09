import "server-only";

import { isDatabaseConfigured, prisma } from "@/lib/db";

import { PASSWORD_MIN_LENGTH } from "./constants";
import { hashPassword, isPasswordLongEnough } from "./password";

export class AdminSetPasswordError extends Error {
  constructor(
    message: string,
    readonly code: "VALIDATION" | "NOT_FOUND" | "UNAVAILABLE",
  ) {
    super(message);
    this.name = "AdminSetPasswordError";
  }
}

export async function adminSetUserPassword(input: {
  actorUserId: string;
  userId: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new AdminSetPasswordError(
      "Accounts are temporarily unavailable.",
      "UNAVAILABLE",
    );
  }

  if (input.newPassword !== input.confirmPassword) {
    throw new AdminSetPasswordError("Passwords do not match.", "VALIDATION");
  }

  if (!isPasswordLongEnough(input.newPassword)) {
    throw new AdminSetPasswordError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      "VALIDATION",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!existing) {
    throw new AdminSetPasswordError("User not found.", "NOT_FOUND");
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash },
    }),
    prisma.auditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        action: "admin.set_password",
        entityType: "User",
        entityId: existing.id,
      },
    }),
  ]);
}

export class UnlockUserError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "UNAVAILABLE",
  ) {
    super(message);
    this.name = "UnlockUserError";
  }
}

export async function unlockUser(input: {
  actorUserId: string;
  userId: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new UnlockUserError(
      "Accounts are temporarily unavailable.",
      "UNAVAILABLE",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!existing) {
    throw new UnlockUserError("User not found.", "NOT_FOUND");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: existing.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    }),
    prisma.auditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        action: "admin.unlock_user",
        entityType: "User",
        entityId: existing.id,
      },
    }),
  ]);
}
