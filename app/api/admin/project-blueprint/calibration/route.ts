import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

const VARIANCE_REASONS = [
  "scope_change",
  "underestimated_integrations",
  "client_delay",
  "discovery_gap",
  "third_party_dependency",
  "quality_bar_raised",
  "other",
] as const;

const createSchema = z.object({
  estimateResultId: z.string().max(64).optional(),
  quotationId: z.string().max(64).optional(),
  actualEffortHours: z.number().nonnegative().optional(),
  actualDurationWeeks: z.number().nonnegative().optional(),
  varianceReasons: z.array(z.enum(VARIANCE_REASONS)).default([]),
  recommendations: z.string().trim().max(4000).optional(),
  originalEstimateSnapshot: z.record(z.string(), z.unknown()).optional(),
  reviewedQuoteSnapshot: z.record(z.string(), z.unknown()).optional(),
  agreedScopeSnapshot: z.record(z.string(), z.unknown()).optional(),
});

function optionalUuid(value: string | undefined): string | null {
  if (!value || value.trim().length === 0) return null;
  const parsed = z.string().uuid().safeParse(value.trim());
  return parsed.success ? parsed.data : null;
}

export type CalibrationListItem = {
  id: string;
  estimateResultId: string | null;
  quotationId: string | null;
  actualEffortHours: number | null;
  actualDurationWeeks: number | null;
  varianceReasons: string[];
  recommendations: string | null;
  createdAt: string;
};

const EMPTY_RECORDS: CalibrationListItem[] = [];

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      records: EMPTY_RECORDS,
      demo: true,
      warning: "Database unset. Calibration list is empty.",
    });
  }

  try {
    const data = await prisma.calibrationRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        estimateResultId: true,
        quotationId: true,
        actualEffortHours: true,
        actualDurationWeeks: true,
        varianceReasons: true,
        recommendations: true,
        createdAt: true,
      },
    });

    const records: CalibrationListItem[] = data.map((row) => ({
      id: row.id,
      estimateResultId: row.estimateResultId,
      quotationId: row.quotationId,
      actualEffortHours:
        row.actualEffortHours == null ? null : Number(row.actualEffortHours),
      actualDurationWeeks:
        row.actualDurationWeeks == null ? null : Number(row.actualDurationWeeks),
      varianceReasons: Array.isArray(row.varianceReasons)
        ? (row.varianceReasons as string[])
        : [],
      recommendations: row.recommendations,
      createdAt: row.createdAt.toISOString(),
    }));

    return NextResponse.json({ records, demo: false });
  } catch (error) {
    console.error("calibration GET error", error);
    return NextResponse.json(
      { error: "Unable to load calibration records." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(["admin", "approver", "reviewer"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid calibration payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const estimateResultId = optionalUuid(body.estimateResultId);
  const quotationId = optionalUuid(body.quotationId);

  if (!isDatabaseConfigured()) {
    const id = `local-calibration-${Date.now()}`;
    return NextResponse.json({
      ok: true,
      demo: true,
      warning: "Calibration saved in-memory only (database unset). Not persisted.",
      record: {
        id,
        estimateResultId,
        quotationId,
        actualEffortHours: body.actualEffortHours ?? null,
        actualDurationWeeks: body.actualDurationWeeks ?? null,
        varianceReasons: body.varianceReasons,
        recommendations: body.recommendations ?? null,
        createdAt: new Date().toISOString(),
      } satisfies CalibrationListItem,
    });
  }

  try {
    const data = await prisma.calibrationRecord.create({
      data: {
        estimateResultId,
        quotationId,
        actualEffortHours: body.actualEffortHours ?? null,
        actualDurationWeeks: body.actualDurationWeeks ?? null,
        varianceReasons: body.varianceReasons,
        recommendations: body.recommendations ?? null,
        originalEstimateSnapshot: (body.originalEstimateSnapshot ??
          {}) as Prisma.InputJsonValue,
        reviewedQuoteSnapshot: (body.reviewedQuoteSnapshot ??
          {}) as Prisma.InputJsonValue,
        agreedScopeSnapshot: (body.agreedScopeSnapshot ??
          {}) as Prisma.InputJsonValue,
        recordedById: auth.admin.userId,
      },
      select: {
        id: true,
        estimateResultId: true,
        quotationId: true,
        actualEffortHours: true,
        actualDurationWeeks: true,
        varianceReasons: true,
        recommendations: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      demo: false,
      record: {
        id: data.id,
        estimateResultId: data.estimateResultId,
        quotationId: data.quotationId,
        actualEffortHours:
          data.actualEffortHours == null ? null : Number(data.actualEffortHours),
        actualDurationWeeks:
          data.actualDurationWeeks == null
            ? null
            : Number(data.actualDurationWeeks),
        varianceReasons: Array.isArray(data.varianceReasons)
          ? (data.varianceReasons as string[])
          : [],
        recommendations: data.recommendations,
        createdAt: data.createdAt.toISOString(),
      } satisfies CalibrationListItem,
    });
  } catch (error) {
    console.error("calibration POST error", error);
    return NextResponse.json(
      { error: "Unable to save calibration record." },
      { status: 500 },
    );
  }
}
