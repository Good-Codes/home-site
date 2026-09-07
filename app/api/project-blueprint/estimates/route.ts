import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/project-blueprint/auth/admin";
import { isDatabaseConfigured, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const putSchema = z.object({
  estimateId: z.string().uuid().optional(),
  answers: z.record(z.string(), z.unknown()).default({}),
  concept: z.unknown().optional(),
  lastScreen: z.string().max(80).optional(),
});

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ estimate: null });
  }

  const estimate = await prisma.estimate.findFirst({
    where: { userId: auth.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      results: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, publicResult: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ estimate });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const json = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid estimate payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Progress could not be saved." },
      { status: 503 },
    );
  }

  const answers = parsed.data.answers as Prisma.InputJsonValue;
  const concept =
    parsed.data.concept === undefined
      ? undefined
      : (parsed.data.concept as Prisma.InputJsonValue);
  const lastScreen = parsed.data.lastScreen ?? "review";

  try {
    if (parsed.data.estimateId) {
      const existing = await prisma.estimate.findFirst({
        where: { id: parsed.data.estimateId, userId: auth.user.id },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
      }

      const latestRevision = await prisma.answerRevision.findFirst({
        where: { estimateId: existing.id },
        orderBy: { revision: "desc" },
        select: { revision: true },
      });

      const [estimate] = await prisma.$transaction([
        prisma.estimate.update({
          where: { id: existing.id },
          data: {
            answers,
            ...(concept !== undefined ? { concept } : {}),
            lastScreen,
          },
        }),
        prisma.answerRevision.create({
          data: {
            estimateId: existing.id,
            revision: (latestRevision?.revision ?? 0) + 1,
            answers,
            source: "autosave",
          },
        }),
      ]);

      return NextResponse.json({ estimateId: estimate.id });
    }

    const estimate = await prisma.estimate.create({
      data: {
        userId: auth.user.id,
        answers,
        concept: concept ?? Prisma.JsonNull,
        lastScreen,
        status: "IN_PROGRESS",
      },
    });

    await prisma.answerRevision.create({
      data: {
        estimateId: estimate.id,
        revision: 1,
        answers,
        source: "autosave",
      },
    });

    return NextResponse.json({ estimateId: estimate.id });
  } catch (error) {
    console.error("estimate save failed", error);
    return NextResponse.json(
      { error: "Progress could not be saved." },
      { status: 500 },
    );
  }
}
