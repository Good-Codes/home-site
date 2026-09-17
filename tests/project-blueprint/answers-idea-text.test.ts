import { describe, expect, it } from "vitest";

import {
  IDEA_TEXT_MAX,
  normalizeAnswers,
  projectBlueprintAnswersSchema,
} from "@/lib/project-blueprint/answers";

describe("ideaText limits", () => {
  it("rejects idea text over 4000 characters", () => {
    const parsed = projectBlueprintAnswersSchema.safeParse({
      ideaText: "a".repeat(IDEA_TEXT_MAX + 1),
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts idea text at the limit", () => {
    const ideaText = "We need a portal. ".repeat(200).slice(0, IDEA_TEXT_MAX);
    expect(
      normalizeAnswers({ ideaText }).ideaText?.length,
    ).toBeLessThanOrEqual(IDEA_TEXT_MAX);
  });
});
