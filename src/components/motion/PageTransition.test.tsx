import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PageTransition } from "./PageTransition";

let path = "/cap-table";
vi.mock("next/navigation", () => ({ usePathname: () => path }));

function Counter() {
  const [n] = useState(() => Math.random());
  return <p data-testid="page">{n}</p>;
}

describe("PageTransition", () => {
  it("shows the page content", () => {
    render(
      <PageTransition>
        <p>Cap table</p>
      </PageTransition>,
    );
    expect(screen.getByText("Cap table")).toBeTruthy();
  });

  it("starts a fresh entrance for each route but not for re-renders of the same route", () => {
    const ui = (
      <PageTransition>
        <Counter />
      </PageTransition>
    );
    const { rerender } = render(ui);
    const first = screen.getByTestId("page").textContent;
    rerender(ui);
    expect(screen.getByTestId("page").textContent).toBe(first);
    path = "/audit";
    rerender(
      <PageTransition>
        <Counter />
      </PageTransition>,
    );
    expect(screen.getByTestId("page").textContent).not.toBe(first);
  });
});
