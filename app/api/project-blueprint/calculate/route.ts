import { NextResponse } from "next/server";
import { z } from "zod";

import { trackBlueprintEvent } from "@/lib/project-blueprint/analytics/events";
import { normalizeAnswers } from "@/lib/project-blueprint/answers";
import { calculateEstimate } from "@/lib/project-blueprint/engine";
import { PLACEHOLDER_PRICING_CONFIG } from "@/lib/project-blueprint/engine/config/placeholder";

const bodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  sessionId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid estimate request.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const answers = normalizeAnswers(parsed.data.answers);
    const { publicResult, privateTrace } = calculateEstimate(
      answers,
      PLACEHOLDER_PRICING_CONFIG,
    );

    // privateTrace is retained server-side only in persistence layer;
    // this response returns the public result exclusively.
    void privateTrace;

    void trackBlueprintEvent(
      "estimator_generated",
      {
        usingPlaceholderConfiguration: PLACEHOLDER_PRICING_CONFIG.isPlaceholder,
        discoveryFirst: Boolean(publicResult.discoveryFirst?.recommended),
        confidenceLevel: publicResult.confidence?.level,
      },
      { sessionId: parsed.data.sessionId },
    ).catch(() => undefined);

    return NextResponse.json({
      result: publicResult,
      usingPlaceholderConfiguration: PLACEHOLDER_PRICING_CONFIG.isPlaceholder,
    });
  } catch (error) {
    console.error("estimate calculate failed", error);
    return NextResponse.json(
      { error: "Unable to build the planning estimate right now." },
      { status: 500 },
    );
  }
}
