import { NextResponse } from "next/server";
import { z } from "zod";

import { trackBlueprintEvent } from "@/lib/project-blueprint/analytics/events";
import { hasServiceRole, isSupabaseConfigured } from "@/lib/project-blueprint/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEstimateEmail } from "@/lib/project-blueprint/email/resend";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  consent: z.literal(true),
  preferredNextStep: z
    .enum(["email", "call", "workshop", "upload_brief", "none"])
    .optional()
    .default("email"),
  sessionId: z.string().uuid().optional(),
  estimateId: z.string().min(1),
  notes: z.string().trim().max(2000).optional(),
  /** Legacy alias from earlier lead form — mapped to preferredNextStep. */
  intent: z.string().optional(),
});

function mapIntent(
  preferred: z.infer<typeof bodySchema>["preferredNextStep"],
  intent?: string,
): "email" | "call" | "workshop" | "upload_brief" | "none" {
  if (preferred) return preferred;
  if (intent === "call" || intent === "book_call") return "call";
  if (intent === "workshop") return "workshop";
  if (intent === "upload_brief") return "upload_brief";
  return "email";
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check your details and confirm consent.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const preferredNextStep = mapIntent(body.preferredNextStep, body.intent);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://www.goodcode.co.za";
  const documentUrl = `${siteUrl}/api/project-blueprint/document/${encodeURIComponent(body.estimateId)}`;

  if (!isSupabaseConfigured() || !hasServiceRole()) {
    if (preferredNextStep === "email") {
      await sendEstimateEmail({
        to: body.email,
        estimateId: body.estimateId,
        documentUrl,
        summaryLine: "Your indicative Project Blueprint planning estimate is ready to review.",
        idempotencyKey: `estimate-email:demo:${body.estimateId}:${body.email}`,
      });
    }

    void trackBlueprintEvent(
      "reviewed_quote_requested",
      {
        preferredNextStep,
        demo: true,
      },
      { sessionId: body.sessionId },
    ).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      demo: true,
      leadId: `demo-lead-${Date.now()}`,
      warning:
        "PLACEHOLDER — lead accepted locally (Supabase unset). Not persisted.",
    });
  }

  try {
    const admin = createAdminClient();
    let sessionId = body.sessionId;

    if (!sessionId && body.estimateId) {
      const { data: result } = await admin
        .from("estimate_results")
        .select("session_id")
        .eq("id", body.estimateId)
        .maybeSingle();
      sessionId = result?.session_id ?? undefined;
    }

    if (!sessionId) {
      // Create a lightweight session so lead + consent can persist
      const { data: created, error: sessionError } = await admin
        .from("estimate_sessions")
        .insert({
          token_hash: `lead-only:${body.estimateId}:${Date.now()}`,
          status: "lead_captured",
          answers: {},
          expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .select("id")
        .single();

      if (sessionError || !created) {
        console.error("lead session create failed", sessionError);
        return NextResponse.json(
          { error: "Unable to save your details right now." },
          { status: 500 },
        );
      }
      sessionId = created.id;
    }

    const consentAt = new Date().toISOString();
    const { data: lead, error: leadError } = await admin
      .from("leads")
      .upsert(
        {
          session_id: sessionId,
          name: body.name,
          email: body.email,
          company: body.company ?? null,
          phone: body.phone ?? null,
          consent: true,
          consent_at: consentAt,
          preferred_next_step: preferredNextStep,
          notes: body.notes ?? null,
        },
        { onConflict: "session_id" },
      )
      .select("id")
      .single();

    if (leadError || !lead) {
      console.error("lead upsert failed", leadError);
      return NextResponse.json(
        { error: "Unable to save your details right now." },
        { status: 500 },
      );
    }

    await admin
      .from("estimate_sessions")
      .update({ status: "lead_captured" })
      .eq("id", sessionId);

    if (preferredNextStep === "email") {
      await sendEstimateEmail({
        to: body.email,
        estimateId: body.estimateId,
        documentUrl,
        summaryLine:
          "Your indicative Project Blueprint planning estimate is ready to review.",
        idempotencyKey: `estimate-email:${body.estimateId}:${lead.id}`,
      });
    }

    void trackBlueprintEvent(
      "reviewed_quote_requested",
      {
        preferredNextStep,
        demo: false,
      },
      { sessionId },
    ).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      demo: false,
      leadId: lead.id,
    });
  } catch (error) {
    console.error("leads POST failed", error);
    return NextResponse.json(
      { error: "Unable to save your details right now." },
      { status: 500 },
    );
  }
}
