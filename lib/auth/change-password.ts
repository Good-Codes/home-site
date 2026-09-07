import "server-only";

import { isDatabaseConfigured, prisma } from "@/lib/db";

import { PASSWORD_MIN_LENGTH } from "./constants";
import {
  comparePassword,
  hashPassword,
  isPasswordLongEnough,
} from "./password";

export class ChangePasswordError extends Error {
  constructor(
    message: string,
    readonly code: "VALIDATION" | "UNAUTHORIZED" | "UNAVAILABLE",
  ) {
    super(message);
    this.name = "ChangePasswordError";
  }
}

export type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function changePassword(
  input: ChangePasswordInput,
): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new ChangePasswordError(
      "Accounts are temporarily unavailable.",
      "UNAVAILABLE",
    );
  }

  if (input.newPassword !== input.confirmPassword) {
    throw new ChangePasswordError("Passwords do not match.", "VALIDATION");
  }

  if (!isPasswordLongEnough(input.newPassword)) {
    throw new ChangePasswordError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      "VALIDATION",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new ChangePasswordError("Current password is incorrect.", "UNAUTHORIZED");
  }

  const currentMatches = await comparePassword(
    input.currentPassword,
    user.passwordHash,
  );
  if (!currentMatches) {
    throw new ChangePasswordError(
      "Current password is incorrect.",
      "UNAUTHORIZED",
    );
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
}
