import { test, expect } from "@playwright/test";
import { get, seedClass, seedRegister, signIn } from "./api";

test("a transfer asks first, moves the shares, and the history can be read back in time", async ({ page }) => {
  const { org, cls, fatima, omar } = await seedRegister();
  await signIn(page, org);
  await page.goto("/transfers");

  await page.getByLabel("From (seller)").selectOption(fatima.id);
  await page.getByLabel("To (buyer)").selectOption(omar.id);
  await page.getByLabel("Share class").selectOption(cls.id);
  await page.getByLabel("Quantity").fill("400");
  await page.getByLabel("Price per share").fill("12");
  await page.getByRole("button", { name: "Record transfer" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Record this transfer?");
  await expect(dialog).toContainText("400");
  expect((await get(org, "/certificates")).length).toBe(1); // nothing yet
  await dialog.getByRole("button", { name: "Record transfer" }).click();
  await expect(page.getByText("Transfer recorded")).toBeVisible();

  const table = await get(org, "/cap-table");
  const shares = (id: string) => table.holders.find((h: any) => h.shareholderId === id)?.issuedShares;
  expect(shares(fatima.id)).toBe(600);
  expect(shares(omar.id)).toBe(400);

  // rewind: before the transfer only Fatima held shares
  await page.goto("/cap-table");
  await expect(page.getByRole("row", { name: /Omar Haddad/ })).toBeVisible();
  await page.getByLabel("As of date").fill("2025-06-01");
  await expect(page.getByRole("status")).toContainText("2025-06-01");
  await expect(page.getByRole("row", { name: /Fatima Al Mansoori/ })).toContainText("1,000");
  await expect(page.getByRole("row", { name: /Omar Haddad/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to today" }).click();
  await expect(page.getByRole("row", { name: /Omar Haddad/ })).toBeVisible();

  // the seller's ledger shows both sides of the sale and the running count
  await page.getByRole("link", { name: "Fatima Al Mansoori" }).click();
  await expect(page.getByRole("heading", { name: "Fatima Al Mansoori" })).toBeVisible();
  await expect(page.getByText("Shares held now: 600")).toBeVisible();
  await expect(page.getByRole("row", { name: /Disposed/ })).toContainText("Omar Haddad");

  // the buyer's certificate has a family tree and a transfer instrument
  const all = await get(org, "/certificates");
  const bought = all.find((c: any) => c.shareholderNameEn === "Omar Haddad");
  await page.goto(`/certificates/${bought.certificateNo}`);
  await expect(page.getByRole("heading", { name: bought.certificateNo })).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Transfer instrument" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`transfer-${bought.certificateNo}.pdf`);
});

test("selling more shares than the seller holds is stopped at the field, and nothing changes", async ({ page }) => {
  const { org, cls, fatima, omar } = await seedRegister();
  await signIn(page, org);
  await page.goto("/transfers");
  await page.getByLabel("From (seller)").selectOption(fatima.id);
  await page.getByLabel("To (buyer)").selectOption(omar.id);
  await page.getByLabel("Share class").selectOption(cls.id);
  await expect(page.getByText("Holds 1,000 shares in this class")).toBeVisible();
  await page.getByLabel("Quantity").fill("5000");
  await expect(page.getByText("That is more than the seller holds in this class.")).toBeVisible();
  await page.getByRole("button", { name: "Record transfer" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "Use all" }).click();
  await expect(page.getByLabel("Quantity")).toHaveValue("1000");
  await expect(page.getByText(/Moves 1,000 .+ from Fatima Al Mansoori to Omar Haddad\./)).toBeVisible();
  const table = await get(org, "/cap-table");
  expect(table.holders.find((h: any) => h.shareholderId === fatima.id).issuedShares).toBe(1000);
});

test("a buy-back moves shares into the treasury", async ({ page }) => {
  const { org, cls, fatima } = await seedRegister();
  await seedClass(org, { name: "Treasury", classType: "TREASURY", votingMultiplier: 0 });
  await signIn(page, org);
  await page.goto("/transfers");
  await page.getByRole("tab", { name: "Buy-back" }).click();
  await page.getByLabel("From (seller)").selectOption(fatima.id);
  await page.getByLabel("Share class").selectOption(cls.id);
  await page.getByLabel("Quantity").fill("100");
  await page.getByLabel("Price per share").fill("5");
  await page.getByRole("button", { name: "Record buy-back" }).click();
  await expect(page.getByRole("dialog")).toContainText("Record this buy-back?");
  await page.getByRole("dialog").getByRole("button", { name: "Record buy-back" }).click();
  await expect(page.getByText("Buy-back recorded")).toBeVisible();
  const table = await get(org, "/cap-table");
  expect(table.treasuryShares).toBe(100);
  expect(table.totalIssuedShares).toBe(900);
});
