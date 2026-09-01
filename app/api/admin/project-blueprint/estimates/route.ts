import { NextResponse } from "next/server";

import { requireAdmin, hasServiceRole } from "@/lib/project-blueprint/auth/admin";
import {
  DEMO_ESTIMATE_LIST,
  type AdminEstimateListItem,
} from "@/lib/project-blueprint/admin/demo-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatZarRange } from "@/lib/project-blueprint/format";
import type { MoneyRange } from "@/lib/project-blueprint/types";

export const dynamic = "force-dynamic";

function moneyRange(value: unknown): MoneyRange | null {
  if (
    value &&
    typeof value === "object" &&
    "low" in value &&
    "high" in value
  ) {
    const v = value as MoneyRange;
    return { low: Number(v.low) || 0, likely: Number(v.likely) || 0, high: Number(v.high) || 0 };
  }
  return null;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.admin.isDemo || !hasServiceRole()) {
    return NextResponse.json({
      estimates: DEMO_ESTIMATE_LIST,
      usingPlaceholderConfiguration: true,
      demo: true,
      warning:
        "PLACEHOLDER — Supabase unset or service role missing. Showing demo inbox data.",
    });
  }

  try {
    const admin = createAdminClient();
    const { data: results, error } = await admin
      .from("estimate_results")
      .select(
        `
        id,
        created_at,
        is_discovery_first,
        public_result,
        estimate_sessions (
          id,
          status,
          leads (
            name,
            company,
            preferred_next_step
          )
        ),
        pricing_versions (
          version,
          is_placeholder
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("admin estimates list failed", error);
      return NextResponse.json(
        { error: "Unable to load estimates." },
        { status: 500 },
      );
    }

    const estimates: AdminEstimateListItem[] = (results ?? []).map((row) => {
      const publicResult =
        row.public_result && typeof row.public_result === "object"
          ? (row.public_result as Record<string, unknown>)
          : {};
      const recommended =
        (publicResult.recommendedScenario as Record<string, unknown> | undefined) ??
        {};
      const range = moneyRange(recommended.range);
      const confidence =
        publicResult.confidence && typeof publicResult.confidence === "object"
          ? String(
              (publicResult.confidence as { level?: string }).level ?? "early",
            )
          : "early";
      const session = Array.isArray(row.estimate_sessions)
        ? row.estimate_sessions[0]
        : row.estimate_sessions;
      const leadRaw =
        session && typeof session === "object" && "leads" in session
          ? (session as { leads: unknown }).leads
          : null;
      const lead = Array.isArray(leadRaw) ? leadRaw[0] : leadRaw;
      const pricing = Array.isArray(row.pricing_versions)
        ? row.pricing_versions[0]
        : row.pricing_versions;

      return {
        id: row.id as string,
        status: String(
          (session as { status?: string } | null)?.status ?? "calculated",
        ),
        clientName:
          lead && typeof lead === "object" && "name" in lead
            ? String((lead as { name: string }).name)
            : null,
        company:
          lead && typeof lead === "object" && "company" in lead
            ? ((lead as { company: string | null }).company ?? null)
            : null,
        rangeDisplay: range
          ? formatZarRange(
              range,
              typeof recommended.rangeDisplay === "string"
                ? recommended.rangeDisplay
                : undefined,
            )
          : "—",
        confidence,
        nextStep: String(
          publicResult.nextStepRecommendation ??
            publicResult.recommendedNextStep ??
            (row.is_discovery_first
              ? "Discovery workshop recommended"
              : "Specialist review"),
        ),
        createdAt: String(row.created_at),
        usingPlaceholderConfiguration: Boolean(
          (pricing as { is_placeholder?: boolean } | null)?.is_placeholder ??
            publicResult.usingPlaceholderConfiguration,
        ),
      };
    });

    return NextResponse.json({
      estimates,
      usingPlaceholderConfiguration: estimates.some(
        (e) => e.usingPlaceholderConfiguration,
      ),
      demo: false,
    });
  } catch (error) {
    console.error("admin estimates list error", error);
    return NextResponse.json(
      {
        estimates: DEMO_ESTIMATE_LIST,
        usingPlaceholderConfiguration: true,
        demo: true,
        warning: "PLACEHOLDER — falling back to demo inbox data.",
      },
      { status: 200 },
    );
  }
}
