import "server-only";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { summarizePublicResult } from "@/lib/account/estimates";
import {
  PROFILE_SELECT,
  toCustomerProfile,
  type CustomerProfile,
} from "@/lib/account/profile";

import { PASSWORD_MIN_LENGTH } from "./constants";
import { isAccountLocked } from "./lock";
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
      data: { adminLocked: false, failedLoginCount: 0, lockedUntil: null },
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

export class LockUserError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "FORBIDDEN" | "UNAVAILABLE",
  ) {
    super(message);
    this.name = "LockUserError";
  }
}

export async function lockUser(input: {
  actorUserId: string;
  userId: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new LockUserError(
      "Accounts are temporarily unavailable.",
      "UNAVAILABLE",
    );
  }

  if (input.actorUserId === input.userId) {
    throw new LockUserError("You cannot lock your own account.", "FORBIDDEN");
  }

  const existing = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!existing) {
    throw new LockUserError("User not found.", "NOT_FOUND");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: existing.id },
      data: { adminLocked: true },
    }),
    prisma.auditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        action: "admin.lock_user",
        entityType: "User",
        entityId: existing.id,
      },
    }),
  ]);
}

export type AdminUserEstimateItem = {
  estimateId: string;
  resultId: string | null;
  status: string;
  savedToProfile: boolean;
  productSummary: string;
  rangeLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserDetail = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  adminLocked: boolean;
  locked: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  createdAt: string;
  profile: CustomerProfile;
  estimates: AdminUserEstimateItem[];
};

export async function getAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail | null> {
  if (!isDatabaseConfigured()) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      adminLocked: true,
      failedLoginCount: true,
      lockedUntil: true,
      createdAt: true,
      ...PROFILE_SELECT,
      estimates: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          status: true,
          savedToProfileAt: true,
          createdAt: true,
          updatedAt: true,
          results: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              publicResult: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    adminLocked: user.adminLocked,
    locked: isAccountLocked(user),
    failedLoginCount: user.failedLoginCount,
    lockedUntil: user.lockedUntil?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    profile: toCustomerProfile(user),
    estimates: user.estimates.map((estimate) => {
      const latest = estimate.results[0];
      const summary = summarizePublicResult(latest?.publicResult);
      return {
        estimateId: estimate.id,
        resultId: latest?.id ?? null,
        status: estimate.status.toLowerCase(),
        savedToProfile: Boolean(estimate.savedToProfileAt),
        productSummary: summary.productSummary,
        rangeLabel: summary.rangeLabel,
        createdAt: estimate.createdAt.toISOString(),
        updatedAt: estimate.updatedAt.toISOString(),
      };
    }),
  };
}
