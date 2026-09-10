/**
 * OpenAI adapter for the planning estimate. May return money in structured JSON.
 */

import "server-only";

import { completeChatJson } from "../ai/complete-json";
import { DEFAULT_ESTIMATE_MODEL } from "./constants";

export function isAiEstimateEnabled(): boolean {
  if (!process.env.OPENAI_API_KEY) return false;
  if (process.env.PROJECT_BLUEPRINT_AI_ESTIMATE_ENABLED === "false") return false;
  return true;
}

export function resolveEstimateModel(): string {
  return process.env.PROJECT_BLUEPRINT_AI_ESTIMATE_MODEL ?? DEFAULT_ESTIMATE_MODEL;
}

export async function completeEstimateJson(
  system: string,
  user: string,
): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  return completeChatJson({
    apiKey,
    model: resolveEstimateModel(),
    system,
    user,
    temperature: 0.2,
  });
}
