import "server-only";

import type { IdeaClassificationResult } from "../types";
import { classifyIdeaKeywords } from "./keyword";

export { classifyIdeaKeywords } from "./keyword";
export {
  classifyIdeaWithAi,
  classifyIdeaWithAiOrKeywords,
} from "./ai";

/**
 * Classify free-text idea into taxonomy suggestions.
 * Tries optional AI adapter when enabled, then falls back to keywords.
 * Never returns prices. Server-only — use classifyIdeaKeywords on the client.
 */
export async function classifyIdea(
  ideaText: string,
): Promise<IdeaClassificationResult> {
  try {
    if (
      process.env.PROJECT_BLUEPRINT_AI_CLASSIFIER_ENABLED === "true" &&
      process.env.OPENAI_API_KEY
    ) {
      const { classifyIdeaWithAiOrKeywords } = await import("./ai");
      return await classifyIdeaWithAiOrKeywords(ideaText);
    }
  } catch {
    // Fall through to keywords.
  }
  return classifyIdeaKeywords(ideaText);
}
