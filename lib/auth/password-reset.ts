import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import { runtimeEnv } from "@/lib/env/runtime";

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  PASSWORD_RESET_TTL_MS,
} from "./constants";
import { hashPassword, isPasswordLongEnough } from "./password";

export class PasswordResetError extends Error {
  constructor(
    message: string,
    readonly code: "VALIDATION" | "INVALID_TOKEN" | "UNAVAILABLE",
  ) {
    super(message);
    this.name = "PasswordResetError";
  }
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createResetToken(): string {
  return randomBytes(32).toString("base64url");
}

function siteOrigin(): string {
  return (
    runtimeEnv("AUTH_URL")?.replace(/\/$/, "") ||
    runtimeEnv("NEXT_PUBLIC_SITE_URL")?.replace(/\/$/, "") ||
    "https://www.goodcode.co.za"
  );
}

function genericSuccess(): { ok: true; message: string } {
  return { ok: true, message: PASSWORD_RESET_SUCCESS_MESSAGE };
}

export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true; message: string }> {
  if (!isDatabaseConfigured()) {
    return genericSuccess();
  }

  const normalised = email.trim().toLowerCase();
  if (!normalised || !normalised.includes("@") || normalised.length > 254) {
    throw new PasswordResetError("Enter a valid email address.", "VALIDATION");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalised },
    select: { id: true, email: true, isActive: true },
  });

  if (!user?.isActive) {
    return genericSuccess();
  }

  const rawToken = createResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
  });

  const resetUrl = `${siteOrigin()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const sent = await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    idempotencyKey: `password-reset:${user.id}:${tokenHash.slice(0, 16)}`,
  });
  if (!sent.ok) {
    console.error("password reset email failed", sent.error);
  }

  return genericSuccess();
}

export async function resetPassword(input: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new PasswordResetError(
      "Accounts are temporarily unavailable.",
      "UNAVAILABLE",
    );
  }

  if (input.newPassword !== input.confirmPassword) {
    throw new PasswordResetError("Passwords do not match.", "VALIDATION");
  }
  if (!isPasswordLongEnough(input.newPassword)) {
    throw new PasswordResetError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      "VALIDATION",
    );
  }

  const token = input.token.trim();
  if (!token) {
    throw new PasswordResetError(
      "This reset link is invalid or has expired.",
      "INVALID_TOKEN",
    );
  }

  const tokenHash = hashResetToken(token);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const row = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { id: true, isActive: true } },
      },
    });

    if (
      !row ||
      row.usedAt ||
      row.expiresAt <= now ||
      !row.user.isActive
    ) {
      throw new PasswordResetError(
        "This reset link is invalid or has expired.",
        "INVALID_TOKEN",
      );
    }

    const passwordHash = await hashPassword(input.newPassword);
    await tx.user.update({
      where: { id: row.userId },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    await tx.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: now },
    });
    await tx.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: now },
    });
  });
}
