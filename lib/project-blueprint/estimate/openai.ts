/**
 * OpenAI adapter for the planning estimate. May return money in structured JSON.
 */

import "server-only";

import { runtimeEnv } from "@/lib/env/runtime";

import { completeChatJson } from "../ai/complete-json";
import { DEFAULT_ESTIMATE_MODEL } from "./constants";

export function isAiEstimateEnabled(): boolean {
  if (!runtimeEnv("OPENAI_API_KEY")) return false;
  if (runtimeEnv("PROJECT_BLUEPRINT_AI_ESTIMATE_ENABLED") === "false") {
    return false;
  }
  return true;
}

export function resolveEstimateModel(): string {
  return runtimeEnv("PROJECT_BLUEPRINT_AI_ESTIMATE_MODEL") ?? DEFAULT_ESTIMATE_MODEL;
}

export async function completeEstimateJson(
  system: string,
  user: string,
): Promise<unknown> {
  const apiKey = runtimeEnv("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  return completeChatJson({
    apiKey,
    model: resolveEstimateModel(),
    system,
    user,
    temperature: 0.2,
  });
}
