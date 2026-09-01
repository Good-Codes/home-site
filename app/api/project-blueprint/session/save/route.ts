import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getSessionCookieName,
  hashToken,
  tokensMatch,
} from "@/lib/project-blueprint/session";
import { createAdminClient } from "@/lib/supabase/admin";

const saveSchema = z.object({
  sessionId: z.string().uuid(),
  answers: z.record(z.string(), z.unknown()),
  resumeToken: z.string().min(20).optional(),
  step: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = saveSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid save payload." }, { status: 400 });
    }

    const cookieToken = request.headers
      .get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${getSessionCookieName()}=`))
      ?.split("=")[1];

    const token = parsed.data.resumeToken ?? cookieToken;
    if (!token) {
      return NextResponse.json({ error: "Missing session token." }, { status: 401 });
    }

    const tokenHash = hashToken(decodeURIComponent(token));

    try {
      const supabase = createAdminClient();
      const { data: session, error } = await supabase
        .from("estimate_sessions")
        .select("id, token_hash, expires_at")
        .eq("id", parsed.data.sessionId)
        .maybeSingle();

      if (error) throw error;
      if (!session) {
        return NextResponse.json({ ok: true, persisted: false });
      }
      if (!tokensMatch(session.token_hash, tokenHash)) {
        return NextResponse.json({ error: "Invalid session." }, { status: 403 });
      }
      if (new Date(session.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: "Session expired." }, { status: 410 });
      }

      await supabase
        .from("estimate_sessions")
        .update({
          answers: parsed.data.answers,
          current_step: parsed.data.step ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      await supabase.from("answer_revisions").insert({
        session_id: session.id,
        answers: parsed.data.answers,
      });

      return NextResponse.json({ ok: true, persisted: true });
    } catch {
      return NextResponse.json({ ok: true, persisted: false });
    }
  } catch (error) {
    console.error("session save failed", error);
    return NextResponse.json({ error: "Unable to save progress." }, { status: 500 });
  }
}
