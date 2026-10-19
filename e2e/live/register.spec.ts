import { test, expect } from "@playwright/test";
import { createOrg, get, seedClass, seedHolder, seedIssue, seedRegister, signIn, uid } from "./api";

test("setup: a founder adds a share class and a shareholder", async ({ page }) => {
  const org = await createOrg();
  await signIn(page, org);
  await page.goto("/setup");

  await page.getByLabel("Class", { exact: true }).fill("Ordinary shares");
  await page.getByLabel("Par value").fill("1");
  await page.getByLabel("Authorized").fill("1000000");
  await page.getByRole("button", { name: "Add share class" }).click();
  await expect(page.getByText("Ordinary shares")).toBeVisible();

  await page.getByLabel("Full name", { exact: true }).fill("Noura Al Suwaidi");
  await page.getByLabel("Full name (Arabic)").fill("نورة السويدي");
  await page.getByRole("button", { name: "Add shareholder" }).click();
  await expect(page.getByText("Noura Al Suwaidi")).toBeVisible();

  const classes = await get(org, "/share-classes");
  expect(classes.map((c: any) => c.name)).toContain("Ordinary shares");
});

test("issuing a certificate asks first, then shows the certificate with its QR code and a public check says it is authentic", async ({
  page,
  browser,
}) => {
  const org = await createOrg();
  const cls = await seedClass(org);
  const holder = await seedHolder(org, "Fatima Al Mansoori");
  await signIn(page, org);
  await page.goto("/certificates/new");

  await page.getByLabel("Shareholder", { exact: true }).selectOption(holder.id);
  await page.getByLabel("Share class").selectOption(cls.id);
  await page.getByLabel("Quantity").fill("2500");
  await page.getByLabel("Price per share").fill("4.5");
  await page.getByRole("button", { name: "Issue certificate" }).click();

  // nothing is written until the person confirms
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Issue this certificate?");
  expect((await get(org, "/certificates")).length).toBe(0);
  await dialog.getByRole("button", { name: "Issue certificate" }).click();

  await expect(page.getByRole("heading", { name: "Certificate issued" })).toBeVisible();
  await expect(page.getByText(`${org.prefix}-000001`)).toBeVisible();
  await expect(page.getByText("Scan to verify")).toBeVisible();

  // anyone, signed out, can check the certificate against the register
  const [cert] = await get(org, "/certificates");
  const stranger = await browser.newContext();
  const pub = await stranger.newPage();
  await pub.goto(`/verify/${cert.certificateNo}?h=${cert.recordHash}`);
  await expect(pub.getByText("Authentic")).toBeVisible();
  await pub.goto(`/verify/${cert.certificateNo}?h=${"0".repeat(64)}`);
  await expect(pub.getByText("Not authentic")).toBeVisible();
  await stranger.close();
});

test("issuing too many shares for the class is refused with the reason", async ({ page }) => {
  const org = await createOrg();
  const cls = await seedClass(org, { authorizedShares: 1000 });
  const holder = await seedHolder(org, "Omar Haddad");
  await signIn(page, org);
  await page.goto("/certificates/new");
  await page.getByLabel("Shareholder", { exact: true }).selectOption(holder.id);
  await page.getByLabel("Share class").selectOption(cls.id);
  await page.getByLabel("Quantity").fill("5000");
  await page.getByLabel("Price per share").fill("1");
  await page.getByRole("button", { name: "Issue certificate" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Issue certificate" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(/authorized/i);
  expect((await get(org, "/certificates")).length).toBe(0);
});

test("cancelling the confirmation issues nothing", async ({ page }) => {
  const org = await createOrg();
  const cls = await seedClass(org);
  const holder = await seedHolder(org, "Layla Qasim");
  await signIn(page, org);
  await page.goto("/certificates/new");
  await page.getByLabel("Shareholder", { exact: true }).selectOption(holder.id);
  await page.getByLabel("Share class").selectOption(cls.id);
  await page.getByLabel("Quantity").fill("10");
  await page.getByLabel("Price per share").fill("1");
  await page.getByRole("button", { name: "Issue certificate" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect((await get(org, "/certificates")).length).toBe(0);
});

test("the cap table shows each holder's shares and percentages, and the certificate list shows the certificates", async ({
  page,
}) => {
  const { org, cls, fatima, omar } = await seedRegister();
  await seedIssue(org, omar.id, cls.id, 3000, 10);
  await signIn(page, org);
  await page.goto("/cap-table");
  const fatimaRow = page.getByRole("row", { name: /Fatima Al Mansoori/ });
  await expect(fatimaRow).toContainText("1,000");
  await expect(fatimaRow).toContainText("25.00%");
  await expect(page.getByRole("row", { name: /Omar Haddad/ })).toContainText("75.00%");

  await page.goto("/certificates");
  await expect(page.getByRole("row", { name: new RegExp(`${org.prefix}-000002`) })).toContainText("3,000");
  void fatima;
});

test("search finds a holder from anywhere with the keyboard", async ({ page }) => {
  const { org } = await seedRegister();
  await signIn(page, org);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible(); // the shortcut exists once the signed-in page has loaded
  await page.keyboard.press("Control+k");
  await page.getByRole("dialog").getByRole("textbox").fill("Haddad");
  await expect(page.getByRole("dialog")).toContainText("Omar Haddad");
  void uid;
});
