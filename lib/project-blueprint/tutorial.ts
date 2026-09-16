export const ESTIMATOR_TUTORIAL_STORAGE_KEY =
  "goodcode.project-blueprint.skip-tutorial";

export type EstimatorTutorialPreview = "describe" | "clarify" | "review" | "results";

export type EstimatorTutorialStep = {
  id: EstimatorTutorialPreview;
  title: string;
  duration: string;
  description: string;
};

export const ESTIMATOR_TUTORIAL_STEPS: readonly EstimatorTutorialStep[] = [
  {
    id: "describe",
    title: "Describe your idea",
    duration: "About 1 minute",
    description:
      "Write a short, plain-language description of what you want to make possible. Who it is for, what they need to do, and any systems it should connect to are enough — a rough paragraph is fine.",
  },
  {
    id: "clarify",
    title: "Answer only what’s missing",
    duration: "About 1 minute, only if needed",
    description:
      "We infer the product shape from your description and only ask follow-ups when something important is still unclear. “I’m not sure yet” is a valid answer and simply widens the planning range.",
  },
  {
    id: "review",
    title: "Confirm the blueprint",
    duration: "About 30 seconds",
    description:
      "You’ll see a summary of what we understood, including capabilities and working assumptions. If it isn’t right, you can edit the idea before we price it.",
  },
  {
    id: "results",
    title: "Get your planning range",
    duration: "Instant",
    description:
      "You’ll receive an indicative investment range, delivery window, and the main cost drivers. This is a planning estimate, not a fixed quote — a specialist reviews complex work before a formal quotation.",
  },
];

export function readSkipEstimatorTutorial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ESTIMATOR_TUTORIAL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSkipEstimatorTutorial(skip: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (skip) {
      window.localStorage.setItem(ESTIMATOR_TUTORIAL_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(ESTIMATOR_TUTORIAL_STORAGE_KEY);
    }
  } catch {
    // Private mode or quota errors should not block starting an estimate.
  }
}
