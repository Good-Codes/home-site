/**
 * Optional OpenAI adapter — server routes only.
 * Gated by PROJECT_BLUEPRINT_AI_CLASSIFIER_ENABLED + OPENAI_API_KEY.
 * Never returns prices.
 */

import "server-only";

import { z } from "zod";

import type { IdeaClassificationResult } from "../types";
import { classifyIdeaKeywords } from "./keyword";

const suggestionSchema = z.object({
  id: z.string().min(1).max(120),
  category: z.enum([
    "product_type",
    "surface",
    "capability",
    "integration",
    "user_group",
    "risk",
    "starting_point",
    "quality",
  ]),
  label: z.string().min(1).max(160),
  rationale: z.string().min(1).max(500),
  confidence: z.enum(["high", "moderate", "low"]),
});

const aiPayloadSchema = z.object({
  suggestions: z.array(suggestionSchema).max(20),
  questionsRequiringConfirmation: z.array(z.string().min(1).max(120)).max(40),
  notes: z.array(z.string().min(1).max(400)).max(12).optional(),
});

function isAiClassifierEnabled(): boolean {
  return (
    process.env.PROJECT_BLUEPRINT_AI_CLASSIFIER_ENABLED === "true" &&
    Boolean(process.env.OPENAI_API_KEY)
  );
}

/**
 * Optional OpenAI adapter for idea classification (legacy classify route).
 * Returns taxonomy suggestions only — never prices or numeric estimates.
 * Falls back to keyword classification on any failure or when disabled.
 */
export async function classifyIdeaWithAi(
  ideaText: string,
): Promise<IdeaClassificationResult | null> {
  if (!isAiClassifierEnabled()) return null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model =
    process.env.PROJECT_BLUEPRINT_AI_CLASSIFIER_MODEL ?? "gpt-4o-mini";

  try {
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
          {
            role: "system",
            content: [
              "You classify custom software project ideas into planning taxonomy suggestions.",
              "Return JSON only with keys: suggestions, questionsRequiringConfirmation, notes.",
              "Each suggestion needs: id, category, label, rationale, confidence (high|moderate|low).",
              "Categories: product_type, surface, capability, integration, user_group, risk, starting_point, quality.",
              "Never invent prices, budgets, hour counts, timelines, rates, or numeric estimates.",
              "Suggestions are confirmable chips only — the user must approve before they affect scope.",
            ].join(" "),
          },
          {
            role: "user",
            content: ideaText.slice(0, 4000),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI classifier HTTP error", response.status);
      return null;
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsedJson: unknown = JSON.parse(content);
    const validated = aiPayloadSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.error("AI classifier Zod rejection", validated.error.flatten());
      return null;
    }

    // Strip any accidental pricing language from notes.
    const notes = (validated.data.notes ?? []).filter(
      (note) => !/\b(R\s?\d|ZAR|price|cost|budget|quote|estimate\s+of)\b/i.test(note),
    );

    return {
      suggestions: validated.data.suggestions.map((s) => ({
        ...s,
        requiresConfirmation: true as const,
      })),
      questionsRequiringConfirmation:
        validated.data.questionsRequiringConfirmation,
      notes:
        notes.length > 0
          ? notes
          : [
              "These are planning suggestions only. Confirm or correct each one before continuing.",
              "No investment range is generated from text alone.",
            ],
    };
  } catch (error) {
    console.error("AI classifier failed", error);
    return null;
  }
}

/**
 * Prefer AI when enabled; always fall back to deterministic keywords.
 */
export async function classifyIdeaWithAiOrKeywords(
  ideaText: string,
): Promise<IdeaClassificationResult> {
  const ai = await classifyIdeaWithAi(ideaText);
  if (ai && ai.suggestions.length > 0) return ai;
  return classifyIdeaKeywords(ideaText);
}
