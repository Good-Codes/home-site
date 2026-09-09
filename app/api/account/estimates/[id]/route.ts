import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ProfileEstimateError,
  unsaveEstimateFromProfile,
} from "@/lib/account/estimates";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import { requireCustomer } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireCustomer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const key = `unsave-estimate:${auth.user.id}:${clientKeyFromRequest(request)}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many delete attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const rawParams = await context.params;
  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  try {
    await unsaveEstimateFromProfile({
      userId: auth.user.id,
      estimateId: parsedParams.data.id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ProfileEstimateError) {
      const status = error.code === "NOT_FOUND" ? 404 : 503;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("unsave estimate failed", error);
    return NextResponse.json(
      { error: "Unable to remove that estimate right now." },
      { status: 500 },
    );
  }
}
