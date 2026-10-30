import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AnalyticsPage from "@/features/analytics/AnalyticsPage";
import { renderWithI18n } from "@/test/render";

describe("AnalyticsPage", () => {
  it("explains how to connect a dashboard when none is configured", async () => {
    renderWithI18n(<AnalyticsPage />);
    expect(await screen.findByText("No analytics dashboard is connected")).toBeTruthy();
    expect(document.querySelector("iframe")).toBeNull();
  });
});
