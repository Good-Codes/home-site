/**
 * OpenAI adapter for Project Blueprint intake.
 * Returns structured concept + taxonomy answers. Never prices.
 */

import "server-only";

import { z } from "zod";

const unknownChoiceSchema = z.enum([
  "not_sure",
  "help_me_choose",
  "need_advice",
  "unknown",
]);

const answersPatchSchema = z.object({
  route: z.string().nullable().optional(),
  startingPoint: z.string().nullable().optional(),
  primaryOutcome: z.string().nullable().optional(),
  surfaces: z.array(z.string()).max(8).optional(),
  userGroups: z.array(z.string()).max(8).optional(),
  userScale: z.string().nullable().optional(),
  roleCountBand: z.string().nullable().optional(),
  roleBasedPermissions: z
    .union([z.boolean(), unknownChoiceSchema, z.null()])
    .optional(),
  multiTenant: z.union([z.boolean(), unknownChoiceSchema, z.null()]).optional(),
  capabilities: z.array(z.string()).max(20).optional(),
  integrations: z.array(z.string()).max(12).optional(),
  migrationProfile: z.string().nullable().optional(),
  qualityRequirements: z.array(z.string()).max(12).optional(),
  productLevel: z.string().nullable().optional(),
  timing: z.string().nullable().optional(),
  existingAssets: z.array(z.string()).max(10).optional(),
  unknowns: z.record(z.string(), unknownChoiceSchema).optional(),
});

export const openaiIntakePayloadSchema = z.object({
  status: z.enum(["needs_clarification", "ready", "website_handoff"]),
  concept: z.object({
    headline: z.string().min(1).max(180),
    summary: z.string().min(1).max(1600),
    whoItsFor: z.string().min(1).max(500),
    coreCapabilities: z.array(z.string().min(1).max(160)).max(12),
    assumptions: z.array(z.string().min(1).max(280)).max(10),
  }),
  answers: answersPatchSchema,
  clarifyingQuestionIds: z.array(z.string().min(1).max(80)).max(3).optional(),
});

export type OpenAiIntakePayload = z.infer<typeof openaiIntakePayloadSchema>;

export function isAiIntakeEnabled(): boolean {
  if (!process.env.OPENAI_API_KEY) return false;
  if (process.env.PROJECT_BLUEPRINT_AI_INTAKE_ENABLED === "false") return false;
  if (process.env.PROJECT_BLUEPRINT_AI_CLASSIFIER_ENABLED === "false") {
    return process.env.PROJECT_BLUEPRINT_AI_INTAKE_ENABLED === "true";
  }
  return true;
}

export type CompleteJsonFn = (
  system: string,
  user: string,
) => Promise<unknown>;

export async function completeIntakeJson(
  system: string,
  user: string,
): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const model =
    process.env.PROJECT_BLUEPRINT_AI_INTAKE_MODEL ??
    process.env.PROJECT_BLUEPRINT_AI_CLASSIFIER_MODEL ??
    "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI intake HTTP ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI intake empty content");
  return JSON.parse(content) as unknown;
}

export function parseOpenAiIntakePayload(
  value: unknown,
): OpenAiIntakePayload | null {
  const parsed = openaiIntakePayloadSchema.safeParse(value);
  if (!parsed.success) {
    console.error("AI intake Zod rejection", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}
