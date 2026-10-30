import type { CapTable } from "@/api/types";

export interface Slice {
  key: string;
  label: string;
  pct: number;
  shares: number;
  /** Index into the categorical series, or -1 for the grouped "others" slice. */
  series: number;
  /** Where the slice starts on the ring, 0 to 100. */
  start: number;
}

/** Fully diluted ownership as donut slices: the `top` biggest holders, everyone else grouped into one slice. */
export function donutSlices(
  table: CapTable,
  label: (en: string, ar: string | null) => string,
  othersLabel: string,
  top = 5,
): Slice[] {
  const sorted = [...table.holders].sort((a, b) => b.fullyDilutedOwnershipPct - a.fullyDilutedOwnershipPct);
  const shown = sorted.slice(0, top).filter((h) => h.fullyDilutedOwnershipPct > 0);
  const rest = sorted.slice(shown.length);
  const slices: Slice[] = [];
  let start = 0;
  shown.forEach((h, i) => {
    slices.push({
      key: h.shareholderId,
      label: label(h.nameEn, h.nameAr),
      pct: h.fullyDilutedOwnershipPct,
      shares: h.fullyDilutedShares,
      series: i,
      start,
    });
    start += h.fullyDilutedOwnershipPct;
  });
  const otherPct = Math.max(0, 100 - start);
  if (otherPct > 0.05 && rest.length > 0) {
    slices.push({
      key: "others",
      label: othersLabel,
      pct: otherPct,
      shares: rest.reduce((s, h) => s + h.fullyDilutedShares, 0),
      series: -1,
      start,
    });
  }
  return slices;
}
