import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithI18n } from "@/test/render";
import type { Loaded } from "@/hooks/useRegister";
import { Status } from "./Status";

const base: Loaded<unknown> = { data: null, error: null, loading: false, connected: true, orgId: "o" };

describe("Status", () => {
  it("shows a busy placeholder while loading", () => {
    renderWithI18n(<Status state={{ ...base, loading: true }} />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("asks the visitor to sign in when there is no session", () => {
    renderWithI18n(<Status state={{ ...base, connected: false }} />);
    expect(screen.getByRole("link", { name: /sign in|connect/i })).toBeTruthy();
  });

  it("shows the error message", () => {
    renderWithI18n(<Status state={{ ...base, error: "Boom" }} />);
    expect(screen.getByText(/Boom/)).toBeTruthy();
  });

  it("renders nothing once data is ready", () => {
    const { container } = renderWithI18n(<Status state={{ ...base, data: {} }} />);
    expect(container.textContent).toBe("");
  });
});
