import { NextResponse } from "next/server";
import { z } from "zod";

import { emptyFieldWriteBack } from "@/lib/account/profile";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { requireUser } from "@/lib/project-blueprint/auth/admin";
import { isStaffRole } from "@/lib/auth/roles";
import { trackBlueprintEvent } from "@/lib/project-blueprint/analytics/events";
import {
  PERSON_NAME_MAX,
  sanitizePersonName,
  sanitizePlainText,
} from "@/lib/security/text";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z
    .string()
    .max(PERSON_NAME_MAX)
    .transform((value) => sanitizePersonName(value, PERSON_NAME_MAX))
    .pipe(z.string().min(1).max(PERSON_NAME_MAX)),
  email: z.string().trim().email().max(254),
  company: z
    .string()
    .max(160)
    .optional()
    .transform((value) =>
      value
        ? sanitizePlainText(value, { maxLength: 160 }) || undefined
        : undefined,
    ),
  phone: z
    .string()
    .max(40)
    .optional()
    .transform((value) =>
      value
        ? sanitizePlainText(value, { maxLength: 40 }) || undefined
        : undefined,
    ),
  consent: z.literal(true),
  preferredNextStep: z
    .enum(["email", "call", "workshop", "upload_brief", "none"])
    .optional()
    .default("email"),
  estimateId: z.string().min(1),
  notes: z
    .string()
    .max(2000)
    .optional()
    .transform((value) =>
      value
        ? sanitizePlainText(value, {
            maxLength: 2000,
            keepNewlines: true,
            collapseWhitespace: true,
          }) || undefined
        : undefined,
    ),
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

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Unable to save your details right now." },
      { status: 503 },
    );
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
    const lead = await prisma.$transaction(async (tx) => {
      const saved = await tx.lead.upsert({
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

      await tx.estimate.update({
        where: { id: estimateRowId },
        data: { status: "LEAD_CAPTURED" },
      });

      if (!isStaffRole(auth.user.role)) {
        const current = await tx.user.findUnique({
          where: { id: auth.user.id },
          select: { name: true, phone: true, organisation: true },
        });
        const writeBack = current
          ? emptyFieldWriteBack(current, {
              name: body.name,
              phone: body.phone,
              organisation: body.company,
            })
          : null;
        if (writeBack) {
          await tx.user.update({
            where: { id: auth.user.id },
            data: writeBack,
          });
        }
      }

      return saved;
    });

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
