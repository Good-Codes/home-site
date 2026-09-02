import { NextResponse } from "next/server";

import { trackBlueprintEvent } from "@/lib/project-blueprint/analytics/events";
import { intakeRequestSchema } from "@/lib/project-blueprint/intake/request";
import {
  checkIntakeRateLimit,
  clientKeyFromRequest,
  runIntake,
} from "@/lib/project-blueprint/intake";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const key = clientKeyFromRequest(request);
    if (!checkIntakeRateLimit(key)) {
      return NextResponse.json(
        { error: "Too many estimate requests. Please wait a few minutes." },
        { status: 429 },
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = intakeRequestSchema.safeParse(json);
    if (!parsed.success) {
      const ideaIssue = parsed.error.issues.some(
        (issue) => issue.path[0] === "ideaText",
      );
      return NextResponse.json(
        {
          error: ideaIssue
            ? "Please describe the idea in a short paragraph (at least a sentence or two)."
            : "We could not review the idea. Please try again.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await runIntake({
      ideaText: parsed.data.ideaText,
      round: parsed.data.round,
      clarifications: parsed.data.clarifications ?? undefined,
      previousAnswers: parsed.data.previousAnswers ?? undefined,
    });

    void trackBlueprintEvent(
      result.status === "needs_clarification"
        ? "intake_clarification_requested"
        : result.status === "website_handoff"
          ? "intake_website_handoff"
          : "intake_ready",
      {
        usedFallback: result.usedFallback,
        round: result.round,
        questionCount: result.clarifyingQuestions.length,
      },
      { sessionId: parsed.data.sessionId },
    ).catch(() => undefined);

    return NextResponse.json(result);
  } catch (error) {
    console.error("intake failed", error);
    return NextResponse.json(
      { error: "Unable to review the idea right now. Please try again." },
      { status: 500 },
    );
  }
}
