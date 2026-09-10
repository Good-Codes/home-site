import { z } from "zod";

const moneyRangeSchema = z.object({
  low: z.number().finite(),
  likely: z.number().finite(),
  high: z.number().finite(),
});

const timelineSchema = z.object({
  minimumWeeks: z.number().finite(),
  likelyWeeks: z.number().finite(),
  maximumWeeks: z.number().finite().optional(),
});

export const estimateModelPayloadSchema = z.object({
  kind: z.enum(["custom_build", "discovery_first", "website_handoff"]),
  productSummary: z.string().min(1).max(240),
  concept: z
    .object({
      headline: z.string().min(1).max(180),
      summary: z.string().min(1).max(1600),
      whoItsFor: z.string().min(1).max(500),
      coreCapabilities: z.array(z.string().min(1).max(160)).max(12).default([]),
      assumptions: z.array(z.string().min(1).max(280)).max(10).default([]),
    })
    .optional(),
  range: moneyRangeSchema,
  timeline: timelineSchema,
  confidence: z.object({
    level: z.enum(["high", "moderate", "early"]),
    explanation: z.string().min(1).max(800),
    unknowns: z.array(z.string().min(1).max(240)).max(12).default([]),
    improvements: z.array(z.string().min(1).max(240)).max(12).default([]),
  }),
  costDrivers: z
    .array(
      z.object({
        id: z.string().min(1).max(80).optional(),
        title: z.string().min(1).max(120),
        explanation: z.string().min(1).max(400),
      }),
    )
    .max(8)
    .default([]),
  exclusions: z.array(z.string().min(1).max(240)).max(12).default([]),
  phaseBreakdown: z
    .array(
      z.object({
        id: z.string().min(1).max(80).optional(),
        name: z.string().min(1).max(120),
        description: z.string().max(280).optional(),
        share: z.number().finite().optional(),
      }),
    )
    .max(8)
    .optional()
    .default([]),
  alternativeScenarios: z
    .array(
      z.object({
        id: z.string().min(1).max(40).optional(),
        name: z.string().min(1).max(80),
        summary: z.string().min(1).max(280),
        range: moneyRangeSchema,
        timeline: timelineSchema.optional(),
      }),
    )
    .max(3)
    .optional()
    .default([]),
  discoveryRecommended: z.boolean().default(false),
  discoverySummary: z.string().max(800).optional(),
  discoveryRange: moneyRangeSchema.optional(),
  nextStepRecommendation: z.string().min(1).max(500),
});

export type EstimateModelPayload = z.infer<typeof estimateModelPayloadSchema>;
