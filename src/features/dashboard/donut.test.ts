import { describe, expect, it } from "vitest";
import { donutSlices } from "./donut";
import type { CapTable, HolderPosition } from "@/api/types";

const holder = (id: string, pct: number, shares = pct * 100) =>
  ({
    shareholderId: id,
    nameEn: id,
    nameAr: `${id}-ar`,
    fullyDilutedOwnershipPct: pct,
    fullyDilutedShares: shares,
  }) as HolderPosition;
const table = (holders: HolderPosition[]) => ({ holders }) as CapTable;
const en = (n: string) => n;

describe("donutSlices", () => {
  it("shows the biggest holders in order and groups the rest, laid end to end around the ring", () => {
    const slices = donutSlices(
      table([holder("c", 10), holder("a", 50), holder("b", 30), holder("d", 6), holder("e", 4)]),
      en,
      "Others",
      2,
    );
    expect(slices.map((s) => [s.key, s.pct, s.start, s.series])).toEqual([
      ["a", 50, 0, 0],
      ["b", 30, 50, 1],
      ["others", 20, 80, -1],
    ]);
    expect(slices.at(-1)!.shares).toBe(2000);
  });

  it("leaves out holders with nothing and adds no others slice when everyone is shown", () => {
    expect(
      donutSlices(table([holder("a", 60), holder("b", 40), holder("z", 0)]), en, "Others").map((s) => s.key),
    ).toEqual(["a", "b"]);
    expect(donutSlices(table([]), en, "Others")).toEqual([]);
  });

  it("uses the Arabic name when the label function picks it", () => {
    const [s] = donutSlices(table([holder("a", 100)]), (e, a) => a ?? e, "أخرى");
    expect(s.label).toBe("a-ar");
  });
});
