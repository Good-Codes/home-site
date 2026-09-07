import { expect, type Page } from "@playwright/test";

const PASSWORD = "correct-horse-e2e1";

export async function createCustomerAndLogin(page: Page): Promise<boolean> {
  const email = `e2e.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`;
  const response = await page.request.post("/api/auth/signup", {
    data: {
      email,
      name: "E2E User",
      password: PASSWORD,
      confirmPassword: PASSWORD,
    },
  });

  if (response.status() === 503 || response.status() >= 500) {
    return false;
  }
  if (!response.ok()) {
    throw new Error(
      `Signup failed (${response.status()}): ${await response.text()}`,
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: /^Sign in$/i }).click();
  await expect(page).toHaveURL(/custom-software-estimator|admin/, {
    timeout: 15_000,
  });
  return true;
}
