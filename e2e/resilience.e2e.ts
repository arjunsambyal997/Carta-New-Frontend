import { expect, test } from "@playwright/test";
import { mockApi, ORG, signedIn } from "./support";

test("a page that fails to load offers a retry that recovers", async ({ page }) => {
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
  });
  // Registered after mockApi, so it wins for this path: the first call fails, later ones succeed.
  let calls = 0;
  await page.route(
    (url) => url.pathname === `/api/v1/organizations/${ORG}/cap-table`,
    (route) =>
      ++calls === 1
        ? route.fulfill({ status: 503, json: { detail: "Register temporarily unavailable" } })
        : route.fulfill({
            status: 200,
            json: {
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
          }),
  );

  await page.goto("/cap-table");
  const alert = page.getByRole("alert").filter({ hasText: "Register temporarily unavailable" });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Layla Founder")).toBeVisible();
  await expect(alert).toBeHidden();
});
