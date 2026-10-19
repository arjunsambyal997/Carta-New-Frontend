import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/context/I18nContext";
import { MaintenanceBanner } from "./MaintenanceBanner";

const status = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("@/hooks/useSystemStatus", () => ({ useSystemStatus: () => status.value }));

const window_ = {
  id: "1",
  startsAt: "2026-11-01T22:00:00Z",
  endsAt: "2026-11-01T22:30:00Z",
  messageEn: "Database upgrade",
  messageAr: "ترقية قاعدة البيانات",
  readOnly: true,
  active: false,
};

function renderBanner() {
  return render(
    <I18nProvider>
      <MaintenanceBanner />
    </I18nProvider>,
  );
}

describe("MaintenanceBanner", () => {
  it("renders nothing when no maintenance is scheduled", () => {
    status.value = { version: "x", serverTime: "", readOnly: false, maintenance: [] };
    const { container } = renderBanner();
    expect(container.innerHTML).toBe("");
  });

  it("announces an upcoming window with its message and read-only note", () => {
    status.value = { version: "x", serverTime: "", readOnly: false, maintenance: [window_] };
    renderBanner();
    expect(screen.getByRole("status").textContent).toContain("Scheduled maintenance.");
    expect(screen.getByRole("status").textContent).toContain("Database upgrade");
    expect(screen.getByRole("status").textContent).toContain("read-only");
  });

  it("switches to the in-progress wording while the window is active", () => {
    status.value = { version: "x", serverTime: "", readOnly: true, maintenance: [{ ...window_, active: true }] };
    renderBanner();
    expect(screen.getByRole("status").textContent).toContain("Maintenance in progress.");
  });
});
