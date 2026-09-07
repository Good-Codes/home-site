import "server-only";

import { UserRole } from "@prisma/client";

import { isDatabaseConfigured, prisma } from "@/lib/db";

import { PASSWORD_MIN_LENGTH } from "./constants";
import { hashPassword, isPasswordLongEnough } from "./password";

export class RegisterError extends Error {
  constructor(
    message: string,
    readonly code: "VALIDATION" | "CONFLICT" | "UNAVAILABLE",
  ) {
    super(message);
    this.name = "RegisterError";
  }
}

export type RegisterCustomerInput = {
  email: string;
  password: string;
  name?: string | null;
  /** Ignored. Public signup is always CUSTOMER. */
  role?: unknown;
};

export type RegisteredCustomer = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

export async function registerCustomer(
  input: RegisterCustomerInput,
): Promise<RegisteredCustomer> {
  if (!isDatabaseConfigured()) {
    throw new RegisterError(
      "Accounts are temporarily unavailable.",
      "UNAVAILABLE",
    );
  }

  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || null;

  if (!email || !email.includes("@") || email.length > 254) {
    throw new RegisterError("Enter a valid email address.", "VALIDATION");
  }
  if (!isPasswordLongEnough(input.password)) {
    throw new RegisterError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      "VALIDATION",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    throw new RegisterError(
      "An account with this email already exists.",
      "CONFLICT",
    );
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: UserRole.CUSTOMER,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return user;
}
