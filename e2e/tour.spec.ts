import { test, expect } from "@playwright/test";
import { seedRegister, signIn } from "./api";

const ROUTES = [
  "/", "/cap-table", "/ownership", "/waterfall", "/transfers", "/options", "/rounds", "/resolutions", "/approvals", "/succession",
  "/ubo", "/certificates", "/certificates/new", "/vault", "/audit", "/setup", "/import", "/members", "/security", "/password", "/guide",
];

test("every signed-in page loads with data and no errors", async ({ page }) => {
  const { org } = await seedRegister();
  await signIn(page, org);
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(`pageerror ${page.url()}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon|Failed to load resource.*404/.test(m.text())) problems.push(`console ${page.url()}: ${m.text()}`);
  });
  for (const route of ROUTES) {
    await page.goto(route);
    await expect(page.locator("main h1").first(), route).toBeVisible();
    await expect(page.locator("main [role=alert]"), `${route} shows an error`).toHaveCount(0);
    if (process.env.SHOTS) await page.screenshot({ path: `e2e/.shots/${process.env.SHOTS}${route.replace(/\//g, "_") || "_home"}.png`, fullPage: true });
  }
  expect(problems).toEqual([]);
});
