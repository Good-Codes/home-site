import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, hasServiceRole } from "@/lib/project-blueprint/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

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

const DEMO_RECORDS: CalibrationListItem[] = [];

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.admin.isDemo || !hasServiceRole()) {
    return NextResponse.json({
      records: DEMO_RECORDS,
      demo: true,
      warning:
        "PLACEHOLDER — Supabase unset or service role missing. Calibration list is empty demo mode.",
    });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("calibration_records")
      .select(
        "id, estimate_result_id, quotation_id, actual_effort_hours, actual_duration_weeks, variance_reasons, recommendations, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("calibration list failed", error);
      return NextResponse.json(
        { error: "Unable to load calibration records." },
        { status: 500 },
      );
    }

    const records: CalibrationListItem[] = (data ?? []).map((row) => ({
      id: String(row.id),
      estimateResultId: (row.estimate_result_id as string | null) ?? null,
      quotationId: (row.quotation_id as string | null) ?? null,
      actualEffortHours:
        row.actual_effort_hours == null
          ? null
          : Number(row.actual_effort_hours),
      actualDurationWeeks:
        row.actual_duration_weeks == null
          ? null
          : Number(row.actual_duration_weeks),
      varianceReasons: Array.isArray(row.variance_reasons)
        ? (row.variance_reasons as string[])
        : [],
      recommendations: (row.recommendations as string | null) ?? null,
      createdAt: String(row.created_at),
    }));

    return NextResponse.json({ records, demo: false });
  } catch (error) {
    console.error("calibration GET error", error);
    return NextResponse.json({
      records: DEMO_RECORDS,
      demo: true,
      warning: "PLACEHOLDER — falling back to demo calibration list.",
    });
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
  if (
    body.estimateResultId &&
    body.estimateResultId.length > 0 &&
    !z.string().uuid().safeParse(body.estimateResultId).success
  ) {
    return NextResponse.json(
      { error: "estimateResultId must be a valid UUID when provided." },
      { status: 400 },
    );
  }
  if (
    body.quotationId &&
    body.quotationId.length > 0 &&
    !z.string().uuid().safeParse(body.quotationId).success
  ) {
    return NextResponse.json(
      { error: "quotationId must be a valid UUID when provided." },
      { status: 400 },
    );
  }

  const estimateResultId = optionalUuid(body.estimateResultId);
  const quotationId = optionalUuid(body.quotationId);

  if (auth.admin.isDemo || !hasServiceRole()) {
    const id = `demo-calibration-${Date.now()}`;
    return NextResponse.json({
      ok: true,
      demo: true,
      warning:
        "PLACEHOLDER — calibration saved in-memory only (Supabase unset). Not persisted.",
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
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("calibration_records")
      .insert({
        estimate_result_id: estimateResultId,
        quotation_id: quotationId,
        actual_effort_hours: body.actualEffortHours ?? null,
        actual_duration_weeks: body.actualDurationWeeks ?? null,
        variance_reasons: body.varianceReasons,
        recommendations: body.recommendations ?? null,
        original_estimate_snapshot: body.originalEstimateSnapshot ?? {},
        reviewed_quote_snapshot: body.reviewedQuoteSnapshot ?? {},
        agreed_scope_snapshot: body.agreedScopeSnapshot ?? {},
        recorded_by: auth.admin.isDemo ? null : auth.admin.userId,
      })
      .select(
        "id, estimate_result_id, quotation_id, actual_effort_hours, actual_duration_weeks, variance_reasons, recommendations, created_at",
      )
      .single();

    if (error || !data) {
      console.error("calibration create failed", error);
      return NextResponse.json(
        { error: "Unable to save calibration record." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      demo: false,
      record: {
        id: String(data.id),
        estimateResultId: (data.estimate_result_id as string | null) ?? null,
        quotationId: (data.quotation_id as string | null) ?? null,
        actualEffortHours:
          data.actual_effort_hours == null
            ? null
            : Number(data.actual_effort_hours),
        actualDurationWeeks:
          data.actual_duration_weeks == null
            ? null
            : Number(data.actual_duration_weeks),
        varianceReasons: Array.isArray(data.variance_reasons)
          ? (data.variance_reasons as string[])
          : [],
        recommendations: (data.recommendations as string | null) ?? null,
        createdAt: String(data.created_at),
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
