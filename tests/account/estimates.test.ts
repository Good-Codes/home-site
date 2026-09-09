import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    $transaction: vi.fn(),
    estimate: {
      updateMany: vi.fn(),
    },
  },
}));

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { PROFILE_ESTIMATE_LIMIT } from "@/lib/auth/constants";
import {
  ProfileEstimateError,
  saveEstimateToProfile,
  unsaveEstimateFromProfile,
} from "@/lib/account/estimates";

describe("profile estimates", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.$transaction).mockReset();
    vi.mocked(prisma.estimate.updateMany).mockReset();
  });

  it("saves an owned calculated estimate", async () => {
    const tx = {
      estimate: {
        findFirst: vi.fn().mockResolvedValue({
          id: "est-1",
          savedToProfileAt: null,
          results: [{ id: "res-1" }],
        }),
        count: vi.fn().mockResolvedValue(2),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn(tx as never),
    );

    await expect(
      saveEstimateToProfile({ userId: "user-1", estimateId: "est-1" }),
    ).resolves.toEqual({ alreadySaved: false });
    expect(tx.estimate.update).toHaveBeenCalled();
  });

  it("is idempotent when already saved", async () => {
    const tx = {
      estimate: {
        findFirst: vi.fn().mockResolvedValue({
          id: "est-1",
          savedToProfileAt: new Date(),
          results: [{ id: "res-1" }],
        }),
        count: vi.fn(),
        update: vi.fn(),
      },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn(tx as never),
    );

    await expect(
      saveEstimateToProfile({ userId: "user-1", estimateId: "est-1" }),
    ).resolves.toEqual({ alreadySaved: true });
    expect(tx.estimate.count).not.toHaveBeenCalled();
  });

  it("rejects a sixth save", async () => {
    const tx = {
      estimate: {
        findFirst: vi.fn().mockResolvedValue({
          id: "est-6",
          savedToProfileAt: null,
          results: [{ id: "res-1" }],
        }),
        count: vi.fn().mockResolvedValue(PROFILE_ESTIMATE_LIMIT),
        update: vi.fn(),
      },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn(tx as never),
    );

    await expect(
      saveEstimateToProfile({ userId: "user-1", estimateId: "est-6" }),
    ).rejects.toMatchObject({ code: "LIMIT" });
    expect(tx.estimate.update).not.toHaveBeenCalled();
  });

  it("returns not found for another user's estimate", async () => {
    const tx = {
      estimate: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn(),
        update: vi.fn(),
      },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn(tx as never),
    );

    await expect(
      saveEstimateToProfile({ userId: "user-1", estimateId: "someone-else" }),
    ).rejects.toBeInstanceOf(ProfileEstimateError);
  });

  it("unsaves without deleting the row", async () => {
    vi.mocked(prisma.estimate.updateMany).mockResolvedValue({ count: 1 });

    await expect(
      unsaveEstimateFromProfile({ userId: "user-1", estimateId: "est-1" }),
    ).resolves.toBeUndefined();

    expect(prisma.estimate.updateMany).toHaveBeenCalledWith({
      where: {
        id: "est-1",
        userId: "user-1",
        savedToProfileAt: { not: null },
      },
      data: { savedToProfileAt: null },
    });
  });

  it("returns not found when unsaving a missing profile estimate", async () => {
    vi.mocked(prisma.estimate.updateMany).mockResolvedValue({ count: 0 });

    await expect(
      unsaveEstimateFromProfile({ userId: "user-1", estimateId: "est-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
