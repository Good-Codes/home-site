import { NextResponse } from "next/server";
import { z } from "zod";

import { PASSWORD_MIN_LENGTH } from "@/lib/auth/constants";
import { PasswordResetError, resetPassword } from "@/lib/auth/password-reset";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().trim().min(1).max(512),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(200),
  confirmPassword: z.string().min(PASSWORD_MIN_LENGTH).max(200),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  const tokenPrefix = parsed.success
    ? parsed.data.token.slice(0, 8)
    : "invalid";
  const key = `reset-password:${clientKeyFromRequest(request)}:${tokenPrefix}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many reset attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Check your details. Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    await resetPassword({
      token: parsed.data.token,
      newPassword: parsed.data.newPassword,
      confirmPassword: parsed.data.confirmPassword,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PasswordResetError) {
      const status =
        error.code === "INVALID_TOKEN"
          ? 400
          : error.code === "UNAVAILABLE"
            ? 503
            : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("reset password failed", error);
    return NextResponse.json(
      { error: "Unable to reset your password right now." },
      { status: 500 },
    );
  }
}
