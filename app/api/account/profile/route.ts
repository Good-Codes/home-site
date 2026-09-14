import { NextResponse } from "next/server";

import {
  PROFILE_SELECT,
  profileUpdateSchema,
  toCustomerProfile,
} from "@/lib/account/profile";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are temporarily unavailable." },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: PROFILE_SELECT,
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  return NextResponse.json({ profile: toCustomerProfile(user) });
}

export async function PUT(request: Request) {
  const auth = await requireCustomer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are temporarily unavailable." },
      { status: 503 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check your details.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      preferredContact: parsed.data.preferredContact,
      organisation: parsed.data.organisation,
      jobTitle: parsed.data.jobTitle,
      city: parsed.data.city,
      province: parsed.data.province,
      organisationType: parsed.data.organisationType,
      industry: parsed.data.industry,
      teamSize: parsed.data.teamSize,
      referralSource: parsed.data.referralSource,
    },
    select: PROFILE_SELECT,
  });

  return NextResponse.json({ profile: toCustomerProfile(user) });
}
