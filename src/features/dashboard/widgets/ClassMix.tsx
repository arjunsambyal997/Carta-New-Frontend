"use client";

import type { CapTable } from "@/api/types";
import { useI18n } from "@/context/I18nContext";
import { col, Tile } from "@/features/dashboard/widgets/Tile";

/** Fully diluted shares by class as one segmented bar, then each class with its shares, share of the total and votes. */
export function ClassMix({ table, className = "" }: { table: CapTable; className?: string }) {
  const { t, num } = useI18n();
  const classes = table.classes.filter((c) => c.fullyDilutedShares > 0);
  const total = classes.reduce((s, c) => s + c.fullyDilutedShares, 0) || 1;
  const pct = (n: number) => `${num(n, { maximumFractionDigits: 1 })}%`;
  return (
    <Tile title={t("classMix")} hint={t("classMixHint")} className={className}>
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={t("classMix")}>
        {classes.map((c, i) => (
          <div
            key={c.shareClassId}
            className="h-full first:rounded-s-full last:rounded-e-full"
            style={{ width: `${(c.fullyDilutedShares / total) * 100}%`, background: col(i) }}
            title={`${c.name}: ${num(c.fullyDilutedShares)}`}
          />
        ))}
      </div>
      <ul className="mt-4 divide-y divide-hairline">
        {classes.map((c, i) => (
          <li key={c.shareClassId} className="flex items-start justify-between gap-3 py-2.5 text-sm">
            <span className="flex min-w-0 items-start gap-2">
              <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: col(i) }} />
              <span className="min-w-0">
                <span className="block break-words text-slate-800">{c.name}</span>
                <span className="num text-xs text-slate-500">
                  {t("voting")} {pct(c.votingPct)}
                </span>
              </span>
            </span>
            <span className="shrink-0 text-end">
              <span className="num block font-medium text-slate-900">{pct((c.fullyDilutedShares / total) * 100)}</span>
              <span className="num text-xs text-slate-500">{num(c.fullyDilutedShares)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Tile>
  );
}
