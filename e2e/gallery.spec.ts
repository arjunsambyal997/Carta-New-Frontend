import { test, expect } from "@playwright/test";
import { seedRich, signIn } from "./api";

/**
 * Every page at five screen sizes, with a realistic register behind it.
 * - No page may scroll sideways (a horizontal scrollbar on the document is a layout bug).
 * - Content must grow into wide screens instead of sitting in a narrow column.
 * Run with SHOTS=name to also save full-page screenshots to e2e/.shots for review.
 */
const ROUTES = [
  "/", "/cap-table", "/ownership", "/waterfall", "/transfers", "/options", "/rounds", "/resolutions", "/approvals", "/succession",
  "/ubo", "/certificates", "/certificates/new", "/vault", "/audit", "/setup", "/import", "/members", "/guide",
];
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "desktop", width: 1920, height: 1080 },
  { name: "ultrawide", width: 2560, height: 1200 },
];

for (const size of SIZES) {
  test(`all pages fit a ${size.name} screen (${size.width}px)`, async ({ page }) => {
    test.setTimeout(180_000);
    const { org, holders } = await seedRich();
    await signIn(page, org);
    await page.setViewportSize({ width: size.width, height: size.height });
    const routes = [...ROUTES, `/holders/${holders.fatima.id}`];
    const overflow: string[] = [];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main h1").first(), route).toBeVisible();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(450); // let entrance animations finish
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (wide > 1) overflow.push(`${route} scrolls sideways by ${wide}px`);
      if (process.env.SHOTS) await page.screenshot({ path: `e2e/.shots/${process.env.SHOTS}-${size.name}${route.replace(/\//g, "_") || "_"}.png`, fullPage: true });
    }
    expect(overflow).toEqual([]);
  });
}

test("content uses the width of wide screens", async ({ page }) => {
  const { org } = await seedRich();
  await signIn(page, org);
  await page.setViewportSize({ width: 2560, height: 1200 });
  await page.goto("/cap-table");
  await expect(page.locator("main h1")).toBeVisible();
  await page.waitForLoadState("networkidle");
  const table = await page.locator("main table").first().boundingBox();
  // the cap table should span most of the content area, not a fixed narrow column
  expect(table!.width).toBeGreaterThan(1500);
});
