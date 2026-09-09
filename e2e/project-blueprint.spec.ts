import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { createCustomerAndLogin } from "./helpers/auth";

const READY_INTAKE = {
  status: "ready",
  concept: {
    headline: "A dealership finance portal",
    summary:
      "Dealerships upload applications, track progress, and collect monthly payments.",
    whoItsFor: "Dealership staff and the finance team",
    coreCapabilities: ["Application uploads", "Status tracking", "Monthly payments"],
    assumptions: ["First release is web-only."],
  },
  answers: {
    ideaText:
      "We need a customer portal where dealerships can upload finance applications, track progress, receive documents, and process monthly payments.",
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
    unknowns: {},
  },
  clarifyingQuestions: [],
  usedFallback: true,
  round: 0,
};

test.describe("Project Blueprint surfaces", () => {
  test("website pricing shows Option A and Option B", async ({ page }) => {
    await page.goto("/website-pricing");
    await expect(page.getByText("Option A")).toBeVisible();
    await expect(page.getByText("Option B")).toBeVisible();
    await expect(page.getByText("Describe your idea")).toBeVisible();
  });

  test("custom software estimator redirects unauthenticated visitors to login", async ({
    page,
  }) => {
    await page.goto("/custom-software-estimator");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
  });

  test("login page has no serious accessibility violations", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("main").analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious).toEqual([]);
  });

  test("account page redirects unauthenticated visitors to login", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
  });
});

test.describe("signed-in account", () => {
  test("account page is reachable after login", async ({ page }) => {
    const loggedIn = await createCustomerAndLogin(page);
    test.skip(!loggedIn, "Database is not available for authenticated e2e");
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: /^Account$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Saved estimates/i })).toBeVisible();
    await expect(page.getByLabel(/Current password/i)).toBeVisible();
    await expect(page.getByText(/No saved estimates yet/i)).toBeVisible();
  });

  test("admin users page is forbidden to customers", async ({ page }) => {
    const loggedIn = await createCustomerAndLogin(page);
    test.skip(!loggedIn, "Database is not available for authenticated e2e");
    await page.goto("/admin/users");
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });
});

test.describe("signed-in estimator", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await createCustomerAndLogin(page);
    test.skip(!loggedIn, "Database is not available for authenticated e2e");
    await page.goto("/custom-software-estimator");
  });

  test("custom software estimator shows Project Blueprint hero", async ({
    page,
  }) => {
    await expect(
      page.getByText("Project Blueprint", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Custom Software Cost Estimator/i }),
    ).toBeVisible();
  });

  test("starts from a description and shows the inferred concept", async ({
    page,
  }) => {
    await page.route("**/api/project-blueprint/intake", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(READY_INTAKE),
      });
    });

    await page.getByRole("button", { name: /Start my estimate/i }).click();
    await expect(page.getByLabel(/Your idea/i)).toBeVisible();

    await page.getByLabel(/Your idea/i).fill(READY_INTAKE.answers.ideaText);
    await page.getByRole("button", { name: /Review my idea/i }).click();

    await expect(
      page.getByRole("heading", { name: /A dealership finance portal/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Build my estimate/i })).toBeVisible();

    await page.getByRole("button", { name: /Build my estimate/i }).click();
    await expect(page.getByText(/Indicative planning estimate/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Recommended investment range/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Save to my profile/i }),
    ).toBeVisible();
  });

  test("asks follow-ups only when intake needs clarification", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/project-blueprint/intake", async (route) => {
      calls += 1;
      if (calls === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "needs_clarification",
            concept: {
              headline: "A custom web product",
              summary: "A staff tool, with a few details still open.",
              whoItsFor: "Internal staff",
              coreCapabilities: ["Task tracking"],
              assumptions: [],
            },
            answers: {
              ideaText: "We want a simple internal tool for staff to track jobs.",
              route: "route.internal_system",
              surfaces: ["surface.admin_workspace"],
            },
            clarifyingQuestions: [
              {
                id: "q.intake.payments",
                prompt: "Will people pay inside the product?",
                help: "In-product payments change scope.",
                kind: "single",
                options: [
                  { id: "pay.none", label: "No — payments are not part of the first release" },
                  { id: "not_sure", label: "I’m not sure yet" },
                ],
              },
            ],
            usedFallback: true,
            round: 0,
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(READY_INTAKE),
      });
    });

    await page.getByRole("button", { name: /Start my estimate/i }).click();
    await page
      .getByLabel(/Your idea/i)
      .fill("We want a simple internal tool for staff to track jobs.");
    await page.getByRole("button", { name: /Review my idea/i }).click();
    await expect(
      page.getByText(/Will people pay inside the product/i),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: /No — payments are not part of the first release/i,
      })
      .click();
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await expect(page.getByRole("button", { name: /Build my estimate/i })).toBeVisible();
  });

  test("website-shaped intake hands off to website packages", async ({ page }) => {
    await page.route("**/api/project-blueprint/intake", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "website_handoff",
          concept: {
            headline: "A business website",
            summary: "A marketing site.",
            whoItsFor: "Visitors",
            coreCapabilities: [],
            assumptions: [],
          },
          answers: { route: "route.website" },
          clarifyingQuestions: [],
          usedFallback: true,
          round: 0,
        }),
      });
    });

    await page.getByRole("button", { name: /Start my estimate/i }).click();
    await page
      .getByLabel(/Your idea/i)
      .fill(
        "We need a brochure marketing website and a landing page for the company.",
      );
    await page.getByRole("button", { name: /Review my idea/i }).click();
    await expect(page).toHaveURL(/website-pricing/);
    await expect(page.getByText("Option A")).toBeVisible();
  });

  test("estimator hero has no serious accessibility violations", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: /Custom Software Cost Estimator/i }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("main").analyze();

    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious).toEqual([]);
  });
});
