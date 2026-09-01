import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BLUEPRINT_EVENT_NAMES,
  trackBlueprintEvent,
} from "@/lib/project-blueprint/analytics/events";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  event: z.enum(BLUEPRINT_EVENT_NAMES),
  properties: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().uuid().optional(),
});

/**
 * Public analytics beacon. Accepts non-sensitive funnel events only.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid analytics payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Fire-and-forget — always acknowledge so beacons never block UX.
  void trackBlueprintEvent(parsed.data.event, parsed.data.properties, {
    sessionId: parsed.data.sessionId,
  });

  return NextResponse.json({ ok: true });
}
