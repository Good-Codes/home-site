import { NextResponse } from "next/server";

import { requireAdmin, hasServiceRole } from "@/lib/project-blueprint/auth/admin";
import { getDemoEstimateDetail } from "@/lib/project-blueprint/admin/demo-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildReviewSummary } from "@/lib/project-blueprint/summary";
import { normalizeAnswers } from "@/lib/project-blueprint/answers";
import type { PublicEstimateResult } from "@/lib/project-blueprint/types";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Strip any accidental private fields before returning to the admin UI. */
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

  if (auth.admin.isDemo || !hasServiceRole()) {
    const demo = getDemoEstimateDetail(id);
    if (!demo) {
      return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
    }
    return NextResponse.json({
      estimate: demo,
      demo: true,
      warning:
        "PLACEHOLDER — Supabase unset or service role missing. Showing demo estimate detail.",
    });
  }

  try {
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("estimate_results")
      .select(
        `
        id,
        created_at,
        is_discovery_first,
        checksum,
        public_result,
        estimate_sessions (
          id,
          status,
          answers,
          leads (
            name,
            email,
            company,
            phone,
            preferred_next_step
          )
        ),
        pricing_versions (
          version,
          is_placeholder
        )
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("admin estimate detail failed", error);
      return NextResponse.json(
        { error: "Unable to load estimate." },
        { status: 500 },
      );
    }

    if (!row) {
      const demo = getDemoEstimateDetail(id);
      if (demo) {
        return NextResponse.json({
          estimate: demo,
          demo: true,
          warning: "PLACEHOLDER — estimate not in database; demo detail returned.",
        });
      }
      return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
    }

    const publicRaw =
      row.public_result && typeof row.public_result === "object"
        ? (row.public_result as Record<string, unknown>)
        : {};
    const publicResult = sanitizePublicResult(publicRaw);

    const session = Array.isArray(row.estimate_sessions)
      ? row.estimate_sessions[0]
      : row.estimate_sessions;
    const answersRaw =
      session && typeof session === "object" && "answers" in session
        ? (session as { answers: unknown }).answers
        : {};
    const answers = normalizeAnswers(
      answersRaw && typeof answersRaw === "object"
        ? (answersRaw as Record<string, unknown>)
        : {},
    );
    const summary = buildReviewSummary(answers);

    const leadRaw =
      session && typeof session === "object" && "leads" in session
        ? (session as { leads: unknown }).leads
        : null;
    const lead = Array.isArray(leadRaw) ? leadRaw[0] : leadRaw;
    const pricing = Array.isArray(row.pricing_versions)
      ? row.pricing_versions[0]
      : row.pricing_versions;

    const riskFlags = Array.isArray(publicResult.costDrivers)
      ? publicResult.costDrivers.map((driver) => ({
          id: driver.id,
          title: driver.title,
          explanation: driver.explanation,
        }))
      : [];

    if (row.is_discovery_first) {
      riskFlags.unshift({
        id: "discovery-first",
        title: "Discovery-first recommended",
        explanation:
          publicResult.discoverySummary ??
          "Engine recommended discovery before a full build commitment.",
      });
    }

    return NextResponse.json({
      estimate: {
        id: row.id,
        status: String(
          (session as { status?: string } | null)?.status ?? "calculated",
        ),
        createdAt: row.created_at,
        client: {
          name:
            lead && typeof lead === "object" && "name" in lead
              ? String((lead as { name: string }).name)
              : null,
          email:
            lead && typeof lead === "object" && "email" in lead
              ? String((lead as { email: string }).email)
              : null,
          company:
            lead && typeof lead === "object" && "company" in lead
              ? ((lead as { company: string | null }).company ?? null)
              : null,
          phone:
            lead && typeof lead === "object" && "phone" in lead
              ? ((lead as { phone: string | null }).phone ?? null)
              : null,
          preferredNextStep:
            lead && typeof lead === "object" && "preferred_next_step" in lead
              ? ((lead as { preferred_next_step: string | null }).preferred_next_step ??
                null)
              : null,
        },
        answersSummary: {
          headline: summary.headline,
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
          (pricing as { is_placeholder?: boolean } | null)?.is_placeholder ??
            publicResult.usingPlaceholderConfiguration,
        ),
        privateNotes: {
          discoveryRecommended: Boolean(row.is_discovery_first),
          checksum: String(row.checksum),
          pricingVersion: String(
            (pricing as { version?: string } | null)?.version ??
              publicResult.pricingVersion,
          ),
        },
      },
      demo: false,
    });
  } catch (error) {
    console.error("admin estimate detail error", error);
    const demo = getDemoEstimateDetail(id);
    if (demo) {
      return NextResponse.json({
        estimate: demo,
        demo: true,
        warning: "PLACEHOLDER — falling back to demo estimate detail.",
      });
    }
    return NextResponse.json(
      { error: "Unable to load estimate." },
      { status: 500 },
    );
  }
}
