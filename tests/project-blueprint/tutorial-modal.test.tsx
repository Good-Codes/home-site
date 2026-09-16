/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: React.ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

import { EstimatorTutorialModal } from "@/components/project-blueprint/tutorial-modal";
import { ESTIMATOR_TUTORIAL_STORAGE_KEY } from "@/lib/project-blueprint/tutorial";

describe("EstimatorTutorialModal", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.removeItem(ESTIMATOR_TUTORIAL_STORAGE_KEY);
  });

  it("pages through each estimator step", () => {
    render(
      <EstimatorTutorialModal open onOpenChange={() => undefined} onStart={() => undefined} />,
    );

    expect(
      screen.getByRole("heading", { name: /How this estimate works/i }),
    ).toBeTruthy();
    expect(screen.getByText(/Describe your idea/i)).toBeTruthy();
    expect(screen.getByText(/Four short steps/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Next step/i }));
    expect(screen.getByText(/Answer the planning questions/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Next step/i }));
    expect(screen.getByText(/Confirm the blueprint/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Next step/i }));
    expect(screen.getByText(/Get your planning range/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Start estimation/i })).toBeTruthy();
    expect(screen.getByText(/Don’t show this tutorial again/i)).toBeTruthy();
  });

  it("starts the estimate and can persist the skip preference", () => {
    const onStart = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <EstimatorTutorialModal open onOpenChange={onOpenChange} onStart={onStart} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Go to step 4/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Don’t show this tutorial again/i }));
    fireEvent.click(screen.getByRole("button", { name: /Start estimation/i }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(window.localStorage.getItem(ESTIMATOR_TUTORIAL_STORAGE_KEY)).toBe("1");
  });
});
