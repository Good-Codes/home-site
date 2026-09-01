import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, hasServiceRole } from "@/lib/project-blueprint/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const lineItemSchema = z.object({
  kind: z
    .enum(["work_package", "role", "custom", "third_party", "discount", "other"])
    .default("custom"),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  quantity: z.number().positive().default(1),
  /** Client-facing line amount only — not an internal sell rate. */
  unitAmountZar: z.number(),
  amountZar: z.number(),
});

const milestoneSchema = z.object({
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  percent: z.number().min(0).max(100).optional(),
  amountZar: z.number().optional(),
  dueLabel: z.string().max(200).optional(),
});

const bodySchema = z.object({
  estimateId: z.string().min(1),
  scenario: z.enum(["lean", "recommended", "scale", "scale_ready"]),
  title: z.string().max(200).optional(),
  lineItems: z.array(lineItemSchema).min(1),
  milestones: z.array(milestoneSchema).default([]),
  assumptions: z.array(z.string().max(500)).default([]),
  exclusions: z.array(z.string().max(500)).default([]),
  overrideReason: z.string().max(2000).optional(),
  issue: z.boolean().default(false),
  subtotalZar: z.number().optional(),
  taxZar: z.number().optional(),
  totalZar: z.number().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin(["admin", "approver", "reviewer"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid quotation payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = parsed.data;

  if (body.issue && !body.overrideReason?.trim() && body.lineItems.some((item) => item.kind === "custom" || item.kind === "discount")) {
    // Soft guidance only — still allow issue when reason provided elsewhere
  }

  if (auth.admin.isDemo || !hasServiceRole()) {
    const quoteId = `demo-quote-${Date.now()}`;
    return NextResponse.json({
      ok: true,
      demo: true,
      warning:
        "PLACEHOLDER — quotation saved in-memory only (Supabase unset). Not persisted.",
      quotation: {
        id: quoteId,
        estimateId: body.estimateId,
        status: body.issue ? "issued" : "draft",
        scenario: body.scenario,
        versionNumber: 1,
        lineItemCount: body.lineItems.length,
        milestoneCount: body.milestones.length,
        assumptions: body.assumptions,
        exclusions: body.exclusions,
        overrideReason: body.overrideReason ?? null,
        issued: body.issue,
        // Never echo internal rates — only submitted client-facing amounts
        totals: {
          subtotalZar: body.subtotalZar ?? null,
          taxZar: body.taxZar ?? null,
          totalZar: body.totalZar ?? null,
        },
      },
    });
  }

  try {
    const admin = createAdminClient();

    const { data: estimate, error: estimateError } = await admin
      .from("estimate_results")
      .select("id")
      .eq("id", body.estimateId)
      .maybeSingle();

    if (estimateError || !estimate) {
      return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
    }

    if (body.issue && auth.admin.role === "reviewer") {
      return NextResponse.json(
        { error: "Reviewers cannot issue quotations. Approver or admin required." },
        { status: 403 },
      );
    }

    const { data: quotation, error: quotationError } = await admin
      .from("reviewed_quotations")
      .insert({
        estimate_result_id: body.estimateId,
        status: body.issue ? "issued" : "draft",
        title: body.title ?? `Quotation for ${body.estimateId}`,
        currency: "ZAR",
        selected_scenario:
          body.scenario === "scale_ready" ? "scale_ready" : body.scenario,
        created_by: auth.admin.userId === "demo-admin" ? null : auth.admin.userId,
      })
      .select("id")
      .single();

    if (quotationError || !quotation) {
      console.error("create quotation failed", quotationError);
      return NextResponse.json(
        { error: "Unable to create quotation." },
        { status: 500 },
      );
    }

    const status = body.issue ? "issued" : "draft";
    const { data: version, error: versionError } = await admin
      .from("quote_versions")
      .insert({
        quotation_id: quotation.id,
        version_number: 1,
        status,
        frozen_snapshot: {
          assumptions: body.assumptions,
          exclusions: body.exclusions,
          scenario: body.scenario,
        },
        line_items_snapshot: body.lineItems,
        milestones_snapshot: body.milestones,
        overrides: body.overrideReason
          ? [{ reason: body.overrideReason, at: new Date().toISOString() }]
          : [],
        override_reasons: body.overrideReason ? [body.overrideReason] : [],
        subtotal_zar: body.subtotalZar ?? null,
        tax_zar: body.taxZar ?? null,
        total_zar: body.totalZar ?? null,
        issued_at: body.issue ? new Date().toISOString() : null,
        issued_by:
          body.issue && auth.admin.userId !== "demo-admin"
            ? auth.admin.userId
            : null,
      })
      .select("id, version_number")
      .single();

    if (versionError || !version) {
      console.error("create quote version failed", versionError);
      return NextResponse.json(
        { error: "Unable to create quote version." },
        { status: 500 },
      );
    }

    if (body.lineItems.length) {
      await admin.from("quote_line_items").insert(
        body.lineItems.map((item, index) => ({
          quote_version_id: version.id,
          sort_order: index,
          kind: item.kind,
          label: item.label,
          description: item.description ?? null,
          quantity: item.quantity,
          unit_amount_zar: item.unitAmountZar,
          amount_zar: item.amountZar,
        })),
      );
    }

    if (body.milestones.length) {
      await admin.from("quote_milestones").insert(
        body.milestones.map((item, index) => ({
          quote_version_id: version.id,
          sort_order: index,
          label: item.label,
          description: item.description ?? null,
          percent: item.percent ?? null,
          amount_zar: item.amountZar ?? null,
          due_label: item.dueLabel ?? null,
        })),
      );
    }

    await admin.rpc("write_audit_event", {
      p_actor_user_id:
        auth.admin.userId === "demo-admin" ? null : auth.admin.userId,
      p_action: body.issue ? "admin_quote_issued" : "admin_quote_drafted",
      p_entity_type: "quote_versions",
      p_entity_id: version.id,
      p_metadata: {
        estimateId: body.estimateId,
        quotationId: quotation.id,
        scenario: body.scenario,
      },
    });

    return NextResponse.json({
      ok: true,
      demo: false,
      quotation: {
        id: quotation.id,
        estimateId: body.estimateId,
        quoteVersionId: version.id,
        status,
        scenario: body.scenario,
        versionNumber: version.version_number,
        lineItemCount: body.lineItems.length,
        milestoneCount: body.milestones.length,
        issued: body.issue,
        totals: {
          subtotalZar: body.subtotalZar ?? null,
          taxZar: body.taxZar ?? null,
          totalZar: body.totalZar ?? null,
        },
      },
    });
  } catch (error) {
    console.error("admin quotes POST failed", error);
    return NextResponse.json(
      { error: "Unable to save quotation." },
      { status: 500 },
    );
  }
}
