import { NextResponse } from "next/server";
import { z } from "zod";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { requireUser } from "@/lib/project-blueprint/auth/admin";
import { isStaffRole } from "@/lib/auth/roles";
import { trackBlueprintEvent } from "@/lib/project-blueprint/analytics/events";
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
  estimateId: z.string().min(1),
  notes: z.string().trim().max(2000).optional(),
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

async function resolveOwnedEstimate(
  userId: string,
  estimateId: string,
  isStaff: boolean,
) {
  const byEstimate = await prisma.estimate.findFirst({
    where: isStaff ? { id: estimateId } : { id: estimateId, userId },
    select: { id: true },
  });
  if (byEstimate) return byEstimate.id;

  const result = await prisma.estimateResult.findFirst({
    where: isStaff
      ? { id: estimateId }
      : { id: estimateId, estimate: { userId } },
    select: { estimateId: true },
  });
  return result?.estimateId ?? null;
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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

  if (!isDatabaseConfigured()) {
    if (preferredNextStep === "email") {
      await sendEstimateEmail({
        to: body.email,
        estimateId: body.estimateId,
        documentUrl,
        summaryLine:
          "Your indicative Project Blueprint planning estimate is ready to review.",
        idempotencyKey: `estimate-email:local:${body.estimateId}:${body.email}`,
      });
    }

    void trackBlueprintEvent(
      "reviewed_quote_requested",
      { preferredNextStep, demo: true },
      { estimateId: body.estimateId },
    ).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      demo: true,
      leadId: `local-lead-${Date.now()}`,
      warning: "Lead accepted locally (database unset). Not persisted.",
    });
  }

  try {
    const estimateRowId = await resolveOwnedEstimate(
      auth.user.id,
      body.estimateId,
      isStaffRole(auth.user.role),
    );
    if (!estimateRowId) {
      return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
    }

    const consentAt = new Date();
    const lead = await prisma.lead.upsert({
      where: { estimateId: estimateRowId },
      create: {
        userId: auth.user.id,
        estimateId: estimateRowId,
        name: body.name,
        email: body.email,
        company: body.company ?? null,
        phone: body.phone ?? null,
        consent: true,
        consentAt,
        preferredNextStep,
        notes: body.notes ?? null,
      },
      update: {
        name: body.name,
        email: body.email,
        company: body.company ?? null,
        phone: body.phone ?? null,
        consent: true,
        consentAt,
        preferredNextStep,
        notes: body.notes ?? null,
      },
      select: { id: true },
    });

    await prisma.estimate.update({
      where: { id: estimateRowId },
      data: { status: "LEAD_CAPTURED" },
    });

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
      { preferredNextStep, demo: false },
      { estimateId: estimateRowId },
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
