import { NextResponse } from "next/server";
import { z } from "zod";

import {
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/project-blueprint/auth/admin";
import {
  getSessionCookieName,
  hashToken,
  tokensMatch,
} from "@/lib/project-blueprint/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  resumeToken: z.string().min(20).optional(),
  mime: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive().max(MAX_BYTES),
  filename: z.string().trim().min(1).max(260).optional(),
  consent: z.literal(true),
});

function readCookieToken(request: Request): string | undefined {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${getSessionCookieName()}=`))
    ?.split("=")[1];
}

function uploadsUnavailable() {
  return NextResponse.json(
    {
      error:
        "File uploads are temporarily unavailable. You can continue with the estimator without uploading a brief.",
      code: "UPLOADS_UNAVAILABLE",
    },
    { status: 503 },
  );
}

/**
 * Sign a private quarantine upload. Fail closed when scanner/storage is unset;
 * the estimator remains usable without uploads.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !hasServiceRole()) {
    return uploadsUnavailable();
  }
  if (!process.env.ATTACHMENT_SCANNER_API_TOKEN) {
    return uploadsUnavailable();
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Upload request invalid. Allowed types: PDF, PNG, JPG, DOCX; max 10MB; consent required.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const mime = body.mime.toLowerCase() === "image/jpg" ? "image/jpeg" : body.mime;
  if (!ALLOWED_MIME.has(mime) && !ALLOWED_MIME.has(body.mime)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PDF, PNG, JPG, or DOCX." },
      { status: 400 },
    );
  }

  const cookieToken = readCookieToken(request);
  const token = body.resumeToken ?? cookieToken;
  if (!token) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const tokenHash = hashToken(decodeURIComponent(token));

  try {
    const admin = createAdminClient();
    const { data: session, error: sessionError } = await admin
      .from("estimate_sessions")
      .select("id, token_hash, expires_at")
      .eq("id", body.sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid session." }, { status: 403 });
    }
    if (!tokensMatch(session.token_hash, tokenHash)) {
      return NextResponse.json({ error: "Invalid session." }, { status: 403 });
    }
    if (new Date(session.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Session expired." }, { status: 410 });
    }

    const uploadId = crypto.randomUUID();
    const safeName = (body.filename ?? "brief")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 80);
    const path = `quarantine/${session.id}/${uploadId}-${safeName}`;
    const consentAt = new Date().toISOString();

    const { error: insertError } = await admin.from("uploaded_briefs").insert({
      id: uploadId,
      session_id: session.id,
      storage_path: path,
      original_filename: body.filename ?? null,
      mime,
      size_bytes: body.sizeBytes,
      scan_status: "pending",
      consent: true,
      consent_at: consentAt,
    });

    if (insertError) {
      console.error("upload sign insert failed", insertError);
      return NextResponse.json(
        { error: "Unable to prepare upload right now." },
        { status: 500 },
      );
    }

    // Stub signed URL fields — real storage signing lands with scanner provider wiring.
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "https://www.goodcode.co.za";
    const uploadUrl = `${siteUrl}/api/project-blueprint/uploads/stub-put?path=${encodeURIComponent(path)}&uploadId=${uploadId}`;

    return NextResponse.json({
      uploadUrl,
      path,
      uploadId,
    });
  } catch (error) {
    console.error("upload sign failed", error);
    return uploadsUnavailable();
  }
}
