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

const idSchema = z.string().uuid();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireCustomer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  const key = `unsave-estimate:${auth.user.id}:${clientKeyFromRequest(request)}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes." },
      { status: 429 },
    );
  }

  try {
    await unsaveEstimateFromProfile({
      userId: auth.user.id,
      estimateId: parsed.data,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ProfileEstimateError) {
      const status = error.code === "UNAVAILABLE" ? 503 : 404;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("unsave estimate failed", error);
    return NextResponse.json(
      { error: "Unable to remove this estimate right now." },
      { status: 500 },
    );
  }
}
