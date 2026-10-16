import { test, expect } from "@playwright/test";
import { createOrg, get, inDays, post, put, seedClass, seedHolder, seedIssue, seedRegister, seedRich, signIn } from "./api";

test("a funding round with a SAFE converts at the cap, scenarios compare side by side, and the pool planner fills the pool", async ({ page }) => {
  const { org } = await seedRegister(); // 1,000 shares
  await signIn(page, org);
  await page.goto("/rounds");

  await page.getByLabel(/Pre-money valuation/).fill("100000");
  await page.getByLabel(/Investment/).fill("50000");
  await page.getByRole("button", { name: "Simulate" }).click();
  const results = page.getByRole("main");
  await expect(results.getByText("Post-money valuation")).toBeVisible();
  await expect(results.getByText("AED 150,000")).toBeVisible();
  await page.getByRole("button", { name: "Save as scenario" }).click();

  // a SAFE with a low cap converts at the cap price, not the round price
  await page.getByRole("button", { name: "Add a SAFE or note" }).click();
  await page.getByLabel("Amount").fill("10000");
  await page.getByLabel("Valuation cap").fill("50000");
  await page.getByRole("button", { name: "Simulate" }).click();
  await expect(page.getByRole("heading", { name: "How they convert" })).toBeVisible();
  // $10,000 at a $50,000 cap over 1,000 shares converts at 50 a share (200 shares), not the round price
  const conversion = page.getByRole("row").filter({ hasText: "SAFE 1" }).filter({ hasText: "Valuation cap" });
  await expect(conversion).toHaveCount(1);
  await expect(conversion).toContainText("AED 50");
  await expect(conversion).toContainText("200");
  await page.getByRole("button", { name: "Save as scenario" }).click();

  const table = page.getByRole("region", { name: "Scenarios side by side" });
  await expect(table.getByText("Scenario 1")).toBeVisible();
  await expect(table.getByText("Scenario 2")).toBeVisible();
  await expect(table.getByText("Shares from SAFEs and notes")).toBeVisible();

  await page.getByText("Option pool planner").click();
  await page.getByRole("button", { name: "Add a role" }).click();
  await page.getByLabel("Role").fill("Engineers");
  await page.getByLabel("People").fill("4");
  await page.getByLabel("Grant each (% of company)").fill("0.75");
  await expect(page.getByText("3.00%").first()).toBeVisible();
  await page.getByRole("button", { name: "Use as the option pool" }).click();
  await expect(page.getByLabel(/Option pool after the round/)).toHaveValue("3");
});

test("a SAFE larger than the pre-money is refused with a plain explanation", async ({ page }) => {
  const { org } = await seedRegister();
  await signIn(page, org);
  await page.goto("/rounds");
  await page.getByLabel(/Pre-money valuation/).fill("1000");
  await page.getByLabel(/Investment/).fill("500");
  await page.getByRole("button", { name: "Add a SAFE or note" }).click();
  await page.getByLabel("Amount").fill("5000000");
  await page.getByRole("button", { name: "Simulate" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("too large");
});

test("CSV import checks the file first, then imports holders and issued shares after confirming", async ({ page }) => {
  const org = await createOrg();
  await seedClass(org, { name: "Ordinary" });
  await signIn(page, org);
  await page.goto("/import");

  const holders = "type,name_en,name_ar,nationality,id_number,registration_no,email\nINDIVIDUAL,Noura Al Suwaidi,نورة السويدي,AE,784-1,,noura@example.com\nCORPORATE,Gulf Holding LLC,,AE,,RC-9,\n";
  await page.locator("#csv").setInputFiles({ name: "holders.csv", mimeType: "text/csv", buffer: Buffer.from(holders, "utf-8") });
  await page.getByRole("button", { name: "Check file" }).click();
  await expect(page.getByText("File looks good")).toContainText("2");
  expect((await get(org, "/shareholders")).length).toBe(0); // checking saves nothing
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Import this file into the register?");
  await page.getByRole("dialog").getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByText("Imported: 2 created", { exact: true })).toBeVisible();
  expect((await get(org, "/shareholders")).length).toBe(2);

  await page.getByRole("tab", { name: "Issued shares" }).click();
  const bad = "holder,share_class,quantity,price_per_share,date\nNobody Known,Ordinary,100,1,2026-01-01\n";
  await page.locator("#csv").setInputFiles({ name: "bad.csv", mimeType: "text/csv", buffer: Buffer.from(bad) });
  await page.getByRole("button", { name: "Check file" }).click();
  await expect(page.getByText("The file has errors")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import", exact: true })).toBeDisabled();

  const good = "holder,share_class,quantity,price_per_share,date\nNoura Al Suwaidi,Ordinary,5000,2,2026-01-15\nGulf Holding LLC,Ordinary,15000,2,2026-01-15\n";
  await page.locator("#csv").setInputFiles({ name: "good.csv", mimeType: "text/csv", buffer: Buffer.from(good) });
  await page.getByRole("button", { name: "Check file" }).click();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Import", exact: true }).click();
  await expect.poll(async () => (await get(org, "/cap-table")).totalIssuedShares).toBe(20000);
  expect((await get(org, "/certificates")).length).toBe(2);
});

test("compliance pages: beneficial owners, the audit chain, the vault and succession", async ({ page }) => {
  const r = await seedRich();
  await signIn(page, r.org);

  // look-through ownership: Fatima owns 60% of the family holding that owns 600,000 of 1,090,000 shares
  await page.goto("/ubo");
  await expect(page.getByRole("heading", { name: "Beneficial owners" }).first()).toBeVisible();
  await expect(page.getByRole("row", { name: /Fatima Al Mansoori/ }).first()).toBeVisible();
  const [csv] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "CSV" }).click()]);
  expect(csv.suggestedFilename()).toMatch(/\.csv$/);

  await page.goto("/audit");
  await expect(page.getByText("Hash chain intact")).toBeVisible();

  await page.goto("/vault");
  await page.getByLabel("Title").fill("Articles of association");
  await page.locator("#vf").setInputFiles({ name: "articles.txt", mimeType: "text/plain", buffer: Buffer.from("Articles of association, version 3") });
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByRole("button", { name: "Download" })).toHaveCount(1);
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).first().click()]);
  expect(file.suggestedFilename()).toBe("articles.txt");

  // succession: preview what would change, then execute after confirming
  await post(r.org, "/succession-rules", {
    name: "Founder exit", trigger: "FOUNDER_EXIT", subjectId: r.holders.fatima.id, fromClassId: r.founder.id, toClassId: r.ordinary.id,
    ratioNumerator: 1, ratioDenominator: 1, legalReference: "Articles 14.2",
  });
  await page.goto("/succession");
  await expect(page.getByText("Articles 14.2")).toBeVisible();
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByText("100,000").first()).toBeVisible();
  await page.getByRole("button", { name: "Execute" }).click();
  await expect(page.getByRole("dialog")).toContainText("cannot be undone");
  await page.getByRole("dialog").getByRole("button", { name: "Execute" }).click();
  await expect(page.getByText("Executed. New certificates")).toBeVisible();
  const table = await get(r.org, "/cap-table");
  expect(table.holders.find((h: any) => h.shareholderId === r.holders.fatima.id).issuedShares).toBe(100_000);
  void put; void inDays; void seedHolder; void seedIssue;
});
