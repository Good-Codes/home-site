import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminUserDetail } from "@/lib/auth/admin-users";
import { isDatabaseConfigured } from "@/lib/db";
import { requireAdmin } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

  const rawParams = await context.params;
  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const user = await getAdminUserDetail(parsedParams.data.id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}
