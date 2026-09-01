import { describe, expect, it } from "vitest";

import {
  canRemoveCapability,
  getCapabilityRemovalBlock,
  resolveCapabilityDependencies,
  toggleCapability,
} from "@/lib/project-blueprint/branching/dependencies";
import {
  canProceed,
  getActiveFollowUpIds,
  getVisibleSteps,
} from "@/lib/project-blueprint/branching/journey";
import {
  needsMobileFollowUps,
  needsNativeMobileFollowUps,
} from "@/lib/project-blueprint/branching/rules";
import type { ProjectBlueprintAnswers } from "@/lib/project-blueprint/types";

describe("website route", () => {
  it("limits the journey to the route step and hands off to packages", () => {
    const answers: ProjectBlueprintAnswers = { route: "route.website" };
    const steps = getVisibleSteps(answers);
    expect(steps.map((s) => s.id)).toEqual(["route"]);

    const proceed = canProceed("route", answers);
    expect(proceed.ok).toBe(true);
    expect(proceed.routesAway).toBe("website_packages");
  });
});

describe("mobile follow-ups", () => {
  it("triggers when native mobile is selected", () => {
    const answers: ProjectBlueprintAnswers = {
      route: "route.custom_web_platform",
      surfaces: ["surface.native_mobile"],
    };
    expect(needsMobileFollowUps(answers)).toBe(true);
    expect(needsNativeMobileFollowUps(answers)).toBe(true);

    const followUps = getActiveFollowUpIds("surfaces", answers);
    expect(followUps.some((id) => id.startsWith("q.followup.mobile."))).toBe(
      true,
    );
  });

  it("triggers for mobile app route without surfaces", () => {
    const answers: ProjectBlueprintAnswers = { route: "route.mobile_app" };
    expect(needsMobileFollowUps(answers)).toBe(true);
    expect(needsNativeMobileFollowUps(answers)).toBe(true);
  });
});

describe("capability dependencies", () => {
  it("pulls foundations when payments are selected", () => {
    const resolved = resolveCapabilityDependencies(["cap.payments.one_time"]);
    expect(resolved).toEqual(
      expect.arrayContaining([
        "cap.payments.one_time",
        "cap.access.registration_login",
        "cap.access.role_permissions",
        "foundation.transaction_logging",
        "foundation.security_baseline",
        "foundation.testing_baseline",
      ]),
    );
  });

  it("blocks removing foundations required by dependents", () => {
    const selected = resolveCapabilityDependencies(["cap.payments.one_time"]);
    const block = getCapabilityRemovalBlock(
      "cap.access.registration_login",
      selected,
    );
    expect(block).not.toBeNull();
    expect(block?.blockedBy).toContain("cap.payments.one_time");
    expect(canRemoveCapability("cap.access.registration_login", selected)).toBe(
      false,
    );

    const toggle = toggleCapability(
      "cap.access.registration_login",
      selected,
      false,
    );
    expect(toggle.blocked).not.toBeNull();
    expect(toggle.next).toEqual(selected);
  });
});
