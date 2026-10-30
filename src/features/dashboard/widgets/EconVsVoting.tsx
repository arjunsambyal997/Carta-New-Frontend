"use client";

import type { CapTable } from "@/api/types";
import { Tooltip } from "@/components/common/Tooltip";
import { useI18n } from "@/context/I18nContext";
import { col, Legend, Tile } from "@/features/dashboard/widgets/Tile";

/** Economic (fully diluted) share beside voting share per holder: shows where control differs from ownership. */
export function EconVsVoting({ table, className = "" }: { table: CapTable; className?: string }) {
  const { t, num, name } = useI18n();
  const pct = (n: number) => `${num(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  const top = [...table.holders].sort((a, b) => b.fullyDilutedOwnershipPct - a.fullyDilutedOwnershipPct).slice(0, 7);
  const max = Math.max(1, ...top.flatMap((h) => [h.fullyDilutedOwnershipPct, h.votingPct]));
  const rest = table.holders.length - top.length;
  const bar = (v: number, color: string) => (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-[width,filter] duration-500 group-hover:brightness-110"
          style={{ width: `${(v / max) * 100}%`, background: color, minWidth: v > 0 ? 4 : 0 }}
        />
      </div>
      <span className="num w-12 shrink-0 text-end text-xs text-slate-600">{pct(v)}</span>
    </div>
  );
  return (
    <Tile
      title={t("econVsVoting")}
      hint={t("econVsVotingHint")}
      className={className}
      action={
        <Legend
          items={[
            { label: t("economic"), color: col(0) },
            { label: t("voting"), color: col(1) },
          ]}
        />
      }
    >
      <ul className="-mx-2">
        {top.map((h) => {
          const gap = h.votingPct - h.fullyDilutedOwnershipPct;
          return (
            <li key={h.shareholderId}>
              <Tooltip
                content={
                  <dl className="space-y-1">
                    <dt className="font-semibold text-slate-900">{name(h.nameEn, h.nameAr)}</dt>
                    <dd className="num flex justify-between gap-6">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: col(0) }} />
                        {t("economic")}
                      </span>
                      {pct(h.fullyDilutedOwnershipPct)}
                    </dd>
                    <dd className="num flex justify-between gap-6">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: col(1) }} />
                        {t("voting")}
                      </span>
                      {pct(h.votingPct)}
                    </dd>
                    <dd className="num border-t border-hairline pt-1 text-slate-500">
                      {t("controlGap")}: {gap > 0 ? "+" : ""}
                      {num(gap, { maximumFractionDigits: 1 })} pp
                    </dd>
                  </dl>
                }
              >
                <div
                  tabIndex={0}
                  className="group grid cursor-default grid-cols-[minmax(0,7rem)_1fr] items-center gap-x-4 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 sm:grid-cols-[minmax(0,11rem)_1fr]"
                >
                  <span className="truncate text-sm text-slate-800">{name(h.nameEn, h.nameAr)}</span>
                  <div className="space-y-1">
                    {bar(h.fullyDilutedOwnershipPct, col(0))}
                    {bar(h.votingPct, col(1))}
                  </div>
                </div>
              </Tooltip>
            </li>
          );
        })}
      </ul>
      {rest > 0 && (
        <p className="num mt-2 text-xs text-slate-500">
          +{num(rest)} {t("others").toLowerCase()}
        </p>
      )}
    </Tile>
  );
}
