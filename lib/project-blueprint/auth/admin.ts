import "server-only";

import type { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";

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

export type AdminRole = "reviewer" | "admin" | "approver";

export type AdminContext = {
  userId: string;
  email: string | null;
  role: AdminRole;
  displayName: string | null;
  isDemo: boolean;
};

function toAdminRole(role: UserRole): AdminRole | null {
  if (role === "REVIEWER") return "reviewer";
  if (role === "ADMIN") return "admin";
  if (role === "APPROVER") return "approver";
  return null;
}

/**
 * Require an authenticated staff user (reviewer / admin / approver).
 */
export async function requireAdmin(
  allowedRoles: AdminRole[] = ["reviewer", "admin", "approver"],
): Promise<
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

  const role = toAdminRole(session.user.role);
  if (!role || !allowedRoles.includes(role)) {
    return { ok: false, status: 403, error: "Insufficient admin role." };
  }

  return {
    ok: true,
    admin: {
      userId: session.user.id,
      email: session.user.email,
      role,
      displayName: session.user.name,
      isDemo: false,
    },
  };
}
