import "server-only";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRole = "reviewer" | "admin" | "approver";

export type AdminContext = {
  userId: string;
  email: string | null;
  role: AdminRole;
  displayName: string | null;
  /** True when Supabase is not configured and demo admin access is used. */
  isDemo: boolean;
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasServiceRole(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

const DEMO_ADMIN: AdminContext = {
  userId: "demo-admin",
  email: "demo@goodcode.local",
  role: "admin",
  displayName: "Demo Admin",
  isDemo: true,
};

/**
 * Require an authenticated admin profile.
 * When Supabase env is unset, returns a demo admin context so local UI/APIs work.
 */
export async function requireAdmin(
  allowedRoles: AdminRole[] = ["reviewer", "admin", "approver"],
): Promise<
  | { ok: true; admin: AdminContext }
  | { ok: false; status: 401 | 403; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: true, admin: DEMO_ADMIN };
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, status: 401, error: "Authentication required." };
    }

    if (!hasServiceRole()) {
      // Auth present but service role missing — treat as demo for reads.
      return {
        ok: true,
        admin: {
          userId: user.id,
          email: user.email ?? null,
          role: "admin",
          displayName: user.email ?? "Admin",
          isDemo: true,
        },
      };
    }

    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("admin_profiles")
      .select("role, display_name, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.is_active) {
      return { ok: false, status: 403, error: "Admin access required." };
    }

    const role = profile.role as AdminRole;
    if (!allowedRoles.includes(role)) {
      return { ok: false, status: 403, error: "Insufficient admin role." };
    }

    return {
      ok: true,
      admin: {
        userId: user.id,
        email: user.email ?? null,
        role,
        displayName: profile.display_name ?? null,
        isDemo: false,
      },
    };
  } catch (error) {
    console.error("requireAdmin failed", error);
    return { ok: false, status: 401, error: "Authentication required." };
  }
}
