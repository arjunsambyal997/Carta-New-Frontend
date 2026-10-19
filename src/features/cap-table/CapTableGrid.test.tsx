import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/test/render";
import { CapTableGrid } from "@/features/cap-table/CapTableGrid";
import type { CapTable, HolderPosition } from "@/api/types";

vi.mock("next/link", () => ({
  default: ({ children, ...p }: { children: React.ReactNode }) => <a {...p}>{children}</a>,
}));

const holder = (id: string, nameEn: string, fd: number): HolderPosition => ({
  shareholderId: id,
  nameEn,
  nameAr: null,
  issuedShares: fd * 100,
  fullyDilutedShares: fd * 100,
  issuedOwnershipPct: fd,
  fullyDilutedOwnershipPct: fd,
  votingPower: fd * 100,
  votingPct: fd,
});

const table: CapTable = {
  organizationId: "o",
  asOf: "2026-01-01T00:00:00Z",
  totalIssuedShares: 10000,
  totalFullyDilutedShares: 10000,
  treasuryShares: 0,
  totalVotingPower: 10000,
  holders: [holder("1", "Alpha", 20), holder("2", "Bravo", 50), holder("3", "Charlie", 30)],
  classes: [],
};

const names = () =>
  within(screen.getAllByRole("table")[0])
    .getAllByRole("link")
    .map((a) => a.textContent);

describe("CapTableGrid", () => {
  it("lists the biggest holder first", () => {
    renderWithI18n(<CapTableGrid table={table} />);
    expect(names()).toEqual(["Bravo", "Charlie", "Alpha"]);
  });

  it("filters holders by name", () => {
    renderWithI18n(<CapTableGrid table={table} query="char" />);
    expect(names()).toEqual(["Charlie"]);
  });

  it("says so when the filter matches nobody", () => {
    renderWithI18n(<CapTableGrid table={table} query="zzz" />);
    expect(screen.getByText("No holder matches your filter.")).toBeTruthy();
  });

  it("sorts by name when that header is clicked, and flips on a second click", () => {
    renderWithI18n(<CapTableGrid table={table} />);
    fireEvent.click(screen.getByRole("button", { name: "Shareholder" }));
    expect(names()).toEqual(["Alpha", "Bravo", "Charlie"]);
    fireEvent.click(screen.getByRole("button", { name: "Shareholder" }));
    expect(names()).toEqual(["Charlie", "Bravo", "Alpha"]);
  });
});
