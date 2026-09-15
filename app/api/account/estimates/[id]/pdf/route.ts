import { NextResponse } from "next/server";
import { z } from "zod";

import { getOwnedCalculatedEstimate } from "@/lib/account/estimates";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import { renderEstimateDocumentHtml } from "@/lib/project-blueprint/document/html";
import { htmlToPdf } from "@/lib/project-blueprint/document/pdf";
import { sanitizePublicResult } from "@/lib/project-blueprint/estimate/sanitize-public";
import { requireCustomer } from "@/lib/project-blueprint/auth/admin";
import type { IntakeConcept } from "@/lib/project-blueprint/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const idSchema = z.string().uuid();

type RouteContext = {
  params: Promise<{ id: string }>;
};

function asConcept(value: unknown): IntakeConcept | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const headline = typeof row.headline === "string" ? row.headline : "";
  if (!headline) return undefined;
  return {
    headline,
    summary: typeof row.summary === "string" ? row.summary : "",
    whoItsFor: typeof row.whoItsFor === "string" ? row.whoItsFor : "",
    coreCapabilities: Array.isArray(row.coreCapabilities)
      ? row.coreCapabilities.filter((item): item is string => typeof item === "string")
      : [],
    assumptions: Array.isArray(row.assumptions)
      ? row.assumptions.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireCustomer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  const key = `estimate-pdf:${auth.user.id}:${clientKeyFromRequest(request)}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many PDF requests. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const estimate = await getOwnedCalculatedEstimate({
    userId: auth.user.id,
    estimateId: parsed.data,
  });
  const latest = estimate?.results[0];
  if (!estimate || !latest?.publicResult || typeof latest.publicResult !== "object") {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  const result = sanitizePublicResult(
    latest.publicResult as Record<string, unknown>,
  );

  try {
    const html = renderEstimateDocumentHtml({
      result,
      referenceId: estimate.id,
      concept: asConcept(estimate.concept),
    });
    const pdf = await htmlToPdf(html);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="good-code-planning-estimate.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("estimate pdf failed", error);
    return NextResponse.json(
      { error: "Unable to prepare a PDF copy right now." },
      { status: 503 },
    );
  }
}
