import { describe, expect, it } from "vitest";

import { calculateEstimate } from "@/lib/project-blueprint/engine/calculate";
import { PLACEHOLDER_PRICING_CONFIG } from "@/lib/project-blueprint/engine/config/placeholder";
import { fallbackIntakeDraft, looksLikeMarketingWebsite } from "@/lib/project-blueprint/intake/fallback";
import { checkIntakeRateLimit, resetIntakeRateLimitForTests } from "@/lib/project-blueprint/intake/rate-limit";
import { runIntake } from "@/lib/project-blueprint/intake/run";
import {
  dropIllegalIds,
  fillDefaultsAndUnknowns,
  sanitiseAnswers,
  sanitiseConcept,
  stripPricingLanguage,
} from "@/lib/project-blueprint/intake/sanitise";
import {
  applyClarifications,
  inferGapQuestionIds,
  selectClarifyingQuestions,
} from "@/lib/project-blueprint/intake/whitelist";
import { coerceIntakePayload, toStringList } from "@/lib/project-blueprint/intake/coerce";
import { parseOpenAiIntakePayload } from "@/lib/project-blueprint/intake/openai";
import { intakeRequestSchema } from "@/lib/project-blueprint/intake/request";
import { normalizeAnswers } from "@/lib/project-blueprint/answers";

const RICH_PORTAL = [
  "We need a customer portal where dealerships can upload finance applications,",
  "track progress, receive documents, and process monthly payments after login.",
].join(" ");

function validAiPayload(overrides: Record<string, unknown> = {}) {
  return {
    status: "ready",
    concept: {
      headline: "A dealership finance portal",
      summary:
        "Dealerships upload applications, track progress, and collect monthly payments in a signed-in workspace.",
      whoItsFor: "Dealership staff and the finance team",
      coreCapabilities: [
        "Application uploads",
        "Status tracking",
        "Monthly payments",
      ],
      assumptions: ["First release is web-only."],
    },
    answers: {
      route: "route.customer_portal",
      startingPoint: "start.validated_concept",
      primaryOutcome: "outcome.reduce_manual_work",
      surfaces: ["surface.customer_portal", "surface.admin_workspace"],
      userGroups: ["users.partners", "users.employees"],
      capabilities: [
        "cap.access.registration_login",
        "cap.workflow.status_tracking",
        "cap.payments.recurring",
        "cap.data.files",
      ],
      integrations: ["integration.payment_gateway"],
      qualityRequirements: ["quality.financial_info"],
    },
    clarifyingQuestionIds: [],
    ...overrides,
  };
}

describe("intake sanitisation", () => {
  it("drops IDs that are not in the catalogue", () => {
    expect(dropIllegalIds(["cap.payments.one_time", "cap.made_up", "surface.public_web"])).toEqual(
      ["cap.payments.one_time", "surface.public_web"],
    );
  });

  it("strips pricing language from concept copy", () => {
    expect(stripPricingLanguage("A portal priced at R 250000 over 12 weeks")).toMatch(
      /A portal/i,
    );
    expect(stripPricingLanguage("A portal priced at R 250000 over 12 weeks")).not.toMatch(
      /\bR\b|\bweeks\b/i,
    );
  });

  it("rejects pricing language in sanitiseConcept", () => {
    const concept = sanitiseConcept(
      {
        headline: "Portal for R500k",
        summary: "An estimate of 400 hours",
        whoItsFor: "Dealers",
        coreCapabilities: ["Checkout costing R20"],
        assumptions: ["Quote of ZAR 1"],
      },
      normalizeAnswers({ route: "route.customer_portal" }),
    );
    expect(concept.headline).not.toMatch(/R500k|ZAR|hours/i);
    expect(concept.summary).not.toMatch(/400 hours/i);
  });

  it("fills unknowns instead of inventing missing required fields", () => {
    const answers = sanitiseAnswers(
      normalizeAnswers({
        route: "route.custom_web_platform",
        ideaText: "A workflow tool for staff",
      }),
      "A workflow tool for staff",
    );
    expect(answers.unknowns?.["q.context.starting_point"]).toBe("not_sure");
    expect(answers.startingPoint).toBeTruthy();
    expect(answers.surfaces?.length).toBeGreaterThan(0);
  });
});

function sparseNeedsClarification(overrides: Record<string, unknown> = {}) {
  return {
    status: "needs_clarification",
    concept: {
      headline: "A custom business app",
      summary: "A first-release product with a few details still open.",
      whoItsFor: "The team described in the idea",
      coreCapabilities: ["Core workflows"],
      assumptions: ["Some details still need confirmation."],
    },
    answers: {
      route: "route.custom_web_platform",
    },
    clarifyingQuestionIds: [
      "q.surfaces.channels",
      "q.context.starting_point",
      "q.intake.payments",
    ],
    ...overrides,
  };
}

describe("clarifying questions", () => {
  it("returns at most three questions", () => {
    const questions = selectClarifyingQuestions({
      requestedIds: [
        "q.surfaces.channels",
        "q.context.starting_point",
        "q.intake.payments",
        "q.integrations.systems",
        "not-a-real-id",
      ],
      answers: normalizeAnswers({}),
      ideaText: "We want software",
      round: 0,
    });
    expect(questions.length).toBeLessThanOrEqual(3);
    expect(questions.every((q) => q.options.length > 0)).toBe(true);
  });

  it("asks nothing on round 2", () => {
    const questions = selectClarifyingQuestions({
      requestedIds: ["q.surfaces.channels"],
      answers: normalizeAnswers({}),
      ideaText: "We want software",
      round: 2,
    });
    expect(questions).toEqual([]);
  });

  it("applies payment clarifications onto catalogue capabilities", () => {
    const next = applyClarifications(normalizeAnswers({}), [
      { questionId: "q.intake.payments", values: ["pay.recurring"] },
    ]);
    expect(next.capabilities).toEqual(
      expect.arrayContaining([
        "cap.payments.recurring",
        "cap.payments.subscriptions",
      ]),
    );
  });

  it("clears an unknown flag when the user later picks a real option", () => {
    const unsure = applyClarifications(normalizeAnswers({}), [
      { questionId: "q.context.starting_point", values: ["not_sure"] },
    ]);
    expect(unsure.unknowns?.["q.context.starting_point"]).toBe("not_sure");

    const known = applyClarifications(unsure, [
      { questionId: "q.context.starting_point", values: ["start.existing_product"] },
    ]);
    expect(known.startingPoint).toBe("start.existing_product");
    expect(known.unknowns?.["q.context.starting_point"]).toBeUndefined();
  });

  it("does not treat “I’m not sure yet” as a remaining gap", () => {
    const gaps = inferGapQuestionIds(
      normalizeAnswers({
        unknowns: { "q.surfaces.channels": "not_sure" },
      }),
      "We want software for our business",
    );
    expect(gaps).not.toContain("q.surfaces.channels");
    expect(gaps).toEqual(
      expect.arrayContaining(["q.context.starting_point"]),
    );
  });

  it("still asks high-impact gaps on an empty bag before defaults run", () => {
    const questions = selectClarifyingQuestions({
      requestedIds: [],
      answers: normalizeAnswers({}),
      ideaText: "We want software for our business",
      round: 0,
    });
    expect(questions.map((question) => question.id)).toEqual(
      expect.arrayContaining([
        "q.surfaces.channels",
        "q.context.starting_point",
      ]),
    );
  });

  it("skips OpenAI ids the user already answered", () => {
    const questions = selectClarifyingQuestions({
      requestedIds: ["q.surfaces.channels", "q.users.groups"],
      answers: normalizeAnswers({
        surfaces: ["surface.public_web"],
      }),
      ideaText: "We want software for our business",
      round: 1,
      excludeIds: ["q.surfaces.channels"],
    });
    expect(questions.map((question) => question.id)).not.toContain(
      "q.surfaces.channels",
    );
    expect(questions.map((question) => question.id)).toContain("q.users.groups");
  });
});

describe("keyword fallback", () => {
  it("hands a brochure website off to website packages", () => {
    const text = "We need a brochure marketing website and a landing page for our company.";
    expect(looksLikeMarketingWebsite(text, [])).toBe(true);
    const draft = fallbackIntakeDraft(text, normalizeAnswers({}));
    expect(draft.status).toBe("website_handoff");
    expect(draft.answers.route).toBe("route.website");
  });

  it("maps portal language onto answers that the engine can price", () => {
    const draft = fallbackIntakeDraft(RICH_PORTAL, normalizeAnswers({}));
    const answers = sanitiseAnswers(
      normalizeAnswers(draft.answers),
      RICH_PORTAL,
    );
    const estimate = calculateEstimate(answers, PLACEHOLDER_PRICING_CONFIG);
    expect(estimate.publicResult.recommendedScenario.range.likely).toBeGreaterThan(0);
    expect(estimate.publicResult.currency).toBe("ZAR");
  });
});

describe("runIntake", () => {
  it("returns website_handoff when the model classifies a marketing site", async () => {
    const result = await runIntake(
      {
        ideaText:
          "We need a brochure marketing website with a landing page and contact form.",
      },
      {
        completeJson: async () => ({
          status: "website_handoff",
          concept: {
            headline: "A business website",
            summary: "A marketing site with a contact form.",
            whoItsFor: "Prospective customers",
            coreCapabilities: [],
            assumptions: ["No custom product workflows."],
          },
          answers: { route: "route.website" },
          clarifyingQuestionIds: [],
        }),
      },
    );
    expect(result.status).toBe("website_handoff");
    expect(result.answers.route).toBe("route.website");
    expect(result.clarifyingQuestions).toEqual([]);
  });

  it("strips illegal IDs from model output and stays ready for a rich description", async () => {
    const result = await runIntake(
      { ideaText: RICH_PORTAL },
      {
        completeJson: async () =>
          validAiPayload({
            answers: {
              ...validAiPayload().answers,
              capabilities: [
                "cap.payments.recurring",
                "cap.access.registration_login",
                "cap.invented.thing",
              ],
            },
          }),
      },
    );
    expect(result.status).toBe("ready");
    expect(result.answers.capabilities).toContain("cap.payments.recurring");
    expect(result.answers.capabilities).not.toContain("cap.invented.thing");
    expect(result.clarifyingQuestions.length).toBe(0);
  });

  it("caps follow-ups at three and then forces ready on round 2", async () => {
    const first = await runIntake(
      { ideaText: "We want an app for our business." },
      {
        completeJson: async () =>
          validAiPayload({
            status: "needs_clarification",
            answers: { route: "route.unsure" },
            clarifyingQuestionIds: [
              "q.surfaces.channels",
              "q.context.starting_point",
              "q.intake.payments",
              "q.delivery.timing",
            ],
          }),
      },
    );
    expect(first.status).toBe("needs_clarification");
    expect(first.clarifyingQuestions.length).toBeLessThanOrEqual(3);

    const second = await runIntake(
      {
        ideaText: "We want an app for our business.",
        round: 2,
        previousAnswers: first.answers,
        clarifications: first.clarifyingQuestions.map((question) => ({
          questionId: question.id,
          values: ["not_sure"],
        })),
      },
      {
        completeJson: async () =>
          validAiPayload({
            status: "needs_clarification",
            clarifyingQuestionIds: ["q.surfaces.channels"],
          }),
      },
    );
    expect(second.status).toBe("ready");
    expect(second.clarifyingQuestions).toEqual([]);
  });

  it("does not re-ask a question after the user chooses I’m not sure yet", async () => {
    const ideaText =
      "We want an app for our business so the team can coordinate daily work.";
    const first = await runIntake(
      { ideaText },
      { completeJson: async () => sparseNeedsClarification() },
    );
    expect(first.status).toBe("needs_clarification");
    expect(first.clarifyingQuestions.map((question) => question.id)).toContain(
      "q.surfaces.channels",
    );
    expect(first.answers.unknowns?.["q.surfaces.channels"]).toBeUndefined();
    expect(first.answers.startingPoint).toBeFalsy();

    const askedIds = first.clarifyingQuestions.map((question) => question.id);
    const second = await runIntake(
      {
        ideaText,
        round: 1,
        previousAnswers: first.answers,
        askedQuestionIds: askedIds,
        clarifications: first.clarifyingQuestions.map((question) => ({
          questionId: question.id,
          values: ["not_sure"],
        })),
      },
      {
        completeJson: async () =>
          sparseNeedsClarification({
            answers: { route: "route.custom_web_platform" },
            clarifyingQuestionIds: ["q.surfaces.channels"],
          }),
      },
    );

    expect(second.clarifyingQuestions.map((question) => question.id)).not.toContain(
      "q.surfaces.channels",
    );
  });

  it("does not re-ask a question after the user picks a real option", async () => {
    const ideaText =
      "We want an app for our business so the team can coordinate daily work.";
    const first = await runIntake(
      { ideaText },
      { completeJson: async () => sparseNeedsClarification() },
    );

    const second = await runIntake(
      {
        ideaText,
        round: 1,
        previousAnswers: first.answers,
        askedQuestionIds: first.clarifyingQuestions.map((question) => question.id),
        clarifications: first.clarifyingQuestions.map((question) => ({
          questionId: question.id,
          values:
            question.id === "q.surfaces.channels"
              ? ["surface.public_web"]
              : ["not_sure"],
        })),
      },
      {
        completeJson: async () =>
          sparseNeedsClarification({
            answers: { route: "route.custom_web_platform" },
            clarifyingQuestionIds: ["q.surfaces.channels", "q.users.groups"],
          }),
      },
    );

    expect(second.clarifyingQuestions.map((question) => question.id)).not.toContain(
      "q.surfaces.channels",
    );
    expect(second.answers.surfaces).toEqual(["surface.public_web"]);
  });

  it("falls back to keywords when AI is disabled and still produces a calculable bag", async () => {
    const result = await runIntake(
      { ideaText: RICH_PORTAL },
      { aiEnabled: false },
    );
    expect(result.usedFallback).toBe(true);
    expect(result.status === "ready" || result.status === "needs_clarification").toBe(
      true,
    );
    const answersForPricing = fillDefaultsAndUnknowns(result.answers, RICH_PORTAL);
    const estimate = calculateEstimate(answersForPricing, PLACEHOLDER_PRICING_CONFIG);
    expect(estimate.publicResult.recommendedScenario.range.likely).toBeGreaterThan(0);
  });

  it("uses messy OpenAI JSON instead of keyword fallback", async () => {
    const result = await runIntake(
      {
        ideaText:
          "I need an app where fishermen can upload a photo of each fish they catch along with weight, length, location, and a social feed.",
      },
      {
        completeJson: async () => ({
          status: "needs clarification",
          concept: {
            headline: "A fishing catch log and social guide",
            summary: "Anglers log catches with photos and share advice, plus seasonal weather and tides.",
            whoItsFor: "Recreational fishermen",
            coreCapabilities: "Catch photos, social feed, weather and tides",
            assumptions:
              "First release is mobile-first, tide data comes from a third-party API, one, two, three, four, five, six, seven, eight, nine, ten, eleven extra lines",
          },
          answers: {
            route: "route.mobile_app",
            surfaces: "surface.native_mobile, surface.public_web",
            capabilities: "cap.data.files, cap.comms.chat, cap.invented.thing",
            unknowns: ["q.intake.payments", "q.integrations.systems"],
          },
        }),
      },
    );
    expect(result.usedFallback).toBe(false);
    expect(result.concept.headline).toMatch(/fishing/i);
    expect(result.answers.route).toBe("route.mobile_app");
    expect(result.answers.capabilities).toContain("cap.data.files");
    expect(result.answers.capabilities).not.toContain("cap.invented.thing");
    expect(result.answers.unknowns?.["q.intake.payments"]).toBe("not_sure");
  });
});

describe("intake coerce and parse", () => {
  it("splits capability and assumption strings into arrays", () => {
    expect(toStringList("Catch photos, social feed, weather and tides", 160, 12)).toEqual(
      ["Catch photos", "social feed", "weather and tides"],
    );
    expect(
      toStringList(
        "one, two, three, four, five, six, seven, eight, nine, ten, eleven",
        280,
        10,
      ),
    ).toHaveLength(10);
  });

  it("parses the messy payload that previously tripped Zod", () => {
    const parsed = parseOpenAiIntakePayload({
      status: "needs clarification",
      concept: {
        headline: "A fishing catch log and social guide",
        summary: "Anglers log catches with photos and share advice.",
        whoItsFor: "Recreational fishermen",
        coreCapabilities: "Catch photos, social feed, weather and tides",
        assumptions: "First release is mobile-first, tide data comes from a third-party API",
      },
      answers: {
        route: "route.mobile_app",
        capabilities: "cap.data.files, cap.comms.chat",
        unknowns: ["q.intake.payments"],
      },
    });
    expect(parsed).not.toBeNull();
    expect(parsed?.status).toBe("needs_clarification");
    expect(parsed?.concept.coreCapabilities).toContain("Catch photos");
    expect(parsed?.answers.capabilities).toContain("cap.data.files");
    expect(parsed?.answers.unknowns?.["q.intake.payments"]).toBe("not_sure");
  });

  it("keeps concept when answers are missing", () => {
    const parsed = parseOpenAiIntakePayload({
      status: "ready",
      concept: {
        headline: "A catch log",
        summary: "Log fish with photos.",
        whoItsFor: "Anglers",
        coreCapabilities: ["Catch photos"],
        assumptions: [],
      },
    });
    expect(parsed).not.toBeNull();
    expect(parsed?.concept.headline).toBe("A catch log");
    expect(parsed?.answers).toEqual({});
  });

  it("returns null for a non-object payload", () => {
    expect(parseOpenAiIntakePayload("not json object")).toBeNull();
    expect(coerceIntakePayload("not json object")).toBeNull();
  });
});

describe("intake request schema", () => {
  it("accepts a first submit that includes previousAnswers: null", () => {
    const parsed = intakeRequestSchema.safeParse({
      ideaText:
        "I need an app where fishermen can upload a photo of each fish they catch along with extra information.",
      round: 0,
      previousAnswers: null,
    });
    expect(parsed.success).toBe(true);
  });
});

describe("intake rate limit", () => {
  it("blocks the 13th request in the window", () => {
    resetIntakeRateLimitForTests();
    for (let i = 0; i < 12; i += 1) {
      expect(checkIntakeRateLimit("test-ip")).toBe(true);
    }
    expect(checkIntakeRateLimit("test-ip")).toBe(false);
  });
});
