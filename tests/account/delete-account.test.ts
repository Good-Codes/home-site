import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(() => true),
  prisma: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    estimate: {
      update: vi.fn(),
    },
    lead: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { isDatabaseConfigured, prisma } from "@/lib/db";
import {
  DeleteAccountError,
  deleteCustomerAccount,
} from "@/lib/account/delete-account";

const USER = "11111111-1111-4111-8111-111111111111";
const ESTIMATE = "22222222-2222-4222-8222-222222222222";

describe("deleteCustomerAccount", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.delete).mockReset();
    vi.mocked(prisma.estimate.update).mockReset();
    vi.mocked(prisma.lead.updateMany).mockReset();
    vi.mocked(prisma.$transaction).mockReset();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
  });

  it("snapshots client details, unlinks estimates, and deletes the user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: USER,
      role: UserRole.CUSTOMER,
      email: "ada@example.com",
      name: "Ada",
      phone: "082 000 0000",
      preferredContact: "email",
      organisation: "Acme",
      jobTitle: "Founder",
      city: "Polokwane",
      province: "LP",
      organisationType: "startup",
      industry: "other",
      teamSize: "just_me",
      referralSource: "google",
      estimates: [
        {
          id: ESTIMATE,
          lead: {
            name: "Ada",
            email: "ada@example.com",
            company: "Acme",
            phone: "082 000 0000",
            preferredNextStep: "email",
          },
        },
      ],
    } as never);
    vi.mocked(prisma.estimate.update).mockResolvedValue({} as never);
    vi.mocked(prisma.lead.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.user.delete).mockResolvedValue({} as never);

    await deleteCustomerAccount(USER);

    expect(prisma.estimate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ESTIMATE },
        data: expect.objectContaining({
          userId: null,
          savedToProfileAt: null,
          clientSnapshot: expect.objectContaining({
            name: "Ada",
            email: "ada@example.com",
            organisation: "Acme",
          }),
          creatorAccountDeletedAt: expect.any(Date),
        }),
      }),
    );
    expect(prisma.lead.updateMany).toHaveBeenCalledWith({
      where: { userId: USER },
      data: { userId: null },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: USER } });
  });

  it("refuses to delete an admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: USER,
      role: UserRole.ADMIN,
      email: "admin@example.com",
      name: "Admin",
      phone: null,
      preferredContact: null,
      organisation: null,
      jobTitle: null,
      city: null,
      province: null,
      organisationType: null,
      industry: null,
      teamSize: null,
      referralSource: null,
      estimates: [],
    } as never);

    await expect(deleteCustomerAccount(USER)).rejects.toBeInstanceOf(
      DeleteAccountError,
    );
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});
