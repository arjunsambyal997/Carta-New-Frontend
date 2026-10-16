import { test, expect } from "@playwright/test";
import { addMember, createOrg, seedRegister, signIn, PASSWORD } from "./api";

test("switching to Arabic flips the layout right to left, and the choice survives a reload", async ({ page }) => {
  const { org } = await seedRegister();
  await signIn(page, org);
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle language" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("link", { name: "لوحة المعلومات" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.goto("/cap-table");
  await expect(page.getByRole("heading", { name: "جدول الملكية" })).toBeVisible();
  // numbers stay in Latin digits
  await expect(page.getByRole("row", { name: /فاطمة/ })).toContainText("1,000");
});

test("Hijri dates can be switched on: the Hijri date shows first with the Gregorian date beside it, and it is remembered", async ({ page }) => {
  const { org } = await seedRegister();
  await signIn(page, org);
  await page.goto("/certificates");
  const row = page.getByRole("row", { name: new RegExp(`${org.prefix}-000001`) });
  await expect(row).toContainText("2025-01-01");
  await expect(row).not.toContainText("1446");

  await page.getByRole("button", { name: "Hijri" }).click();
  await expect(row).toContainText("1446"); // 1 January 2025 falls in 1446 AH
  await expect(row).toContainText("(2025-01-01)"); // the legal Gregorian date is never dropped
  await page.reload();
  await expect(row).toContainText("1446");

  await page.getByRole("button", { name: "Toggle language" }).click();
  await expect(page.getByRole("row", { name: new RegExp(`${org.prefix}-000001`) })).toContainText("هـ");
  await page.getByRole("button", { name: "هجري" }).click();
  await expect(page.getByRole("row", { name: new RegExp(`${org.prefix}-000001`) })).not.toContainText("هـ");
});

test("dark mode switches the whole interface and is remembered", async ({ page }) => {
  const { org } = await seedRegister();
  await signIn(page, org);
  await page.goto("/");
  await page.getByRole("button", { name: "Switch light or dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("on a phone the menu opens from a button and closes when you pick a page", async ({ page }) => {
  const { org } = await seedRegister();
  await signIn(page, org);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav).not.toBeInViewport();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(nav).toBeInViewport();
  await nav.getByRole("link", { name: "Cap table" }).click();
  await expect(page).toHaveURL(/cap-table/);
  await expect(nav).not.toBeInViewport();
});

test("keyboard users can skip straight to the content", async ({ page }) => {
  const { org } = await seedRegister();
  await signIn(page, org);
  await page.goto("/cap-table");
  await expect(page.getByRole("banner")).toBeVisible();
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main/);
});

test("each role sees only the menu it can use", async ({ browser }) => {
  const { org, fatima } = await seedRegister();
  const cases: [string, string, RegExp[], RegExp[]][] = [
    ["LEGAL_AUDITOR", "auditor", [/Audit trail/, /Cap table/], [/Members/, /Import data/]],
    ["SHAREHOLDER", "holder", [/My holdings/, /Resolutions/], [/Cap table/, /Audit trail/, /Transfers/]],
  ];
  for (const [role, label, visible, hidden] of cases) {
    const acct = await addMember(org, role, label, role === "SHAREHOLDER" ? fatima.id : undefined);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signIn(page, acct);
    await page.goto(role === "SHAREHOLDER" ? "/portal" : "/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const v of visible) await expect(nav.getByRole("link", { name: v }), `${role} sees ${v}`).toBeVisible();
    for (const h of hidden) await expect(nav.getByRole("link", { name: h }), `${role} must not see ${h}`).toHaveCount(0);
    await ctx.close();
  }
});

test("members: a founder invites someone and is shown the one-time password once", async ({ page }) => {
  const org = await createOrg();
  await signIn(page, org);
  await page.goto("/members");
  await page.getByLabel("Email").fill(`new-${Date.now()}@e2e.test`);
  await page.getByLabel("Display name").fill("Sara Secretary");
  await page.getByLabel("Role").selectOption("CORPORATE_SECRETARY");
  await page.getByRole("button", { name: "Invite a member" }).click();
  await expect(page.getByText("Temporary password (shown once)")).toBeVisible();
  void PASSWORD;
});

test("a password can be changed while signed in, and the old one then stops working", async ({ page }) => {
  const org = await createOrg();
  await signIn(page, org);
  await page.goto("/password");
  await page.getByLabel("Current password").fill(org.password);
  await page.getByLabel("New password", { exact: true }).fill("Another!Secret-Phrase-42");
  await page.getByLabel("Confirm new password").fill("Another!Secret-Phrase-42");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed")).toBeVisible();
  const old = await org.api.post("/api/v1/auth/login", { data: { email: org.email, password: org.password, organizationId: org.orgId } });
  expect(old.status()).toBe(401);
  const fresh = await org.api.post("/api/v1/auth/login", { data: { email: org.email, password: "Another!Secret-Phrase-42", organizationId: org.orgId } });
  expect(fresh.ok()).toBeTruthy();
});
