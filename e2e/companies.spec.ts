import { test, expect } from "@playwright/test";
import { addMember, createOrg, get, seedClass, seedHolder, seedIssue, signIn, uid } from "./api";

test("one login runs two companies: add a second, switch between them, and each keeps its own register", async ({ page }) => {
  const first = await createOrg("Alpha");
  const cls = await seedClass(first);
  const holder = await seedHolder(first, "Fatima Al Mansoori");
  await seedIssue(first, holder.id, cls.id, 1000, 10);
  await signIn(page, first);
  await page.goto("/cap-table");
  await expect(page.getByRole("row", { name: /Fatima Al Mansoori/ })).toBeVisible();

  // add a second company from the menu
  await page.getByRole("button", { name: "Switch company" }).click();
  await expect(page.getByRole("menu")).toContainText(first.name);
  await page.getByRole("menuitem", { name: "Add a company" }).click();
  const id = uid();
  const secondName = `Beta Holdings ${id}`;
  await page.getByLabel("Company name", { exact: true }).fill(secondName);
  await page.getByLabel("Commercial licence no.").fill(`L-${id}`);
  await page.getByLabel("Certificate prefix").fill(`B${id.replace(/[^a-z0-9]/gi, "").slice(0, 6)}`.toUpperCase());
  await page.getByRole("button", { name: "Create company" }).click();

  // now inside the new company, which starts empty
  await expect(page.getByRole("button", { name: "Switch company" })).toContainText(secondName);
  await page.goto("/cap-table");
  await expect(page.getByRole("row", { name: /Fatima Al Mansoori/ })).toHaveCount(0);

  // switch back without signing in again: the first company's register is intact
  await page.getByRole("button", { name: "Switch company" }).click();
  await page.getByRole("menuitem", { name: new RegExp(first.name) }).click();
  await expect(page.getByRole("button", { name: "Switch company" })).toContainText(first.name);
  await page.goto("/cap-table");
  await expect(page.getByRole("row", { name: /Fatima Al Mansoori/ })).toContainText("1,000");
});

test("a company you do not belong to cannot be switched to, and the list only ever shows your own", async () => {
  const mine = await createOrg("Mine");
  const theirs = await createOrg("Theirs");
  const refused = await mine.api.post("/api/v1/auth/switch-organization", { data: { organizationId: theirs.orgId } });
  expect(refused.status()).toBe(401);
  // the list only ever shows my own companies
  const list = await (await mine.api.get("/api/v1/auth/organizations")).json();
  expect(list.map((c: any) => c.id)).toEqual([mine.orgId]);
});

test("a person invited to two companies sees both in the switcher, with the right role in each", async ({ page, browser }) => {
  const a = await createOrg("Alpha");
  const b = await createOrg("Beta");
  const member = await addMember(a, "BOARD_MEMBER", "dual");
  // the same person is also invited to the second company
  const second = await b.api.post(`/api/v1/organizations/${b.orgId}/members`, { data: { email: member.email, displayName: "dual", role: "FOUNDER" } });
  expect(second.ok(), await second.text()).toBeTruthy();
  await signIn(page, member);
  await page.goto("/");
  await page.getByRole("button", { name: "Switch company" }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: new RegExp(a.name) })).toContainText("Board member");
  await expect(menu.getByRole("menuitem", { name: new RegExp(b.name) })).toContainText("Founder");
  await menu.getByRole("menuitem", { name: new RegExp(b.name) }).click();
  await expect(page.getByRole("button", { name: "Switch company" })).toContainText(b.name);
  // as a founder of the second company the Members page is available again
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Members" })).toBeVisible();
  void browser; void get;
});
