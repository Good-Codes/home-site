import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    estimate: {
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { isDatabaseConfigured, prisma } from "@/lib/db";
import {
  PROFILE_ESTIMATE_LIMIT,
  saveEstimateToProfile,
  unsaveEstimateFromProfile,
} from "@/lib/account/estimates";

const USER = "11111111-1111-1111-1111-111111111111";
const ESTIMATE = "22222222-2222-2222-2222-222222222222";

describe("saveEstimateToProfile", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.$transaction).mockReset();
  });

  it("saves when the user is under the cap", async () => {
    const update = vi.fn();
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        estimate: {
          findFirst: vi.fn().mockResolvedValue({
            id: ESTIMATE,
            savedToProfileAt: null,
            results: [{ id: "result-1" }],
          }),
          update,
          count: vi.fn().mockResolvedValue(1),
        },
      };
      return fn(tx as never);
    });

    const result = await saveEstimateToProfile({
      userId: USER,
      estimateId: ESTIMATE,
    });
    expect(result).toEqual({ saved: true, alreadySaved: false });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("is idempotent when already saved", async () => {
    const update = vi.fn();
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        estimate: {
          findFirst: vi.fn().mockResolvedValue({
            id: ESTIMATE,
            savedToProfileAt: new Date(),
            results: [{ id: "result-1" }],
          }),
          update,
          count: vi.fn(),
        },
      };
      return fn(tx as never);
    });

    const result = await saveEstimateToProfile({
      userId: USER,
      estimateId: ESTIMATE,
    });
    expect(result.alreadySaved).toBe(true);
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 409-style CAP at five saved estimates", async () => {
    const update = vi.fn();
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        estimate: {
          findFirst: vi.fn().mockResolvedValue({
            id: ESTIMATE,
            savedToProfileAt: null,
            results: [{ id: "result-1" }],
          }),
          update,
          count: vi.fn().mockResolvedValue(PROFILE_ESTIMATE_LIMIT + 1),
        },
      };
      return fn(tx as never);
    });

    await expect(
      saveEstimateToProfile({ userId: USER, estimateId: ESTIMATE }),
    ).rejects.toMatchObject({ code: "CAP" });
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[1]?.[0]?.data).toEqual({ savedToProfileAt: null });
  });

  it("does not leak other users' ids", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        estimate: {
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
          count: vi.fn(),
        },
      };
      return fn(tx as never);
    });

    await expect(
      saveEstimateToProfile({ userId: USER, estimateId: ESTIMATE }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("unsaveEstimateFromProfile", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.estimate.updateMany).mockReset();
  });

  it("clears savedToProfileAt and does not delete the row", async () => {
    vi.mocked(prisma.estimate.updateMany).mockResolvedValue({ count: 1 });

    await unsaveEstimateFromProfile({ userId: USER, estimateId: ESTIMATE });

    expect(prisma.estimate.updateMany).toHaveBeenCalledWith({
      where: {
        id: ESTIMATE,
        userId: USER,
        savedToProfileAt: { not: null },
      },
      data: { savedToProfileAt: null },
    });
    expect(prisma.estimate).not.toHaveProperty("delete");
  });

  it("returns NOT_FOUND for another user's estimate", async () => {
    vi.mocked(prisma.estimate.updateMany).mockResolvedValue({ count: 0 });

    await expect(
      unsaveEstimateFromProfile({ userId: USER, estimateId: ESTIMATE }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
