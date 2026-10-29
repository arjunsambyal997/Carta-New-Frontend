import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  it("offers a retry that runs the loader again", () => {
    const reload = vi.fn();
    renderWithI18n(<Status state={{ ...base, error: "Boom", reload }} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("has no retry button when the state cannot reload", () => {
    renderWithI18n(<Status state={{ ...base, error: "Boom" }} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders nothing once data is ready", () => {
    const { container } = renderWithI18n(<Status state={{ ...base, data: {} }} />);
    expect(container.textContent).toBe("");
  });
});
