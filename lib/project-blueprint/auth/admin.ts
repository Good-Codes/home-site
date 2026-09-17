import "server-only";

import type { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { isAccountLocked } from "@/lib/auth/lock";
import { isStaffRole } from "@/lib/auth/roles";
import { isDatabaseConfigured, prisma } from "@/lib/db";

export type AppUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
};

export async function requireUser(): Promise<
  { ok: true; user: AppUser } | { ok: false; status: 401; error: string }
> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  if (isDatabaseConfigured()) {
    const row = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        adminLocked: true,
        lockedUntil: true,
      },
    });
    if (!row || !row.isActive || isAccountLocked(row)) {
      return { ok: false, status: 401, error: "Authentication required." };
    }
    return {
      ok: true,
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
      },
    };
  }

  return {
    ok: true,
    user: {
      id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      role: session.user.role ?? "CUSTOMER",
    },
  };
}

export type AdminContext = {
  userId: string;
  email: string | null;
  displayName: string | null;
  isDemo: boolean;
};

/**
 * Require an authenticated customer (not admin).
 */
export async function requireCustomer(): Promise<
  | { ok: true; user: AppUser }
  | { ok: false; status: 401 | 403; error: string }
> {
  const session = await requireUser();
  if (!session.ok) {
    return session;
  }
  if (session.user.role !== "CUSTOMER") {
    return { ok: false, status: 403, error: "Customer access required." };
  }

  if (!isDatabaseConfigured()) {
    return session;
  }

  const row = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      adminLocked: true,
      lockedUntil: true,
    },
  });
  if (
    !row ||
    !row.isActive ||
    row.role !== "CUSTOMER" ||
    isAccountLocked(row)
  ) {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  return {
    ok: true,
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
    },
  };
}

/**
 * Require an authenticated Admin.
 */
export async function requireAdmin(): Promise<
  | { ok: true; admin: AdminContext }
  | { ok: false; status: 401 | 403; error: string }
> {
  const session = await requireUser();
  if (!session.ok) {
    return session;
  }

  if (!isStaffRole(session.user.role)) {
    return { ok: false, status: 403, error: "Admin access required." };
  }

  if (isDatabaseConfigured()) {
    const row = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        isActive: true,
        adminLocked: true,
        lockedUntil: true,
      },
    });
    if (
      !row ||
      !row.isActive ||
      !isStaffRole(row.role) ||
      isAccountLocked(row)
    ) {
      return { ok: false, status: 401, error: "Authentication required." };
    }
  }

  return {
    ok: true,
    admin: {
      userId: session.user.id,
      email: session.user.email,
      displayName: session.user.name,
      isDemo: false,
    },
  };
}
