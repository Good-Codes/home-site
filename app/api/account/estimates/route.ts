import { NextResponse } from "next/server";
import { z } from "zod";

import {
  listSavedEstimates,
  ProfileEstimateError,
  saveEstimateToProfile,
} from "@/lib/account/estimates";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import { requireCustomer } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

const saveSchema = z.object({
  estimateId: z.string().uuid(),
});

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const estimates = await listSavedEstimates(auth.user.id);
  return NextResponse.json({
    estimates,
    savedCount: estimates.length,
  });
}

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
  const parsed = saveSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  try {
    const result = await saveEstimateToProfile({
      userId: auth.user.id,
      estimateId: parsed.data.estimateId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ProfileEstimateError) {
      const status =
        error.code === "CAP"
          ? 409
          : error.code === "UNAVAILABLE"
            ? 503
            : 404;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error("save estimate failed", error);
    return NextResponse.json(
      { error: "Unable to save this estimate right now." },
      { status: 500 },
    );
  }
}
