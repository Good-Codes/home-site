import { NextResponse } from "next/server";
import { z } from "zod";

import {
  AdminSetPasswordError,
  adminSetUserPassword,
} from "@/lib/auth/admin-users";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/constants";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import { requireAdmin } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(200),
  confirmPassword: z.string().min(PASSWORD_MIN_LENGTH).max(200),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const key = `admin-set-password:${auth.admin.userId}:${clientKeyFromRequest(request)}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many password changes. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const rawParams = await context.params;
  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: `Check your details. Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      },
      { status: 400 },
    );
  }

  try {
    await adminSetUserPassword({
      actorUserId: auth.admin.userId,
      userId: parsedParams.data.id,
      newPassword: parsedBody.data.newPassword,
      confirmPassword: parsedBody.data.confirmPassword,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminSetPasswordError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "UNAVAILABLE"
            ? 503
            : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("admin set password failed", error);
    return NextResponse.json(
      { error: "Unable to update that password right now." },
      { status: 500 },
    );
  }
}
