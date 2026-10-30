import { expect, test, type Page } from "@playwright/test";
import { mockApi, ORG, signedIn } from "./support";

const ITEM = {
  key: "ubo",
  titleEn: "UBO register update",
  titleAr: "تحديث سجل المستفيد الحقيقي",
  basis: "Cabinet Decision 109/2023",
  note: "",
  dueDate: "2026-12-01",
  status: "DUE_SOON",
  lastFiledOn: null,
  lastReference: null,
};

async function founder(page: Page, extra: Record<string, unknown> = {}) {
  await signedIn(page);
  await mockApi(page, {
    "/api/v1/auth/me": { email: "founder@example.com", organizationId: ORG, role: "FOUNDER", mfaVerified: true },
    [`/api/v1/organizations/${ORG}`]: {
      id: ORG,
      legalNameEn: "Acme Holdings",
      legalNameAr: null,
      jurisdiction: "ADGM",
      commercialLicenseNo: "CL-1",
      baseCurrency: "AED",
    },
    ...extra,
  });
}

test("saving shows a toast that can be swiped away, and the list reloads fresh", async ({ page }) => {
  let reads = 0;
  await founder(page, {
    [`/api/v1/organizations/${ORG}/compliance`]: () => {
      reads++;
      return { jurisdiction: "ADGM", disclaimer: "Check with counsel.", items: [ITEM] };
    },
    [`/api/v1/organizations/${ORG}/compliance/ubo/filings`]: { ...ITEM, status: "UP_TO_DATE" },
  });
  await page.goto("/compliance");
  await page.getByRole("button", { name: "Mark as filed" }).click();
  await page.getByRole("button", { name: "Save" }).click();

  const toast = page.getByRole("status").filter({ hasText: "Filing recorded." });
  await expect(toast).toBeVisible();
  // The save emptied the request cache, so the reload after it went to the server.
  await expect.poll(() => reads).toBe(2);

  const box = (await toast.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(toast).toBeHidden();
});

test("the sidebar highlight follows navigation, with and without reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await founder(page, {
    [`/api/v1/organizations/${ORG}/cap-table`]: {
      organizationId: ORG,
      asOf: "2026-01-01",
      totalIssuedShares: 0,
      totalFullyDilutedShares: 0,
      treasuryShares: 0,
      totalVotingPower: 0,
      holders: [],
      classes: [],
    },
    [`/api/v1/organizations/${ORG}/compliance`]: { jurisdiction: "ADGM", disclaimer: "Check with counsel.", items: [] },
  });
  const nav = page.getByRole("navigation", { name: "Main" });

  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/cap-table");
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/Cap table/);
    await nav.getByRole("link", { name: "Filing deadlines" }).click();
    await expect(page).toHaveURL(/\/compliance$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/Filing deadlines/);
    await expect(page.getByRole("heading", { name: "Filing deadlines" })).toBeVisible();
  }
});
