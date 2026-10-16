import { test, expect } from "@playwright/test";
import { createOrg, get, seedClass, seedHolder, seedIssue, signIn } from "./api";

test("an option grant gets a vesting schedule and vested options are exercised into shares", async ({ page }) => {
  const org = await createOrg();
  const cls = await seedClass(org);
  const holder = await seedHolder(org, "Yusuf Al Nuaimi");
  const grant = await seedIssue(org, holder.id, cls.id, 4800, 2.5, { instrumentType: "OPTION" });
  await signIn(page, org);
  await page.goto("/options");

  // a grant with no schedule is listed first, so it cannot be forgotten
  await expect(page.getByText("Grants without a vesting schedule")).toBeVisible();
  await page.getByLabel("Vesting starts").fill("2020-01-01");
  await page.getByRole("button", { name: "Set schedule" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Set this vesting schedule?");
  await dialog.getByRole("button", { name: "Set schedule" }).click();
  await expect(page.getByText("Vesting schedule set")).toBeVisible();

  // a 2020 start with a 12/48 month schedule is fully vested today
  const card = page.locator("section", { hasText: grant.certificateNo });
  await expect(card.getByText("Can exercise")).toBeVisible();
  await card.getByLabel("Quantity").fill("1200");
  await card.getByRole("button", { name: "Exercise" }).click();
  await expect(page.getByRole("dialog")).toContainText("Exercise these options?");
  await page.getByRole("dialog").getByRole("button", { name: "Exercise" }).click();
  await expect(page.getByText("Options exercised")).toBeVisible();

  const certs = await get(org, "/certificates");
  const shares = certs.filter((c: any) => c.instrumentType === "SHARES" && c.status === "ISSUED");
  expect(shares.reduce((n: number, c: any) => n + c.quantity, 0)).toBe(1200);
  const table = await get(org, "/cap-table");
  expect(table.totalIssuedShares).toBe(1200);
  expect(table.totalFullyDilutedShares).toBe(4800);
});

test("exercising more than has vested is refused", async ({ page }) => {
  const org = await createOrg();
  const cls = await seedClass(org);
  const holder = await seedHolder(org, "Layla Qasim");
  const grant = await seedIssue(org, holder.id, cls.id, 4800, 2.5, { instrumentType: "OPTION" });
  await org.api.put(`/api/v1/organizations/${org.orgId}/certificates/${grant.certificateNo}/vesting`, { data: { startDate: "2020-01-01", cliffMonths: 12, vestingMonths: 48 } });
  await signIn(page, org);
  await page.goto("/options");
  const card = page.locator("section", { hasText: grant.certificateNo });
  await card.getByLabel("Quantity").fill("4801");
  await card.getByRole("button", { name: "Exercise" }).click();
  // the browser's own number limit stops this before it is even sent
  expect(await card.getByLabel("Quantity").evaluate((el: HTMLInputElement) => el.validity.rangeOverflow)).toBe(true);
  await expect(page.getByRole("dialog")).toBeHidden();
});
