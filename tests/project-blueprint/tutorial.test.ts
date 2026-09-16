/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";

import {
  ESTIMATOR_TUTORIAL_STEPS,
  ESTIMATOR_TUTORIAL_STORAGE_KEY,
  readSkipEstimatorTutorial,
  writeSkipEstimatorTutorial,
} from "@/lib/project-blueprint/tutorial";

describe("estimator tutorial preference", () => {
  afterEach(() => {
    window.localStorage.removeItem(ESTIMATOR_TUTORIAL_STORAGE_KEY);
  });

  it("describes four estimator steps", () => {
    expect(ESTIMATOR_TUTORIAL_STEPS).toHaveLength(4);
    expect(ESTIMATOR_TUTORIAL_STEPS.map((step) => step.id)).toEqual([
      "describe",
      "clarify",
      "review",
      "results",
    ]);
  });

  it("defaults to showing the tutorial", () => {
    expect(readSkipEstimatorTutorial()).toBe(false);
  });

  it("persists a skip preference", () => {
    writeSkipEstimatorTutorial(true);
    expect(readSkipEstimatorTutorial()).toBe(true);
    expect(window.localStorage.getItem(ESTIMATOR_TUTORIAL_STORAGE_KEY)).toBe("1");
  });

  it("clears the skip preference", () => {
    writeSkipEstimatorTutorial(true);
    writeSkipEstimatorTutorial(false);
    expect(readSkipEstimatorTutorial()).toBe(false);
    expect(window.localStorage.getItem(ESTIMATOR_TUTORIAL_STORAGE_KEY)).toBeNull();
  });
});
