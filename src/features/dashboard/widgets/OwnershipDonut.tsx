"use client";

import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import type { CapTable } from "@/api/types";
import { EmptyState } from "@/components/common/EmptyState";
import { useI18n } from "@/context/I18nContext";
import { donutSlices, type Slice } from "@/features/dashboard/donut";
import { col, Tile } from "@/features/dashboard/widgets/Tile";

const R = 15.9155; // circumference 100, so dash lengths are percentages
const GAP = 0.8;

/**
 * Fully diluted ownership: a ring of the five biggest holders plus everyone else, a centre readout and a legend with
 * inline bars. Pointing at (or focusing) a slice or legend row highlights it and shows that holder in the centre.
 */
export function OwnershipDonut({ table, className = "" }: { table: CapTable; className?: string }) {
  const { t, num, name } = useI18n();
  const [active, setActive] = useState<string | null>(null);
  const slices = donutSlices(table, name, t("others"));
  const current = slices.find((s) => s.key === active) ?? null;
  const max = Math.max(1, ...slices.map((s) => s.pct));
  const pct = (n: number) => `${num(n, { maximumFractionDigits: 1 })}%`;
  const hover = (s: Slice) => ({
    onMouseEnter: () => setActive(s.key),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(s.key),
    onBlur: () => setActive(null),
  });

  return (
    <Tile title={t("ownershipDonut")} hint={t("ownershipDonutHint")} className={className}>
      {slices.length === 0 ? (
        <EmptyState
          compact
          icon="captable"
          title={t("noOwnershipYet")}
          hint={t("noOwnershipYetHint")}
          action={{ label: t("navCertificates"), href: "/certificates/new" }}
        />
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center xl:flex-col 2xl:flex-row">
          <div className="relative size-44 shrink-0" data-donut>
            <svg viewBox="0 0 36 36" className="size-full -rotate-90" role="img" aria-label={t("ownershipDonut")}>
              <circle cx="18" cy="18" r={R} fill="none" stroke="rgb(var(--slate-100))" strokeWidth="3.4" />
              {slices.map((s) => {
                const len = Math.max(0.2, Math.min(100, s.pct) - GAP);
                const dim = active !== null && active !== s.key;
                return (
                  <circle
                    key={s.key}
                    data-slice={s.key}
                    cx="18"
                    cy="18"
                    r={R}
                    fill="none"
                    stroke={col(s.series)}
                    strokeWidth={active === s.key ? 4.4 : 3.4}
                    strokeDasharray={`${len} ${100 - len}`}
                    strokeDashoffset={-s.start}
                    className="cursor-pointer transition-[stroke-width,opacity] duration-200"
                    style={{ opacity: dim ? 0.3 : 1 }}
                    {...hover(s)}
                  >
                    <title>{`${s.label}: ${pct(s.pct)}`}</title>
                  </circle>
                );
              })}
            </svg>
            {/* Centre readout: totals at rest, the pointed-at holder otherwise. Announced politely for keyboard users. */}
            <div
              className="pointer-events-none absolute inset-0 grid place-items-center text-center"
              aria-live="polite"
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={current?.key ?? "total"}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="max-w-[7.5rem]"
                >
                  {current ? (
                    <>
                      <p className="num-display !text-2xl">{pct(current.pct)}</p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-700">{current.label}</p>
                      <p className="num text-[11px] text-slate-500">{num(current.shares)}</p>
                    </>
                  ) : (
                    <>
                      <p className="num-display !text-2xl">{num(table.holders.length)}</p>
                      <p className="mt-1 text-xs font-medium text-slate-700">{t("donutStakeholders")}</p>
                      <p className="num text-[11px] text-slate-500">
                        {num(table.totalFullyDilutedShares, { notation: "compact", maximumFractionDigits: 2 })}{" "}
                        {t("donutFdShares")}
                      </p>
                    </>
                  )}
                </m.div>
              </AnimatePresence>
            </div>
          </div>
          <ul className="w-full min-w-0 space-y-0.5" aria-label={t("donutHoverHint")}>
            {slices.map((s) => (
              <li
                key={s.key}
                tabIndex={0}
                {...hover(s)}
                className={`grid cursor-default grid-cols-[minmax(0,1fr)_3.5rem_3rem] items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-[background-color,opacity] duration-200 hover:bg-slate-50 focus-visible:bg-slate-50 ${
                  active !== null && active !== s.key ? "opacity-50" : ""
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: col(s.series) }} />
                  <span className="truncate text-slate-800">{s.label}</span>
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(s.pct / max) * 100}%`, background: col(s.series) }}
                  />
                </span>
                <span className="num text-end text-xs font-medium text-slate-700">{pct(s.pct)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Tile>
  );
}
