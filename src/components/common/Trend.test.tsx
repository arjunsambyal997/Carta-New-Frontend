import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Trend } from "@/components/common/Trend";

const fmt = (n: number) => String(Math.round(Math.abs(n) * 10) / 10);

describe("Trend", () => {
  it("shows a rise as a positive percentage", () => {
    render(<Trend now={110} before={100} format={fmt} />);
    expect(screen.getByText("+10%")).toBeTruthy();
  });
  it("shows a fall without a plus sign", () => {
    render(<Trend now={90} before={100} format={fmt} />);
    expect(screen.getByText("10%")).toBeTruthy();
  });
  it("treats growth from nothing as +100% and no change as 0%", () => {
    const { unmount } = render(<Trend now={5} before={0} format={fmt} />);
    expect(screen.getByText("+100%")).toBeTruthy();
    unmount();
    render(<Trend now={0} before={0} format={fmt} />);
    expect(screen.getByText("0%")).toBeTruthy();
  });
  it("renders nothing when there is no earlier figure", () => {
    const { container } = render(<Trend now={5} before={null} format={fmt} />);
    expect(container.innerHTML).toBe("");
  });
});
