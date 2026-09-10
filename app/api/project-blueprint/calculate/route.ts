import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { trackBlueprintEvent } from "@/lib/project-blueprint/analytics/events";
import { normalizeAnswers } from "@/lib/project-blueprint/answers";
import { requireUser } from "@/lib/project-blueprint/auth/admin";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { runAiEstimate } from "@/lib/project-blueprint/estimate/run";
import { checkEstimateRateLimit } from "@/lib/project-blueprint/estimate/rate-limit";
import { clientKeyFromRequest } from "@/lib/project-blueprint/intake/rate-limit";
import type { IntakeConcept } from "@/lib/project-blueprint/types";

const conceptSchema = z.object({
  headline: z.string().max(180),
  summary: z.string().max(1600),
  whoItsFor: z.string().max(500),
  coreCapabilities: z.array(z.string().max(160)).max(12),
  assumptions: z.array(z.string().max(280)).max(10),
});

const bodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  estimateId: z.string().uuid().optional(),
  concept: conceptSchema.nullable().optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const key = `${auth.user.id}:${clientKeyFromRequest(request)}`;
    if (!checkEstimateRateLimit(key)) {
      return NextResponse.json(
        { error: "Too many estimate requests. Please wait a few minutes." },
        { status: 429 },
      );
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid estimate request.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const answers = normalizeAnswers(parsed.data.answers);
    const concept = (parsed.data.concept as IntakeConcept | undefined) ?? null;
    const estimate = await runAiEstimate({
      answers,
      concept,
      estimateId: parsed.data.estimateId,
    });

    if (!estimate.ok) {
      const status = estimate.code === "website_handoff" ? 400 : 503;
      return NextResponse.json(
        { error: estimate.error, code: estimate.code },
        { status },
      );
    }

    let publicPayload = estimate.publicResult;
    let estimateId = parsed.data.estimateId ?? null;
    if (isDatabaseConfigured()) {
      try {
        if (estimateId) {
          const owned = await prisma.estimate.findFirst({
            where: { id: estimateId, userId: auth.user.id },
            select: { id: true },
          });
          if (!owned) {
            return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
          }
        } else {
          const created = await prisma.estimate.create({
            data: {
              userId: auth.user.id,
              answers: answers as Prisma.InputJsonValue,
              concept: concept
                ? (concept as Prisma.InputJsonValue)
                : undefined,
              status: "CALCULATED",
              lastScreen: "results",
            },
          });
          estimateId = created.id;
        }

        const resultRow = await prisma.estimateResult.create({
          data: {
            estimateId: estimateId!,
            publicResult: estimate.publicResult as Prisma.InputJsonValue,
            calculationTrace: estimate.privateTrace as Prisma.InputJsonValue,
            checksum: estimate.privateTrace.inputHash,
            isDiscoveryFirst: Boolean(estimate.publicResult.discoveryRecommended),
          },
        });

        await prisma.estimate.update({
          where: { id: estimateId! },
          data: {
            answers: answers as Prisma.InputJsonValue,
            ...(concept ? { concept: concept as Prisma.InputJsonValue } : {}),
            status: "CALCULATED",
            lastScreen: "results",
          },
        });

        publicPayload = {
          ...estimate.publicResult,
          estimateId: resultRow.id,
        };
      } catch (error) {
        console.error("estimate persist failed", error);
      }
    }

    void trackBlueprintEvent(
      "estimator_generated",
      {
        usingPlaceholderConfiguration: Boolean(
          publicPayload.usingPlaceholderConfiguration,
        ),
        discoveryFirst: Boolean(publicPayload.discoveryRecommended),
        confidenceLevel: publicPayload.confidence?.level,
        promptVersion: estimate.privateTrace.promptVersion,
      },
      { estimateId },
    ).catch(() => undefined);

    return NextResponse.json({
      result: publicPayload,
      estimateId,
      usingPlaceholderConfiguration: Boolean(
        publicPayload.usingPlaceholderConfiguration,
      ),
    });
  } catch (error) {
    console.error("estimate calculate failed", error);
    return NextResponse.json(
      { error: "Unable to build the planning estimate right now." },
      { status: 500 },
    );
  }
}
