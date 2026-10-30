import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnalyticsEmbed } from "@/api/analytics";

/** Fresh modules per test, because the analytics site address is read once when the page module loads. */
async function renderPage(embed: AnalyticsEmbed | null) {
  vi.resetModules();
  const { api, saveSession } = await import("@/api");
  const { renderWithI18n } = await import("@/test/render");
  const { default: AnalyticsPage } = await import("@/features/analytics/AnalyticsPage");
  saveSession("tok", "org-1");
  const spy = vi.spyOn(api, "analyticsEmbed").mockResolvedValue(embed);
  renderWithI18n(<AnalyticsPage />);
  return spy;
}

describe("AnalyticsPage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("explains that analytics is off when the API has no dashboard", async () => {
    await renderPage(null);
    expect(await screen.findByText("Analytics isn't switched on yet.", { exact: false })).toBeTruthy();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("frames the company's signed link from the configured analytics site", async () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_URL", "https://analytics.example.com");
    const url = "https://analytics.example.com/embed/dashboard/signed#bordered=false";
    const embed = await renderPage({ url, expiresAt: new Date(Date.now() + 3600_000).toISOString() });
    await waitFor(() => expect(document.querySelector("iframe")?.getAttribute("src")).toBe(url));
    expect(embed).toHaveBeenCalledWith("org-1");
  });

  it("refuses a link to any other site", async () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_URL", "https://analytics.example.com");
    await renderPage({ url: "https://evil.example.net/x", expiresAt: new Date().toISOString() });
    expect(await screen.findByText("Analytics isn't switched on yet.", { exact: false })).toBeTruthy();
    expect(document.querySelector("iframe")).toBeNull();
  });
});
