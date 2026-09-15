import { NextResponse } from "next/server";
import { z } from "zod";

import { PASSWORD_RESET_SUCCESS_MESSAGE } from "@/lib/auth/constants";
import {
  PasswordResetError,
  requestPasswordReset,
} from "@/lib/auth/password-reset";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  const email =
    parsed.success ? parsed.data.email.trim().toLowerCase() : "invalid";
  const key = `forgot-password:${clientKeyFromRequest(request)}:${email}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many reset requests. Please wait a few minutes." },
      { status: 429 },
    );
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const result = await requestPasswordReset(parsed.data.email);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PasswordResetError && error.code === "VALIDATION") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("forgot password failed", error);
    return NextResponse.json({
      ok: true,
      message: PASSWORD_RESET_SUCCESS_MESSAGE,
    });
  }
}
