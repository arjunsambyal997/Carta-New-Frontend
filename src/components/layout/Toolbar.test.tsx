import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithI18n } from "@/test/render";
import { ToggleGroup } from "@/components/layout/Toolbar";
import { GROUPS } from "@/components/layout/nav";

describe("ToggleGroup", () => {
  it("switches the language and the theme from one control group", () => {
    renderWithI18n(<ToggleGroup />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle language" }));
    expect(document.documentElement.dir).toBe("rtl");
    fireEvent.click(screen.getAllByRole("button").at(-1)!);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("marks Hijri dates as pressed once switched on", () => {
    renderWithI18n(<ToggleGroup />);
    const hijri = screen.getAllByRole("button")[0];
    expect(hijri.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(hijri);
    expect(hijri.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("navigation", () => {
  it("lists each page once, so the sidebar and the command palette agree", () => {
    const hrefs = GROUPS.flatMap((g) => g.items.map((i) => i.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
