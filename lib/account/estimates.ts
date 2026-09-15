import "server-only";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { formatZarRange } from "@/lib/project-blueprint/format";
import type { MoneyRange } from "@/lib/project-blueprint/types";

import {
  PROFILE_ESTIMATE_LIMIT,
  type SavedEstimateListItem,
} from "./estimate-types";

export { PROFILE_ESTIMATE_LIMIT, type SavedEstimateListItem };

export class ProfileEstimateError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "CAP" | "UNAVAILABLE" | "FORBIDDEN",
  ) {
    super(message);
    this.name = "ProfileEstimateError";
  }
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

export function summarizePublicResult(raw: unknown): {
  productSummary: string;
  rangeLabel: string | null;
} {
  const publicResult =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const productSummary =
    typeof publicResult.productSummary === "string" &&
    publicResult.productSummary.trim()
      ? publicResult.productSummary.trim()
      : "Planning estimate";
  const recommended =
    publicResult.recommendedScenario &&
    typeof publicResult.recommendedScenario === "object"
      ? (publicResult.recommendedScenario as Record<string, unknown>)
      : {};
  const range = moneyRange(recommended.range);
  return {
    productSummary,
    rangeLabel: range ? formatZarRange(range) : null,
  };
}

export async function listSavedEstimates(
  userId: string,
): Promise<SavedEstimateListItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const rows = await prisma.estimate.findMany({
    where: { userId, savedToProfileAt: { not: null } },
    orderBy: { savedToProfileAt: "desc" },
    take: PROFILE_ESTIMATE_LIMIT,
    select: {
      id: true,
      savedToProfileAt: true,
      results: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { publicResult: true },
      },
    },
  });

  return rows.flatMap((row) => {
    if (!row.savedToProfileAt) return [];
    const summary = summarizePublicResult(row.results[0]?.publicResult);
    return [
      {
        id: row.id,
        savedToProfileAt: row.savedToProfileAt.toISOString(),
        productSummary: summary.productSummary,
        rangeLabel: summary.rangeLabel,
      },
    ];
  });
}

export async function saveEstimateToProfile(input: {
  userId: string;
  estimateId: string;
}): Promise<{ saved: true; alreadySaved: boolean }> {
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

    if (!estimate || estimate.results.length === 0) {
      throw new ProfileEstimateError("Estimate not found.", "NOT_FOUND");
    }

    if (estimate.savedToProfileAt) {
      return { saved: true as const, alreadySaved: true };
    }

    await tx.estimate.update({
      where: { id: estimate.id },
      data: { savedToProfileAt: new Date() },
    });

    const count = await tx.estimate.count({
      where: { userId: input.userId, savedToProfileAt: { not: null } },
    });
    if (count > PROFILE_ESTIMATE_LIMIT) {
      await tx.estimate.update({
        where: { id: estimate.id },
        data: { savedToProfileAt: null },
      });
      throw new ProfileEstimateError(
        `You already have ${PROFILE_ESTIMATE_LIMIT} estimates on your profile. Delete one from your account to save this one.`,
        "CAP",
      );
    }

    return { saved: true as const, alreadySaved: false };
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

export async function getOwnedCalculatedEstimate(input: {
  userId: string;
  estimateId: string;
  requireSavedToProfile?: boolean;
}) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  return prisma.estimate.findFirst({
    where: {
      id: input.estimateId,
      userId: input.userId,
      ...(input.requireSavedToProfile
        ? { savedToProfileAt: { not: null } }
        : {}),
    },
    select: {
      id: true,
      savedToProfileAt: true,
      concept: true,
      results: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          publicResult: true,
          createdAt: true,
        },
      },
    },
  });
}
