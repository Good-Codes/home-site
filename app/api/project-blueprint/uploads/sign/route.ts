import { NextResponse } from "next/server";
import { z } from "zod";

import { isDatabaseConfigured, prisma } from "@/lib/db";
import { requireUser } from "@/lib/project-blueprint/auth/admin";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const bodySchema = z.object({
  estimateId: z.string().uuid(),
  mime: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive().max(MAX_BYTES),
  filename: z.string().trim().min(1).max(260).optional(),
  consent: z.literal(true),
});

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

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!process.env.ATTACHMENT_SCANNER_API_TOKEN) {
    return uploadsUnavailable();
  }
  if (!isDatabaseConfigured()) {
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

  const owned = await prisma.estimate.findFirst({
    where: { id: body.estimateId, userId: auth.user.id },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  const uploadId = crypto.randomUUID();
  const safeName = (body.filename ?? "brief")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 80);
  const path = `quarantine/${owned.id}/${uploadId}-${safeName}`;

  try {
    await prisma.uploadedBrief.create({
      data: {
        id: uploadId,
        estimateId: owned.id,
        storagePath: path,
        originalFilename: body.filename ?? null,
        mime,
        sizeBytes: BigInt(body.sizeBytes),
        scanStatus: "pending",
        consent: true,
        consentAt: new Date(),
      },
    });

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
