import { Minus, TrendingDown, TrendingUp } from "lucide-react";

/** Percentage change since a reference point as a small coloured pill. `null` means there is nothing to compare with. */
export function Trend({
  now,
  before,
  format,
  label,
}: {
  now: number;
  before: number | null;
  format: (n: number) => string;
  label?: string;
}) {
  if (before === null) return null;
  const delta = before === 0 ? (now === 0 ? 0 : 100) : ((now - before) / before) * 100;
  const dir = Math.abs(delta) < 0.05 ? "flat" : delta > 0 ? "up" : "down";
  const tone =
    dir === "up"
      ? "bg-emerald-50 text-emerald-800"
      : dir === "down"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";
  const Cmp = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${tone}`}
      title={label}
    >
      <Cmp size={12} aria-hidden />
      <span dir="ltr">
        {dir === "up" ? "+" : ""}
        {format(delta)}%
      </span>
    </span>
  );
}
