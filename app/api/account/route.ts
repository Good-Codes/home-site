import { NextResponse } from "next/server";

import {
  DeleteAccountError,
  deleteCustomerAccount,
} from "@/lib/account/delete-account";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import { requireCustomer } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const auth = await requireCustomer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const key = `delete-account:${auth.user.id}:${clientKeyFromRequest(request)}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  try {
    await deleteCustomerAccount(auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DeleteAccountError) {
      const status =
        error.code === "FORBIDDEN"
          ? 403
          : error.code === "UNAVAILABLE"
            ? 503
            : 404;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("delete account failed", error);
    return NextResponse.json(
      { error: "Unable to delete your account right now." },
      { status: 500 },
    );
  }
}
