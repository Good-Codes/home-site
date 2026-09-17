import { NextResponse } from "next/server";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { isAccountLocked } from "@/lib/auth/lock";
import { requireAdmin } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are temporarily unavailable." },
      { status: 503 },
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      adminLocked: true,
      failedLoginCount: true,
      lockedUntil: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      adminLocked: user.adminLocked,
      locked: isAccountLocked(user),
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    })),
  });
}
