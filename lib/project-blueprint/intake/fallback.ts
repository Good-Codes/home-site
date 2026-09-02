/**
 * Keyword-based intake fallback when OpenAI is unavailable.
 * Never invents prices. Maps suggestions onto the answer bag and marks unknowns.
 */

import { classifyIdeaKeywords } from "../classifier/keyword";
import type {
  ClassifierSuggestion,
  IntakeConcept,
  ProjectBlueprintAnswers,
} from "../types";
import { inferGapQuestionIds } from "./whitelist";

const WEBSITE_ONLY =
  /\b(brochure|landing pages?|marketing website|company website|wordpress|wix|squarespace)\b/i;
const CUSTOM_SIGNAL =
  /\b(login|portal|dashboard|workflow|saas|payment|subscription|app store|ios|android|api|admin)\b/i;

export function looksLikeMarketingWebsite(
  ideaText: string,
  suggestions: ClassifierSuggestion[],
): boolean {
  if (CUSTOM_SIGNAL.test(ideaText)) return false;
  const productTypes = suggestions.filter((item) => item.category === "product_type");
  if (productTypes.some((item) => item.id !== "route.website")) return false;
  return WEBSITE_ONLY.test(ideaText);
}

export function suggestionsToAnswerPatch(
  selected: ClassifierSuggestion[],
): Partial<ProjectBlueprintAnswers> {
  const patch: Partial<ProjectBlueprintAnswers> = {
    confirmedSuggestions: selected.map((item) => item.id),
  };

  const surfaces: string[] = [];
  const capabilities: string[] = [];
  const integrations: string[] = [];
  const userGroups: string[] = [];
  const qualityRequirements: string[] = [];

  for (const suggestion of selected) {
    switch (suggestion.category) {
      case "product_type":
        if (suggestion.id.startsWith("route.")) patch.route = suggestion.id;
        break;
      case "starting_point":
        if (suggestion.id.startsWith("start.")) patch.startingPoint = suggestion.id;
        break;
      case "surface":
        surfaces.push(suggestion.id);
        break;
      case "capability":
        capabilities.push(suggestion.id);
        break;
      case "integration":
        integrations.push(suggestion.id);
        break;
      case "user_group":
        userGroups.push(suggestion.id);
        break;
      case "quality":
      case "risk":
        if (suggestion.id.startsWith("quality.")) {
          qualityRequirements.push(suggestion.id);
        } else if (suggestion.id.startsWith("migration.")) {
          patch.migrationProfile = suggestion.id;
        }
        break;
      default:
        break;
    }
  }

  if (surfaces.length) patch.surfaces = [...new Set(surfaces)];
  if (capabilities.length) patch.capabilities = [...new Set(capabilities)];
  if (integrations.length) patch.integrations = [...new Set(integrations)];
  if (userGroups.length) patch.userGroups = [...new Set(userGroups)];
  if (qualityRequirements.length) {
    patch.qualityRequirements = [...new Set(qualityRequirements)];
  }

  return patch;
}

export type FallbackIntakeDraft = {
  status: "needs_clarification" | "ready" | "website_handoff";
  concept: IntakeConcept;
  answers: Partial<ProjectBlueprintAnswers>;
  clarifyingQuestionIds: string[];
};

export function fallbackIntakeDraft(
  ideaText: string,
  current: ProjectBlueprintAnswers,
): FallbackIntakeDraft {
  const classified = classifyIdeaKeywords(ideaText);
  const patch = suggestionsToAnswerPatch(classified.suggestions);

  if (looksLikeMarketingWebsite(ideaText, classified.suggestions)) {
    return {
      status: "website_handoff",
      concept: {
        headline: "A business website",
        summary:
          "This sounds like a marketing or brochure website. Website packages are a better fit than a custom product estimate.",
        whoItsFor: "People visiting the business online.",
        coreCapabilities: [],
        assumptions: [
          "No custom workflows, accounts, or integrations were described.",
        ],
      },
      answers: { ...current, ...patch, route: "route.website", ideaText },
      clarifyingQuestionIds: [],
    };
  }

  const merged: Partial<ProjectBlueprintAnswers> = {
    ...current,
    ...patch,
    ideaText,
  };

  const capabilityLabels = classified.suggestions
    .filter((item) => item.category === "capability")
    .map((item) => item.label)
    .slice(0, 8);

  const product = classified.suggestions.find(
    (item) => item.category === "product_type",
  );

  const concept: IntakeConcept = {
    headline: product?.label
      ? `A ${product.label.toLowerCase()}`
      : "A custom software product",
    summary: ideaText.replace(/\s+/g, " ").trim().slice(0, 500),
    whoItsFor:
      classified.suggestions
        .filter((item) => item.category === "user_group")
        .map((item) => item.label)
        .join(", ") || "The people described in the idea.",
    coreCapabilities: capabilityLabels,
    assumptions: [
      "Some details were inferred from keywords because the AI intake service was unavailable.",
      "Unknowns are kept explicit so the planning range stays honest.",
    ],
  };

  const clarifyingQuestionIds = inferGapQuestionIds(
    {
      ...current,
      ...patch,
    } as ProjectBlueprintAnswers,
    ideaText,
  ).slice(0, 3);

  return {
    status: clarifyingQuestionIds.length ? "needs_clarification" : "ready",
    concept,
    answers: merged,
    clarifyingQuestionIds,
  };
}
