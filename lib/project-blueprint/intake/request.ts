import { z } from "zod";

import { projectBlueprintAnswersSchema } from "../answers";

export const intakeClarificationSchema = z.object({
  questionId: z.string().min(1).max(80),
  values: z.array(z.string().min(1).max(120)).max(12),
});

export const intakeRequestSchema = z.object({
  ideaText: z.string().min(20).max(4000),
  round: z.number().int().min(0).max(2).optional(),
  clarifications: z.array(intakeClarificationSchema).max(6).optional().nullable(),
  previousAnswers: projectBlueprintAnswersSchema.optional().nullable(),
  askedQuestionIds: z.array(z.string().min(1).max(80)).max(16).optional().nullable(),
  estimateId: z.string().uuid().optional().nullable(),
  sessionId: z.string().uuid().optional().nullable(),
});
