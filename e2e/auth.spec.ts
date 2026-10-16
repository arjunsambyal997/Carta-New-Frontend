import { test, expect } from "@playwright/test";
import { PASSWORD, createOrg, uid } from "./api";

test("a new organization signs up through the form, signs out and signs back in", async ({ page }) => {
  const id = uid();
  const email = `ui-${id}@e2e.test`;
  const orgName = `UI Company ${id}`;
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Layla Founder");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByLabel("Company name", { exact: true }).fill(orgName);
  await page.getByLabel("Commercial licence no.").fill(`L-${id}`);
  await page.getByLabel("Certificate prefix").fill(`U${id.replace(/[^a-z0-9]/gi, "").slice(0, 6)}`.toUpperCase());
  await page.getByRole("button", { name: "Create organization" }).click();

  // With the authenticator switched off for tests the founder lands straight on the dashboard.
  await expect(page.getByRole("banner").getByText(orgName)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Get started" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("banner").getByText(orgName)).toBeVisible();
});

test("a wrong password is refused with a clear message and no session", async ({ page }) => {
  const org = await createOrg();
  await page.goto("/login");
  await page.getByLabel("Email").fill(org.email);
  await page.getByLabel("Password").fill("not-the-right-password-1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("Invalid credentials");
  await expect(page).toHaveURL(/\/login/);
});

test("signed-out visitors are sent to sign in instead of seeing an empty app", async ({ page }) => {
  await page.goto("/cap-table");
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
});

test("an address that does not exist shows the not-found page with a way back", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Dashboard" }).last().click();
  await expect(page).toHaveURL("/");
});
