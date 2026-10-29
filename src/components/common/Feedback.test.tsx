import { act, fireEvent, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/test/render";
import { FeedbackProvider, useFeedback } from "./Feedback";

let api: ReturnType<typeof useFeedback>;
function Grab() {
  const feedback = useFeedback();
  useEffect(() => {
    api = feedback;
  }, [feedback]);
  return null;
}
const mount = () =>
  renderWithI18n(
    <FeedbackProvider>
      <Grab />
    </FeedbackProvider>,
  );

describe("toasts", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("announces errors as alerts and hides them after a while", () => {
    mount();
    act(() => api.toast("Saved"));
    act(() => api.toast("Upload failed", "error"));
    expect(screen.getByRole("status").textContent).toContain("Saved");
    expect(screen.getByRole("alert").textContent).toContain("Upload failed");
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText("Saved")).toBeNull();
    expect(screen.getByText("Upload failed")).toBeTruthy();
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.queryByText("Upload failed")).toBeNull();
  });

  it("can be dismissed by keyboard or pointer", () => {
    mount();
    act(() => api.toast("Copied"));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Copied")).toBeNull();
  });

  it("shows a repeated message once and restarts its timer", () => {
    mount();
    act(() => api.toast("Saved"));
    act(() => vi.advanceTimersByTime(3000));
    act(() => api.toast("Saved"));
    expect(screen.getAllByText("Saved")).toHaveLength(1);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("Saved")).toBeTruthy();
    act(() => vi.advanceTimersByTime(600));
    expect(screen.queryByText("Saved")).toBeNull();
  });

  it("keeps at most four on screen, dropping the oldest", () => {
    mount();
    act(() => ["one", "two", "three", "four", "five"].forEach((m) => api.toast(m)));
    expect(screen.queryByText("one")).toBeNull();
    expect(screen.getByText("five")).toBeTruthy();
    expect(screen.getAllByRole("status")).toHaveLength(4);
  });
});
