import { NextResponse } from "next/server";

import { isStaffRole } from "@/lib/auth/roles";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { requireUser } from "@/lib/project-blueprint/auth/admin";
import { formatZarRange, formatWeeks } from "@/lib/project-blueprint/format";
import type { MoneyRange, PublicEstimateResult } from "@/lib/project-blueprint/types";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ estimateId: string }>;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function moneyRange(value: unknown): MoneyRange | null {
  if (
    value &&
    typeof value === "object" &&
    "low" in value &&
    "high" in value
  ) {
    const v = value as MoneyRange;
    return {
      low: Number(v.low) || 0,
      likely: Number(v.likely) || 0,
      high: Number(v.high) || 0,
    };
  }
  return null;
}

function buildDocumentHtml(result: PublicEstimateResult): string {
  const recommended = result.recommendedScenario;
  const range = moneyRange(recommended.range);
  const rangeText = range
    ? formatZarRange(
        range,
        (recommended as { rangeDisplay?: string }).rangeDisplay,
      )
    : "—";
  const timeline = formatWeeks(
    recommended.timeline.minimumWeeks,
    recommended.timeline.likelyWeeks,
    recommended.timeline.maximumWeeks,
  );

  const alternatives = (result.alternativeScenarios ?? [])
    .map((scenario) => {
      const r = moneyRange(scenario.range);
      return `<li><strong>${escapeHtml(scenario.name)}</strong>: ${escapeHtml(
        r ? formatZarRange(r) : "—",
      )} — ${escapeHtml(scenario.summary)}</li>`;
    })
    .join("");

  const drivers = (result.costDrivers ?? [])
    .map(
      (d) =>
        `<li><strong>${escapeHtml(d.title)}</strong> — ${escapeHtml(d.explanation)}</li>`,
    )
    .join("");

  const assumptions = (result.assumptions ?? [])
    .map((a) => `<li>${escapeHtml(typeof a === "string" ? a : a.text)}</li>`)
    .join("");

  const exclusions = (result.exclusions ?? [])
    .map((e) => `<li>${escapeHtml(e)}</li>`)
    .join("");

  const unknowns = (result.confidence?.unknowns ?? [])
    .map((u) => `<li>${escapeHtml(u)}</li>`)
    .join("");

  const generated = new Date(result.generatedAt).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Project Blueprint — ${escapeHtml(result.productSummary)}</title>
  <style>
    :root { color-scheme: light; --mint: #67AFA7; --ink: #171717; --muted: #525252; }
    body { font-family: Georgia, "Times New Roman", serif; color: var(--ink); line-height: 1.55; margin: 0; background: #f7faf9; }
    main { max-width: 720px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; background: #fff; }
    h1, h2 { font-family: system-ui, -apple-system, Segoe UI, sans-serif; font-weight: 600; }
    h1 { font-size: 1.75rem; margin: 0.5rem 0 0.75rem; }
    h2 { font-size: 1.15rem; margin: 2rem 0 0.75rem; color: #1f4f4a; }
    .eyebrow { font-family: system-ui, sans-serif; font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; color: #2f6f69; font-weight: 600; }
    .range { font-size: 2rem; font-family: system-ui, sans-serif; font-weight: 650; margin: 0.5rem 0; }
    .meta { color: var(--muted); font-size: 0.95rem; }
    .disclaimer { border-left: 3px solid var(--mint); padding: 0.75rem 1rem; background: #f0f7f6; margin: 1.25rem 0; }
    ul { padding-left: 1.2rem; }
    li { margin: 0.35rem 0; }
    footer { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #e5e5e5; color: var(--muted); font-size: 0.9rem; }
    @media print {
      body { background: #fff; }
      main { padding: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Project Blueprint · Indicative planning estimate</p>
    <h1>${escapeHtml(result.productSummary)}</h1>
    <p class="meta">Reference ${escapeHtml(result.estimateId)} · Generated ${escapeHtml(generated)} · ${escapeHtml(result.currency)}</p>
    <div class="disclaimer">
      <p>This document is an <strong>indicative planning estimate</strong>, not a fixed or binding quotation. A Good Code specialist reviews technical scope before issuing a formal quote.</p>
    </div>
    <h2>Recommended investment range</h2>
    <p class="range">${escapeHtml(rangeText)}</p>
    <p class="meta">Timeline: ${escapeHtml(timeline)} · Confidence: ${escapeHtml(result.confidence?.level ?? "early")}</p>
    <p>${escapeHtml(result.confidence?.explanation ?? "")}</p>
    <h2>Alternative scenarios</h2>
    <ul>${alternatives || "<li>None listed</li>"}</ul>
    <h2>Cost drivers</h2>
    <ul>${drivers || "<li>None listed</li>"}</ul>
    <h2>Assumptions</h2>
    <ul>${assumptions || "<li>None listed</li>"}</ul>
    <h2>Exclusions</h2>
    <ul>${exclusions || "<li>None listed</li>"}</ul>
    <h2>Open unknowns</h2>
    <ul>${unknowns || "<li>None listed</li>"}</ul>
    <h2>Recommended next step</h2>
    <p>${escapeHtml(result.nextStepRecommendation)}</p>
    <footer>
      <p>Good Code · Polokwane, South Africa · <a href="https://www.goodcode.co.za">goodcode.co.za</a></p>
      <p>Pricing configuration version: ${escapeHtml(result.pricingVersion)}. This document never includes internal rates or commercial margins.</p>
    </footer>
  </main>
</body>
</html>`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { estimateId } = await context.params;

  const auth = await requireUser();
  if (!auth.ok) {
    return new NextResponse(auth.error, { status: auth.status });
  }

  if (!isDatabaseConfigured()) {
    return new NextResponse("Estimate document not found.", { status: 404 });
  }

  const staff = isStaffRole(auth.user.role);
  const row = await prisma.estimateResult.findFirst({
    where: staff
      ? { id: estimateId }
      : { id: estimateId, estimate: { userId: auth.user.id } },
    select: { publicResult: true },
  });

  if (!row?.publicResult || typeof row.publicResult !== "object") {
    return new NextResponse("Estimate document not found.", { status: 404 });
  }

  const raw = row.publicResult as Record<string, unknown>;
  const {
    privateTrace: _p,
    calculationTrace: _c,
    rates: _r,
    margins: _m,
    ...safe
  } = raw;
  void _p;
  void _c;
  void _r;
  void _m;

  const html = buildDocumentHtml(safe as unknown as PublicEstimateResult);
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
