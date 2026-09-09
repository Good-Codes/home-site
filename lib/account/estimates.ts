import "server-only";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { formatZarRange } from "@/lib/project-blueprint/format";
import type { MoneyRange } from "@/lib/project-blueprint/types";

import { PROFILE_ESTIMATE_LIMIT } from "@/lib/auth/constants";
import type { ProfileEstimateListItem } from "@/lib/account/types";

export class ProfileEstimateError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "LIMIT" | "UNAVAILABLE" | "NOT_CALCULATED",
  ) {
    super(message);
    this.name = "ProfileEstimateError";
  }
}

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

function summaryFromEstimate(input: {
  concept: unknown;
  publicResult: unknown;
}): string {
  if (input.concept && typeof input.concept === "object") {
    const headline = (input.concept as { headline?: unknown }).headline;
    if (typeof headline === "string" && headline.trim()) return headline.trim();
  }
  if (input.publicResult && typeof input.publicResult === "object") {
    const productSummary = (input.publicResult as { productSummary?: unknown })
      .productSummary;
    if (typeof productSummary === "string" && productSummary.trim()) {
      return productSummary.trim();
    }
  }
  return "Custom software estimate";
}

function rangeFromPublicResult(publicResult: unknown): string | null {
  if (!publicResult || typeof publicResult !== "object") return null;
  const recommended = (publicResult as { recommendedScenario?: unknown })
    .recommendedScenario;
  if (!recommended || typeof recommended !== "object") return null;
  const range = moneyRange((recommended as { range?: unknown }).range);
  const display = (recommended as { rangeDisplay?: unknown }).rangeDisplay;
  if (!range) return null;
  return formatZarRange(
    range,
    typeof display === "string" ? display : undefined,
  );
}

export async function listSavedProfileEstimates(
  userId: string,
): Promise<ProfileEstimateListItem[]> {
  if (!isDatabaseConfigured()) return [];

  const rows = await prisma.estimate.findMany({
    where: { userId, savedToProfileAt: { not: null } },
    orderBy: { savedToProfileAt: "desc" },
    take: PROFILE_ESTIMATE_LIMIT,
    select: {
      id: true,
      status: true,
      savedToProfileAt: true,
      concept: true,
      results: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { publicResult: true },
      },
    },
  });

  return rows.map((row) => {
    const publicResult = row.results[0]?.publicResult ?? null;
    return {
      id: row.id,
      status: row.status,
      savedAt: (row.savedToProfileAt ?? new Date()).toISOString(),
      summary: summaryFromEstimate({ concept: row.concept, publicResult }),
      rangeDisplay: rangeFromPublicResult(publicResult),
    };
  });
}

export async function saveEstimateToProfile(input: {
  userId: string;
  estimateId: string;
}): Promise<{ alreadySaved: boolean }> {
  if (!isDatabaseConfigured()) {
    throw new ProfileEstimateError(
      "Accounts are temporarily unavailable.",
      "UNAVAILABLE",
    );
  }

  return prisma.$transaction(async (tx) => {
    const estimate = await tx.estimate.findFirst({
      where: { id: input.estimateId, userId: input.userId },
      select: {
        id: true,
        savedToProfileAt: true,
        results: { select: { id: true }, take: 1 },
      },
    });

    if (!estimate) {
      throw new ProfileEstimateError("Estimate not found.", "NOT_FOUND");
    }
    if (estimate.results.length === 0) {
      throw new ProfileEstimateError(
        "Calculate an estimate before saving it to your profile.",
        "NOT_CALCULATED",
      );
    }
    if (estimate.savedToProfileAt) {
      return { alreadySaved: true };
    }

    const savedCount = await tx.estimate.count({
      where: { userId: input.userId, savedToProfileAt: { not: null } },
    });
    if (savedCount >= PROFILE_ESTIMATE_LIMIT) {
      throw new ProfileEstimateError(
        "You already have 5 saved estimates. Delete one from your account to save another.",
        "LIMIT",
      );
    }

    await tx.estimate.update({
      where: { id: estimate.id },
      data: { savedToProfileAt: new Date() },
    });
    return { alreadySaved: false };
  });
}

export async function unsaveEstimateFromProfile(input: {
  userId: string;
  estimateId: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new ProfileEstimateError(
      "Accounts are temporarily unavailable.",
      "UNAVAILABLE",
    );
  }

  const updated = await prisma.estimate.updateMany({
    where: {
      id: input.estimateId,
      userId: input.userId,
      savedToProfileAt: { not: null },
    },
    data: { savedToProfileAt: null },
  });

  if (updated.count === 0) {
    throw new ProfileEstimateError("Estimate not found.", "NOT_FOUND");
  }
}
