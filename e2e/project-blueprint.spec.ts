import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Project Blueprint surfaces", () => {
  test("website pricing shows Option A and Option B", async ({ page }) => {
    await page.goto("/website-pricing");
    await expect(page.getByText("Option A")).toBeVisible();
    await expect(page.getByText("Option B")).toBeVisible();
  });

  test("custom software estimator shows Project Blueprint hero", async ({
    page,
  }) => {
    await page.goto("/custom-software-estimator");
    await expect(
      page.getByText("Project Blueprint", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Custom Software Cost Estimator/i }),
    ).toBeVisible();
  });

  test("starts an estimate on the custom platform route and advances", async ({
    page,
  }) => {
    await page.goto("/custom-software-estimator");
    await page.getByRole("button", { name: /Start my estimate/i }).click();
    await page.getByRole("button", { name: /Guided questions/i }).click();

    await expect(
      page.getByText(/A custom web platform/i).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: /A custom web platform/i }).click();
    await page.getByRole("button", { name: /^Continue$/i }).click();

    await expect(page.getByText(/How would you like to begin/i)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Continue/i }).first(),
    ).toBeVisible();
  });

  test("estimator hero has no serious accessibility violations", async ({
    page,
  }) => {
    await page.goto("/custom-software-estimator");
    await expect(
      page.getByRole("heading", { name: /Custom Software Cost Estimator/i }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include("main, body")
      .analyze();

    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious).toEqual([]);
  });
});
