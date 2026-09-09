import { NextResponse } from "next/server";
import { z } from "zod";

import { ChangePasswordError, changePassword } from "@/lib/auth/change-password";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/constants";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import { requireAdmin } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(200),
  confirmPassword: z.string().min(PASSWORD_MIN_LENGTH).max(200),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const key = `admin-change-password:${auth.admin.userId}:${clientKeyFromRequest(request)}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many password change attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Check your details. Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      },
      { status: 400 },
    );
  }

  try {
    await changePassword({
      userId: auth.admin.userId,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      confirmPassword: parsed.data.confirmPassword,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ChangePasswordError) {
      const status =
        error.code === "UNAUTHORIZED"
          ? 401
          : error.code === "UNAVAILABLE"
            ? 503
            : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("admin change password failed", error);
    return NextResponse.json(
      { error: "Unable to update your password right now." },
      { status: 500 },
    );
  }
}
