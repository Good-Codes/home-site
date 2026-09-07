import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { trackBlueprintEvent } from "@/lib/project-blueprint/analytics/events";
import { normalizeAnswers } from "@/lib/project-blueprint/answers";
import { calculateEstimate } from "@/lib/project-blueprint/engine";
import { PLACEHOLDER_PRICING_CONFIG } from "@/lib/project-blueprint/engine/config/placeholder";
import { requireUser } from "@/lib/project-blueprint/auth/admin";
import { isDatabaseConfigured, prisma } from "@/lib/db";

const bodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  estimateId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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

    let publicPayload = publicResult;
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
              status: "CALCULATED",
              lastScreen: "results",
            },
          });
          estimateId = created.id;
        }

        const resultRow = await prisma.estimateResult.create({
          data: {
            estimateId: estimateId!,
            publicResult: publicResult as Prisma.InputJsonValue,
            calculationTrace: privateTrace as Prisma.InputJsonValue,
            checksum: String(
              (privateTrace as { combinedChecksum?: string })?.combinedChecksum ??
                publicResult.estimateId,
            ),
            isDiscoveryFirst: Boolean(publicResult.discoveryFirst?.recommended),
          },
        });

        await prisma.estimate.update({
          where: { id: estimateId! },
          data: {
            answers: answers as Prisma.InputJsonValue,
            status: "CALCULATED",
            lastScreen: "results",
          },
        });

        publicPayload = {
          ...publicResult,
          estimateId: resultRow.id,
        };
      } catch (error) {
        console.error("estimate persist failed", error);
      }
    }

    void trackBlueprintEvent(
      "estimator_generated",
      {
        usingPlaceholderConfiguration: PLACEHOLDER_PRICING_CONFIG.isPlaceholder,
        discoveryFirst: Boolean(publicPayload.discoveryFirst?.recommended),
        confidenceLevel: publicPayload.confidence?.level,
      },
      { estimateId },
    ).catch(() => undefined);

    return NextResponse.json({
      result: publicPayload,
      estimateId,
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
