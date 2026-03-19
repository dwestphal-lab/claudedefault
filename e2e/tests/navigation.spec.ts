import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/App/);
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });
});
