import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

const lineItemSchema = z.object({
  kind: z
    .enum(["work_package", "role", "custom", "third_party", "discount", "other"])
    .default("custom"),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  quantity: z.number().positive().default(1),
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
  const auth = await requireAdmin();
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

  if (!isDatabaseConfigured()) {
    const quoteId = `local-quote-${Date.now()}`;
    return NextResponse.json({
      ok: true,
      demo: true,
      warning: "Quotation saved in-memory only (database unset). Not persisted.",
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
        totals: {
          subtotalZar: body.subtotalZar ?? null,
          taxZar: body.taxZar ?? null,
          totalZar: body.totalZar ?? null,
        },
      },
    });
  }

  try {
    const estimate = await prisma.estimateResult.findUnique({
      where: { id: body.estimateId },
      select: { id: true },
    });

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
    }

    const status = body.issue ? "issued" : "draft";
    const actorId = auth.admin.userId;

    const result = await prisma.$transaction(async (tx) => {
      const quotation = await tx.reviewedQuotation.create({
        data: {
          estimateResultId: body.estimateId,
          status,
          title: body.title ?? `Quotation for ${body.estimateId}`,
          currency: "ZAR",
          selectedScenario:
            body.scenario === "scale_ready" ? "scale_ready" : body.scenario,
          createdById: actorId,
        },
        select: { id: true },
      });

      const version = await tx.quoteVersion.create({
        data: {
          quotationId: quotation.id,
          versionNumber: 1,
          status,
          frozenSnapshot: {
            assumptions: body.assumptions,
            exclusions: body.exclusions,
            scenario: body.scenario,
          } as Prisma.InputJsonValue,
          lineItemsSnapshot: body.lineItems as Prisma.InputJsonValue,
          milestonesSnapshot: body.milestones as Prisma.InputJsonValue,
          overrides: body.overrideReason
            ? [{ reason: body.overrideReason, at: new Date().toISOString() }]
            : [],
          overrideReasons: body.overrideReason ? [body.overrideReason] : [],
          subtotalZar: body.subtotalZar ?? null,
          taxZar: body.taxZar ?? null,
          totalZar: body.totalZar ?? null,
          issuedAt: body.issue ? new Date() : null,
          issuedById: body.issue ? actorId : null,
        },
        select: { id: true, versionNumber: true },
      });

      if (body.lineItems.length) {
        await tx.quoteLineItem.createMany({
          data: body.lineItems.map((item, index) => ({
            quoteVersionId: version.id,
            sortOrder: index,
            kind: item.kind,
            label: item.label,
            description: item.description ?? null,
            quantity: item.quantity,
            unitAmountZar: item.unitAmountZar,
            amountZar: item.amountZar,
          })),
        });
      }

      if (body.milestones.length) {
        await tx.quoteMilestone.createMany({
          data: body.milestones.map((item, index) => ({
            quoteVersionId: version.id,
            sortOrder: index,
            label: item.label,
            description: item.description ?? null,
            percent: item.percent ?? null,
            amountZar: item.amountZar ?? null,
            dueLabel: item.dueLabel ?? null,
          })),
        });
      }

      await tx.auditEvent.create({
        data: {
          actorUserId: actorId,
          action: body.issue ? "admin_quote_issued" : "admin_quote_drafted",
          entityType: "quote_versions",
          entityId: version.id,
          metadata: {
            estimateId: body.estimateId,
            quotationId: quotation.id,
            scenario: body.scenario,
          } as Prisma.InputJsonValue,
        },
      });

      return { quotation, version };
    });

    return NextResponse.json({
      ok: true,
      demo: false,
      quotation: {
        id: result.quotation.id,
        estimateId: body.estimateId,
        quoteVersionId: result.version.id,
        status,
        scenario: body.scenario,
        versionNumber: result.version.versionNumber,
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
