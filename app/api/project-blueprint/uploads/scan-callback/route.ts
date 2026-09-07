import { createHmac, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { isDatabaseConfigured, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  uploadId: z.string().uuid().optional(),
  path: z.string().min(1).max(500).optional(),
  status: z.enum(["pending", "clean", "infected", "error", "skipped"]),
  detail: z.record(z.string(), z.unknown()).optional(),
});

function headerValue(request: Request, name: string): string | null {
  return request.headers.get(name) ?? request.headers.get(name.toLowerCase());
}

function verifyWebhookSecret(request: Request, rawBody: string): boolean {
  const secret = process.env.ATTACHMENT_SCANNER_WEBHOOK_SECRET;
  // Secret unset — allow callback (demo / local); fail closed only when secret is configured.
  if (!secret) return true;

  const signature =
    headerValue(request, "x-attachment-scanner-signature") ??
    headerValue(request, "x-webhook-signature") ??
    headerValue(request, "x-hub-signature-256");

  const bearer = headerValue(request, "authorization");
  const headerSecret =
    headerValue(request, "x-attachment-scanner-secret") ??
    (bearer?.toLowerCase().startsWith("bearer ")
      ? bearer.slice(7).trim()
      : null);

  if (headerSecret) {
    const left = Buffer.from(headerSecret);
    const right = Buffer.from(secret);
    if (left.length === right.length && timingSafeEqual(left, right)) {
      return true;
    }
  }

  if (!signature) return false;

  const provided = signature.replace(/^sha256=/i, "").trim();
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const left = Buffer.from(provided, "hex");
    const right = Buffer.from(expected, "hex");
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

/**
 * Malware-scanner webhook. Verifies HMAC/secret when configured; updates scanStatus.
 * Demo no-op is OK when the database is unset.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyWebhookSecret(request, rawBody)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let json: unknown = null;
  try {
    json = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid scan callback payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { uploadId, path, status, detail } = parsed.data;
  if (!uploadId && !path) {
    return NextResponse.json(
      { error: "uploadId or path is required." },
      { status: 400 },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      demo: true,
      warning: "Scan callback accepted (database unset). No row updated.",
    });
  }

  try {
    const data = await prisma.uploadedBrief.updateMany({
      where: uploadId
        ? { id: uploadId }
        : path
          ? { storagePath: path }
          : { id: "__none__" },
      data: {
        scanStatus: status,
        scanDetail: (detail ?? {}) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      ok: true,
      updated: data.count > 0,
      status,
    });
  } catch (error) {
    console.error("scan callback failed", error);
    return NextResponse.json(
      { error: "Unable to process scan callback." },
      { status: 500 },
    );
  }
}
