import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, saveSession } from "@/api";
import { renderWithI18n } from "@/test/render";
import IntegrationsPage from "./IntegrationsPage";

const hook = {
  id: "w1",
  url: "https://example.com/h",
  events: ["certificate.issued"],
  active: true,
  createdBy: "a",
  createdAt: "2026-10-19T10:00:00Z",
};

describe("IntegrationsPage", () => {
  beforeEach(() => {
    saveSession("tok", "org-1");
    vi.spyOn(api, "apiKeys").mockResolvedValue([]);
    vi.spyOn(api, "webhooks").mockResolvedValue([hook]);
    vi.spyOn(api, "webhookEvents").mockResolvedValue(["certificate.issued", "resolution.closed"]);
  });

  it("shows a new API key's secret once after creating it", async () => {
    const create = vi.spyOn(api, "createApiKey").mockResolvedValue({
      key: {
        id: "k1",
        name: "BI",
        keyPrefix: "eqk_abcd1234",
        createdBy: "a",
        createdAt: "",
        lastUsedAt: null,
        revokedAt: null,
      },
      secret: "eqk_abcd1234_secretsecret",
    });
    renderWithI18n(<IntegrationsPage />);
    fireEvent.change(await screen.findByLabelText("Key name"), { target: { value: "BI" } });
    fireEvent.click(screen.getByRole("button", { name: "Create key" }));
    expect(await screen.findByText("eqk_abcd1234_secretsecret")).toBeTruthy();
    expect(create).toHaveBeenCalledWith("org-1", "BI");
  });

  it("only allows adding a webhook once an event is picked, then reveals the signing secret", async () => {
    const create = vi.spyOn(api, "createWebhook").mockResolvedValue({ webhook: hook, secret: "whsec_abc" });
    renderWithI18n(<IntegrationsPage />);
    const add = await screen.findByRole("button", { name: "Add webhook" });
    expect((add as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Endpoint URL"), { target: { value: "https://example.com/h" } });
    fireEvent.click(await screen.findByLabelText("certificate.issued"));
    fireEvent.click(add);
    expect(await screen.findByText("whsec_abc")).toBeTruthy();
    expect(create).toHaveBeenCalledWith("org-1", { url: "https://example.com/h", events: ["certificate.issued"] });
  });

  it("pauses a webhook", async () => {
    const update = vi.spyOn(api, "updateWebhook").mockResolvedValue({ ...hook, active: false });
    renderWithI18n(<IntegrationsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Pause" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith("org-1", "w1", { active: false }));
  });
});
