import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

let broken = true;
function Flaky() {
  if (broken) throw new Error("kaput");
  return <p>working</p>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    broken = true;
    // React logs caught render errors; keep the test output readable.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows the fallback instead of crashing the rest of the page", () => {
    render(
      <>
        <p>sibling</p>
        <ErrorBoundary fallback={<p>fallback</p>}>
          <Flaky />
        </ErrorBoundary>
      </>,
    );
    expect(screen.getByText("fallback")).toBeTruthy();
    expect(screen.getByText("sibling")).toBeTruthy();
  });

  it("renders the children again after reset", () => {
    render(
      <ErrorBoundary
        fallback={(reset) => (
          <button type="button" onClick={reset}>
            retry
          </button>
        )}
      >
        <Flaky />
      </ErrorBoundary>,
    );
    broken = false;
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(screen.getByText("working")).toBeTruthy();
  });

  it("clears the error when a reset key changes", () => {
    const { rerender } = render(
      <ErrorBoundary fallback={<p>fallback</p>} resetKeys={["/a"]}>
        <Flaky />
      </ErrorBoundary>,
    );
    broken = false;
    rerender(
      <ErrorBoundary fallback={<p>fallback</p>} resetKeys={["/b"]}>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByText("working")).toBeTruthy();
  });
});
