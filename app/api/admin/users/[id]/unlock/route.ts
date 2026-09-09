import { NextResponse } from "next/server";
import { z } from "zod";

import { UnlockUserError, unlockUser } from "@/lib/auth/admin-users";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import { requireAdmin } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const key = `admin-unlock:${auth.admin.userId}:${clientKeyFromRequest(request)}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many unlock attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const rawParams = await context.params;
  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    await unlockUser({
      actorUserId: auth.admin.userId,
      userId: parsedParams.data.id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnlockUserError) {
      const status = error.code === "NOT_FOUND" ? 404 : 503;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("admin unlock failed", error);
    return NextResponse.json(
      { error: "Unable to unlock that account right now." },
      { status: 500 },
    );
  }
}
