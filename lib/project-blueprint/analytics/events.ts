import "server-only";

import { Prisma } from "@prisma/client";

import { isDatabaseConfigured, prisma } from "@/lib/db";

/**
 * Privacy-conscious Project Blueprint funnel events.
 * Never attach idea text, PII, raw answers, filenames, rates, or margins.
 */
export const BLUEPRINT_EVENT_NAMES = [
  "estimator_viewed",
  "estimator_started",
  "route_selected",
  "step_viewed",
  "step_completed",
  "unknown_selected",
  "help_opened",
  "intake_submitted",
  "intake_clarification_requested",
  "intake_ready",
  "intake_website_handoff",
  "ai_suggestions_confirmed",
  "review_viewed",
  "estimate_generated",
  "estimator_generated",
  "scenario_changed",
  "optional_scope_changed",
  "estimate_emailed",
  "estimate_downloaded",
  "reviewed_quote_requested",
  "call_booking_started",
  "call_booked",
  "estimator_abandoned",
  "estimator_resumed",
  "mode_selected",
  "screen_completed",
  "estimate_calculated",
  "scenario_viewed",
  "lead_submitted",
  "document_emailed",
  "pdf_downloaded",
  "upload_started",
  "upload_clean",
  "session_resumed",
  "session_expired",
  "admin_quote_issued",
] as const;

export type BlueprintEventName = (typeof BLUEPRINT_EVENT_NAMES)[number];

const EVENT_SET = new Set<string>(BLUEPRINT_EVENT_NAMES);

const SENSITIVE_KEYS = new Set([
  "ideaText",
  "idea_text",
  "email",
  "name",
  "answers",
  "rates",
  "phone",
  "company",
  "filename",
  "originalFilename",
  "original_filename",
  "margins",
  "trace",
  "privateTrace",
  "password",
  "token",
  "resumeToken",
]);

export function isBlueprintEventName(value: string): value is BlueprintEventName {
  return EVENT_SET.has(value);
}

function stripSensitive(
  properties: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!properties) return {};
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    if (value === undefined) continue;
    if (key === "contact" || key === "lead" || key === "payload") continue;
    cleaned[key] = value;
  }
  return cleaned;
}

export type TrackBlueprintEventOptions = {
  sessionId?: string | null;
  estimateId?: string | null;
};

export async function trackBlueprintEvent(
  name: string,
  properties?: Record<string, unknown>,
  options?: TrackBlueprintEventOptions,
): Promise<void> {
  try {
    if (!isBlueprintEventName(name)) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[blueprint analytics] unknown event", name);
      }
      return;
    }

    const safeProperties = stripSensitive(properties);
    const estimateId =
      typeof options?.estimateId === "string" && options.estimateId.length > 0
        ? options.estimateId
        : typeof options?.sessionId === "string" && options.sessionId.length > 0
          ? options.sessionId
          : typeof safeProperties.sessionId === "string"
            ? safeProperties.sessionId
            : null;

    const { sessionId: _omit, ...rest } = safeProperties;
    void _omit;

    if (isDatabaseConfigured()) {
      try {
        await prisma.analyticsEvent.create({
          data: {
            eventName: name,
            estimateId: estimateId && zUuid(estimateId) ? estimateId : null,
            properties: rest as Prisma.InputJsonValue,
          },
        });
        return;
      } catch (error) {
        console.error("[blueprint analytics] persist failed", error);
        return;
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.info("[blueprint analytics]", name, {
        estimateId,
        properties: rest,
      });
    }
  } catch (error) {
    console.error("[blueprint analytics] unexpected failure", error);
  }
}

function zUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
