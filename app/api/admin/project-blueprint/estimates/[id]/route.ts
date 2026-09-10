import { NextResponse } from "next/server";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { getDemoEstimateDetail } from "@/lib/project-blueprint/admin/demo-data";
import { requireAdmin } from "@/lib/project-blueprint/auth/admin";
import { buildReviewSummary } from "@/lib/project-blueprint/summary";
import { normalizeAnswers } from "@/lib/project-blueprint/answers";
import type { PublicEstimateResult } from "@/lib/project-blueprint/types";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function sanitizePublicResult(raw: Record<string, unknown>): PublicEstimateResult {
  const {
    privateTrace: _privateTrace,
    calculationTrace: _calculationTrace,
    rates: _rates,
    margins: _margins,
    roleRates: _roleRates,
    sellRates: _sellRates,
    hours: _hours,
    ...safe
  } = raw;

  void _privateTrace;
  void _calculationTrace;
  void _rates;
  void _margins;
  void _roleRates;
  void _sellRates;
  void _hours;

  return safe as unknown as PublicEstimateResult;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isDatabaseConfigured()) {
    const demo = getDemoEstimateDetail(id);
    if (!demo) {
      return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
    }
    return NextResponse.json({
      estimate: demo,
      demo: true,
      warning: "Database unset. Showing demo estimate detail.",
    });
  }

  try {
    const row = await prisma.estimateResult.findUnique({
      where: { id },
      include: {
        estimate: {
          select: {
            status: true,
            answers: true,
            concept: true,
            lead: {
              select: {
                name: true,
                email: true,
                company: true,
                phone: true,
                preferredNextStep: true,
              },
            },
          },
        },
      },
    });

    if (!row) {
      return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
    }

    const publicRaw =
      row.publicResult && typeof row.publicResult === "object"
        ? (row.publicResult as Record<string, unknown>)
        : {};
    const publicResult = sanitizePublicResult(publicRaw);
    const answers = normalizeAnswers(
      row.estimate.answers && typeof row.estimate.answers === "object"
        ? (row.estimate.answers as Record<string, unknown>)
        : {},
    );
    const summary = buildReviewSummary(answers);
    const lead = row.estimate.lead;
    const concept =
      row.estimate.concept && typeof row.estimate.concept === "object"
        ? (row.estimate.concept as Record<string, unknown>)
        : null;
    const trace =
      row.calculationTrace && typeof row.calculationTrace === "object"
        ? (row.calculationTrace as Record<string, unknown>)
        : {};

    const riskFlags = Array.isArray(publicResult.costDrivers)
      ? publicResult.costDrivers.map((driver) => ({
          id: driver.id,
          title: driver.title,
          explanation: driver.explanation,
        }))
      : [];

    if (row.isDiscoveryFirst) {
      riskFlags.unshift({
        id: "discovery-first",
        title: "Discovery-first recommended",
        explanation:
          publicResult.discoverySummary ??
          "Discovery was recommended before a full build commitment.",
      });
    }

    return NextResponse.json({
      estimate: {
        id: row.id,
        status: row.estimate.status.toLowerCase(),
        createdAt: row.createdAt.toISOString(),
        client: {
          name: lead?.name ?? null,
          email: lead?.email ?? null,
          company: lead?.company ?? null,
          phone: lead?.phone ?? null,
          preferredNextStep: lead?.preferredNextStep ?? null,
        },
        concept,
        answersSummary: {
          headline:
            (typeof concept?.headline === "string" && concept.headline) ||
            summary.headline,
          sections: summary.sections.map((section) => ({
            id: section.id,
            title: section.title,
            body: section.body,
          })),
          unknowns: summary.unknowns,
        },
        publicResult,
        riskFlags,
        usingPlaceholderConfiguration: Boolean(
          publicResult.usingPlaceholderConfiguration,
        ),
        privateNotes: {
          discoveryRecommended: Boolean(row.isDiscoveryFirst),
          checksum: row.checksum,
          pricingVersion: String(publicResult.pricingVersion ?? "unknown"),
          promptVersion:
            typeof trace.promptVersion === "string"
              ? trace.promptVersion
              : String(publicResult.pricingVersion ?? "unknown"),
          model: typeof trace.model === "string" ? trace.model : null,
        },
      },
      demo: false,
    });
  } catch (error) {
    console.error("admin estimate detail error", error);
    return NextResponse.json(
      { error: "Unable to load estimate." },
      { status: 500 },
    );
  }
}
