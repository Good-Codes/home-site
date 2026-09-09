import { NextResponse } from "next/server";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/project-blueprint/auth/admin";
import {
  DEMO_ESTIMATE_LIST,
  type AdminEstimateListItem,
} from "@/lib/project-blueprint/admin/demo-data";
import { formatZarRange } from "@/lib/project-blueprint/format";
import type { MoneyRange } from "@/lib/project-blueprint/types";

export const dynamic = "force-dynamic";

function moneyRange(value: unknown): MoneyRange | null {
  if (value && typeof value === "object" && "low" in value && "high" in value) {
    const v = value as MoneyRange;
    return {
      low: Number(v.low) || 0,
      likely: Number(v.likely) || 0,
      high: Number(v.high) || 0,
    };
  }
  return null;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      estimates: DEMO_ESTIMATE_LIST,
      usingPlaceholderConfiguration: true,
      demo: true,
      warning: "Database unset. Showing demo inbox data.",
    });
  }

  try {
    const results = await prisma.estimateResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        estimate: {
          select: {
            status: true,
            lead: {
              select: {
                name: true,
                company: true,
                preferredNextStep: true,
              },
            },
          },
        },
      },
    });

    const estimates: AdminEstimateListItem[] = results.map((row) => {
      const publicResult =
        row.publicResult && typeof row.publicResult === "object"
          ? (row.publicResult as Record<string, unknown>)
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
      const lead = row.estimate.lead;

      return {
        id: row.id,
        status: row.estimate.status.toLowerCase(),
        clientName: lead?.name ?? null,
        company: lead?.company ?? null,
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
            (row.isDiscoveryFirst
              ? "Discovery workshop recommended"
              : "Specialist review"),
        ),
        createdAt: row.createdAt.toISOString(),
        usingPlaceholderConfiguration: Boolean(
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
      { error: "Unable to load estimates." },
      { status: 500 },
    );
  }
}
