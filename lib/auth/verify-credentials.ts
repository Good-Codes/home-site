import "server-only";

import type { UserRole } from "@prisma/client";

import { isDatabaseConfigured, prisma } from "@/lib/db";

import { comparePassword } from "./password";

export type VerifiedUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<VerifiedUser | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const normalised = email.trim().toLowerCase();
  if (!normalised || !password) {
    return null;
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
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const matches = await comparePassword(password, user.passwordHash);
  if (!matches) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
