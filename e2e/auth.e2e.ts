import { expect, test } from "@playwright/test";
import { mockApi } from "./support";

test("password reset request shows the neutral confirmation", async ({ page }) => {
  await mockApi(page, { "/api/v1/auth/password/forgot": null });
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByLabel("Email").fill("someone@example.com");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByText("If that address has an account")).toBeVisible();
});

test("the language switch flips the page to right-to-left Arabic", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.getByRole("button", { name: "Toggle language" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
});
