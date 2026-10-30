import { expect, test } from "@playwright/test";
import { mockApi, ORG, signedIn } from "./support";

const O = `/api/v1/organizations/${ORG}`;
const holder = (id: string, nameEn: string, pct: number) => ({
  shareholderId: id,
  nameEn,
  nameAr: null,
  issuedShares: pct * 1000,
  fullyDilutedShares: pct * 1000,
  issuedOwnershipPct: pct,
  fullyDilutedOwnershipPct: pct,
  votingPower: pct * 1000,
  votingPct: pct,
});

test("the dashboard queue offers one action per item and the donut explains a holder on hover", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signedIn(page);
  await mockApi(page, {
    "/api/v1/auth/me": { email: "founder@example.com", organizationId: ORG, role: "FOUNDER", mfaVerified: true },
    [O]: {
      id: ORG,
      legalNameEn: "Acme Holdings",
      legalNameAr: null,
      jurisdiction: "ADGM",
      commercialLicenseNo: "1",
      baseCurrency: "AED",
    },
    [`${O}/cap-table`]: {
      organizationId: ORG,
      asOf: "2026-10-30",
      totalIssuedShares: 100000,
      totalFullyDilutedShares: 100000,
      treasuryShares: 0,
      totalVotingPower: 100000,
      holders: [holder("a", "Layla", 60), holder("b", "Omar", 40)],
      classes: [],
    },
    [`${O}/approvals`]: [
      {
        id: "p1",
        pending: true,
        kind: "TRANSFER",
        status: "PENDING",
        summary: "Transfer 5,000 shares to Omar",
        requestedBy: "cosec@example.com",
        requestedAt: new Date().toISOString(),
      },
    ],
    [`${O}/compliance`]: {
      jurisdiction: "ADGM",
      disclaimer: "",
      items: [
        {
          key: "ubo",
          titleEn: "UBO register update",
          titleAr: "",
          basis: "",
          note: "",
          dueDate: "2020-01-01",
          status: "OVERDUE",
        },
      ],
    },
    [`${O}/resolutions`]: [],
    [`${O}/certificates`]: [],
    [`${O}/share-classes`]: [],
    [`${O}/shareholders`]: [],
    [`${O}/members`]: [],
    [`${O}/audit`]: { chainIntact: true, firstBrokenEntry: null, entries: [] },
  });
  await page.goto("/");

  // Most urgent first, each row is one link whose name ends in the action it needs.
  const queue = page.getByRole("region", { name: /Needs attention/ });
  const rows = queue.getByRole("link");
  await expect(rows.first()).toContainText("UBO register update");
  await expect(rows.first()).toContainText("File");
  await expect(rows.nth(1)).toContainText("Approve");
  await expect(rows.nth(1)).toHaveAttribute("href", "/approvals");

  // At rest the centre shows how many holders; pointing at a legend row shows that holder instead.
  const donut = page.locator("[data-donut]");
  await expect(donut).toContainText("2");
  await expect(donut).toContainText("stakeholders");
  await page.locator("[data-donut] + ul li", { hasText: "Omar" }).hover();
  await expect(donut).toContainText("40%");
  await expect(donut).toContainText("Omar");

  // Founders see the audit trail panel now that the role is known before loading.
  await expect(page.getByRole("region", { name: "Recent activity" })).toBeVisible();
});
