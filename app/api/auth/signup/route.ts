import { NextResponse } from "next/server";
import { z } from "zod";

import {
  AUTH_RATE_LIMIT_NAT_MAX_HITS,
  PASSWORD_MIN_LENGTH,
} from "@/lib/auth/constants";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import { RegisterError, registerCustomer } from "@/lib/auth/register";
import { sanitizePersonName } from "@/lib/security/text";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const name = sanitizePersonName(value);
      return name.length ? name : undefined;
    }),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(200),
  confirmPassword: z.string().min(PASSWORD_MIN_LENGTH).max(200),
  role: z.unknown().optional(),
});

export async function POST(request: Request) {
  const ipKey = `signup:ip:${clientKeyFromRequest(request)}`;
  if (!checkAuthRateLimit(ipKey, AUTH_RATE_LIMIT_NAT_MAX_HITS)) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Check your details. Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const emailKey = `signup:email:${parsed.data.email.trim().toLowerCase()}`;
  if (!checkAuthRateLimit(emailKey)) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please wait a few minutes." },
      { status: 429 },
    );
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: 400 },
    );
  }

  try {
    const user = await registerCustomer({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      role: parsed.data.role,
    });
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof RegisterError) {
      const status =
        error.code === "CONFLICT"
          ? 409
          : error.code === "UNAVAILABLE"
            ? 503
            : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("signup failed", error);
    return NextResponse.json(
      { error: "Unable to create your account right now." },
      { status: 500 },
    );
  }
}
