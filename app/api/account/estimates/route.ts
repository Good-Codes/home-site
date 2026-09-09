import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ProfileEstimateError,
  saveEstimateToProfile,
} from "@/lib/account/estimates";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import { requireCustomer } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  estimateId: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireCustomer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const key = `save-estimate:${auth.user.id}:${clientKeyFromRequest(request)}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many save attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  try {
    const result = await saveEstimateToProfile({
      userId: auth.user.id,
      estimateId: parsed.data.estimateId,
    });
    return NextResponse.json({ ok: true, alreadySaved: result.alreadySaved });
  } catch (error) {
    if (error instanceof ProfileEstimateError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "LIMIT"
            ? 409
            : error.code === "UNAVAILABLE"
              ? 503
              : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("save estimate to profile failed", error);
    return NextResponse.json(
      { error: "Unable to save that estimate right now." },
      { status: 500 },
    );
  }
}
