import { test, expect } from "@playwright/test";
import { addMember, get, inDays, post, seedRegister, signIn } from "./api";

test("a resolution goes from draft to passed, with the minutes as a PDF", async ({ page }) => {
  const { org, fatima } = await seedRegister();
  // only a corporate secretary can record a vote on a shareholder's behalf
  const secretary = await addMember(org, "CORPORATE_SECRETARY");
  await signIn(page, secretary);
  await page.goto("/resolutions");

  await page.getByRole("button", { name: "New resolution" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Approve the audited accounts");
  await page.getByLabel("Voting deadline").fill(inDays(3).slice(0, 16));
  await page.getByRole("button", { name: "Create draft" }).click();
  await page.getByRole("link", { name: "Approve the audited accounts" }).click();

  await expect(page.getByRole("heading", { name: "Approve the audited accounts" })).toBeVisible();
  await page.getByRole("button", { name: "Open voting" }).click();
  await expect(page.getByRole("dialog")).toContainText("Open voting on this resolution?");
  await page.getByRole("dialog").getByRole("button", { name: "Open voting" }).click();
  await expect(page.getByText("Voting is now open")).toBeVisible();

  // an officer records Fatima's vote for her; votes are final, so it asks first
  await page.getByLabel("Record vote for").selectOption(fatima.id);
  await page.getByRole("button", { name: "For", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Votes are final");
  await page.getByRole("dialog").getByRole("button", { name: "For", exact: true }).click();
  await expect(page.getByText("Vote recorded")).toBeVisible();
  await expect(page.getByText("Quorum reached")).toBeVisible();

  await page.getByRole("button", { name: "Close and decide" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Close and decide" }).click();
  await expect(page.getByText("Voting closed and result recorded")).toBeVisible();
  await expect(page.getByText("Passed").first()).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download minutes" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^minutes-.*\.pdf$/);
});

test("voting twice is impossible: the second vote is refused", async () => {
  const { org, fatima } = await seedRegister();
  const secretary = await addMember(org, "CORPORATE_SECRETARY");
  const res = await post(org, "/resolutions", { title: "Test", votingDeadline: inDays(2) });
  await post(org, `/resolutions/${res.id}/open`);
  await post(secretary, `/resolutions/${res.id}/votes`, { vote: "FOR", shareholderId: fatima.id });
  const again = await secretary.api.post(`/api/v1/organizations/${org.orgId}/resolutions/${res.id}/votes`, {
    data: { vote: "AGAINST", shareholderId: fatima.id },
  });
  expect(again.status()).toBe(422);
  expect(await again.text()).toMatch(/already voted/i);
});

test("a shareholder sees their own holdings and votes from the portal, and cannot reach staff pages", async ({
  page,
}) => {
  const { org, fatima } = await seedRegister();
  const secretary = await addMember(org, "CORPORATE_SECRETARY");
  const res = await post(org, "/resolutions", { title: "Appoint the auditor", votingDeadline: inDays(2) });
  await post(org, `/resolutions/${res.id}/open`);
  const holder = await addMember(org, "SHAREHOLDER", "fatima", fatima.id);
  await signIn(page, holder);
  await page.goto("/portal");

  await expect(page.getByRole("heading", { name: "Fatima Al Mansoori" })).toBeVisible();
  await expect(page.getByText("Shares held")).toBeVisible();
  await expect(page.getByRole("link", { name: /Appoint the auditor/ })).toBeVisible();
  // the sidebar badge counts votes still waiting
  await expect(page.getByRole("link", { name: /Resolutions/ }).getByText("1")).toBeVisible();
  // staff areas are not even in the menu
  await expect(page.getByRole("link", { name: "Cap table" })).toHaveCount(0);

  await page.getByRole("link", { name: /Appoint the auditor/ }).click();
  await page.getByRole("button", { name: "For", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "For", exact: true }).click();
  await expect(page.getByText("Vote recorded")).toBeVisible();
  await page.goto("/portal");
  await expect(page.getByText("Voted").first()).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download statement" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^statement-.*\.pdf$/);
  void secretary;
});

test("two-person approval: a secretary's change waits, a founder approves it, and nobody approves their own", async ({
  browser,
  page,
}) => {
  const { org, cls, fatima } = await seedRegister();
  const secretary = await addMember(org, "CORPORATE_SECRETARY");
  await org.api.put(`/api/v1/organizations/${org.orgId}/settings/approvals`, { data: { required: true } });

  // the secretary issues a certificate: it is held, not issued
  const ctx = await browser.newContext();
  const secPage = await ctx.newPage();
  await signIn(secPage, secretary);
  await secPage.goto("/certificates/new");
  await secPage.getByLabel("Shareholder", { exact: true }).selectOption(fatima.id);
  await secPage.getByLabel("Share class").selectOption(cls.id);
  await secPage.getByLabel("Quantity").fill("250");
  await secPage.getByLabel("Price per share").fill("3");
  await secPage.getByRole("button", { name: "Issue certificate" }).click();
  await secPage.getByRole("dialog").getByRole("button", { name: "Issue certificate" }).click();
  await expect(secPage.getByText("Sent for approval")).toBeVisible();
  expect((await get(org, "/certificates")).length).toBe(1);

  // the secretary cannot approve their own request, only withdraw it
  await secPage.goto("/approvals");
  await expect(secPage.getByText("Issue 250")).toBeVisible();
  await expect(secPage.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await expect(secPage.getByRole("button", { name: "Withdraw" })).toBeVisible();
  await ctx.close();

  // the founder sees the badge and approves
  await signIn(page, org);
  await page.goto("/approvals");
  await expect(page.getByRole("link", { name: /Approvals/ }).getByText("1")).toBeVisible();
  await page.getByLabel("Note (optional)").fill("Checked against the SPA");
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("dialog")).toContainText("Approve and carry out this change?");
  await page.getByRole("dialog").getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved and recorded")).toBeVisible();
  const certs = await get(org, "/certificates");
  expect(certs.length).toBe(2);
  // the audit trail names both people
  const audit = await get(org, "/audit");
  expect(JSON.stringify(audit)).toContain(`(approved by ${org.email})`);
});

test("a rejected change never touches the register, and a sole founder is never locked out", async () => {
  const { org, cls, fatima } = await seedRegister();
  await org.api.put(`/api/v1/organizations/${org.orgId}/settings/approvals`, { data: { required: true } });
  // nobody else could approve yet, so the founder's own change goes straight through
  const direct = await org.api.post(`/api/v1/organizations/${org.orgId}/certificates`, {
    data: { shareholderId: fatima.id, shareClassId: cls.id, quantity: 10, pricePerShare: 1 },
  });
  expect(direct.status()).toBe(201);

  const secretary = await addMember(org, "CORPORATE_SECRETARY");
  const held = await secretary.api.post(`/api/v1/organizations/${org.orgId}/certificates`, {
    data: { shareholderId: fatima.id, shareClassId: cls.id, quantity: 20, pricePerShare: 1 },
  });
  expect(held.status()).toBe(202);
  const change = await held.json();
  const rejected = await org.api.post(`/api/v1/organizations/${org.orgId}/approvals/${change.id}/reject`, {
    data: { note: "not now" },
  });
  expect(rejected.ok()).toBeTruthy();
  expect((await get(org, "/certificates")).length).toBe(2); // the original and the direct one
  const twice = await org.api.post(`/api/v1/organizations/${org.orgId}/approvals/${change.id}/approve`, { data: {} });
  expect(twice.status()).toBe(422);
});
