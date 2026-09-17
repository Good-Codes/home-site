import "server-only";

import { Prisma, UserRole } from "@prisma/client";

import {
  PROFILE_SELECT,
  snapshotFromUserAndLead,
  type LeadContactRow,
} from "@/lib/account/profile";
import { isDatabaseConfigured, prisma } from "@/lib/db";

export class DeleteAccountError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "FORBIDDEN" | "UNAVAILABLE",
  ) {
    super(message);
    this.name = "DeleteAccountError";
  }
}

export async function deleteCustomerAccount(userId: string): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new DeleteAccountError(
      "Accounts are temporarily unavailable.",
      "UNAVAILABLE",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      ...PROFILE_SELECT,
      estimates: {
        select: {
          id: true,
          lead: {
            select: {
              name: true,
              email: true,
              company: true,
              phone: true,
              preferredNextStep: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new DeleteAccountError("Account not found.", "NOT_FOUND");
  }
  if (user.role !== UserRole.CUSTOMER) {
    throw new DeleteAccountError(
      "Staff accounts cannot be deleted here.",
      "FORBIDDEN",
    );
  }

  const profile = {
    email: user.email,
    name: user.name,
    phone: user.phone,
    preferredContact: user.preferredContact,
    organisation: user.organisation,
    jobTitle: user.jobTitle,
    city: user.city,
    province: user.province,
    organisationType: user.organisationType,
    industry: user.industry,
    teamSize: user.teamSize,
    referralSource: user.referralSource,
  };

  await prisma.$transaction(async (tx) => {
    for (const estimate of user.estimates) {
      const lead: LeadContactRow | null = estimate.lead
        ? {
            name: estimate.lead.name,
            email: estimate.lead.email,
            company: estimate.lead.company,
            phone: estimate.lead.phone,
            preferredNextStep: estimate.lead.preferredNextStep,
          }
        : null;
      const snapshot = snapshotFromUserAndLead(profile, lead);
      await tx.estimate.update({
        where: { id: estimate.id },
        data: {
          userId: null,
          savedToProfileAt: null,
          clientSnapshot: snapshot as Prisma.InputJsonValue,
          creatorAccountDeletedAt: new Date(),
        },
      });
    }

    await tx.lead.updateMany({
      where: { userId },
      data: { userId: null },
    });

    await tx.user.delete({ where: { id: userId } });
  });
}
