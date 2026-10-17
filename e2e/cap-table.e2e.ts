import { expect, test } from "@playwright/test";
import { mockApi, ORG, signedIn } from "./support";

test("cap table lists holders from the API", async ({ page }) => {
  await signedIn(page);
  await mockApi(page, {
    "/api/v1/auth/me": {
      email: "founder@example.com",
      organizationId: ORG,
      role: "FOUNDER",
      mfaVerified: true,
      shareholderId: null,
    },
    [`/api/v1/organizations/${ORG}`]: {
      id: ORG,
      legalNameEn: "Acme Holdings",
      legalNameAr: null,
      jurisdiction: "ADGM",
      commercialLicenseNo: "CL-1",
      baseCurrency: "AED",
    },
    [`/api/v1/organizations/${ORG}/cap-table`]: {
      organizationId: ORG,
      asOf: "2026-01-01",
      totalIssuedShares: 1000,
      totalFullyDilutedShares: 1000,
      treasuryShares: 0,
      totalVotingPower: 1000,
      holders: [
        {
          shareholderId: "h1",
          nameEn: "Layla Founder",
          nameAr: null,
          issuedShares: 1000,
          fullyDilutedShares: 1000,
          issuedOwnershipPct: 100,
          fullyDilutedOwnershipPct: 100,
          votingPower: 1000,
          votingPct: 100,
        },
      ],
      classes: [],
    },
  });
  await page.goto("/cap-table");
  await expect(page.getByText("Layla Founder")).toBeVisible();
});

test("an unauthenticated visitor to a register page is asked to connect", async ({ page }) => {
  await mockApi(page, {});
  await page.goto("/cap-table");
  await expect(page.getByText(/sign in|not connected/i).first()).toBeVisible();
});
