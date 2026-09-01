import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createResumeToken,
  getSessionCookieName,
  hashToken,
  sessionExpiryDate,
} from "@/lib/project-blueprint/session";
import { createAdminClient } from "@/lib/supabase/admin";

const createSchema = z.object({
  answers: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid session payload." }, { status: 400 });
    }

    const token = createResumeToken();
    const tokenHash = hashToken(token);
    const expiresAt = sessionExpiryDate(30).toISOString();

    let sessionId: string | null = null;

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("estimate_sessions")
        .insert({
          token_hash: tokenHash,
          status: "in_progress",
          answers: parsed.data.answers ?? {},
          expires_at: expiresAt,
        })
        .select("id")
        .single();

      if (error) throw error;
      sessionId = data.id;
    } catch {
      // Allow local/demo use without Supabase by returning an ephemeral session.
      sessionId = crypto.randomUUID();
    }

    const response = NextResponse.json({
      sessionId,
      resumeToken: token,
      expiresAt,
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(expiresAt),
    });

    return response;
  } catch (error) {
    console.error("session create failed", error);
    return NextResponse.json(
      { error: "Unable to start an estimate session." },
      { status: 500 },
    );
  }
}
