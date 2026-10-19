"use client";

import { useState } from "react";
import { Tooltip } from "@/components/common/Tooltip";
import { useI18n } from "@/context/I18nContext";
import type { VestingStatus } from "@/api/types";

/**
 * One bar for the whole grant, in three segments: exercised, vested and still exercisable, and unvested.
 * A marker shows the cliff: the share of the grant that becomes vested the day the cliff ends.
 */
export function VestingBar({ s }: { s: VestingStatus }) {
  const { t, num, date } = useI18n();
  const w = (n: number) => (s.granted > 0 ? Math.min(100, (n / s.granted) * 100) : 0);
  const cliffPct = s.vestingMonths > 0 && s.cliffMonths > 0 ? (s.cliffMonths / s.vestingMonths) * 100 : null;
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const cliffReached = s.vested > 0 || s.cliffDate <= today;
  const parts = [
    { key: "ex", label: t("optionsExercised"), n: s.exercised, cls: "bg-emerald-800" },
    { key: "av", label: t("optionsExercisable"), n: s.exercisable, cls: "bg-emerald-500" },
    { key: "un", label: t("optionsUnvested"), n: s.unvested, cls: "bg-slate-200" },
  ];
  return (
    <div className="space-y-2">
      <div className="relative pt-4">
        {cliffPct !== null && (
          <Tooltip
            content={`${t("optCliff")}: ${date(s.cliffDate)} · ${cliffReached ? t("optCliffReached") : t("optCliffPending")}`}
          >
            <span
              tabIndex={0}
              className="absolute top-0 z-10 flex -translate-x-1/2 flex-col items-center rtl:translate-x-1/2"
              style={{ insetInlineStart: `${cliffPct}%` }}
            >
              <span className="rounded bg-slate-800 px-1.5 text-[10px] font-medium leading-4 text-slate-50">
                {t("optCliff")}
              </span>
              <span className="h-[18px] w-px bg-slate-800" />
            </span>
          </Tooltip>
        )}
        <div
          className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={`${t("optionsVested")} ${num(s.vested)} / ${num(s.granted)}`}
        >
          {parts.map((p) => (
            <div
              key={p.key}
              className={`${p.cls} transition-[width] duration-500 first:rounded-s-full last:rounded-e-full`}
              style={{ width: `${w(p.n)}%` }}
              title={`${p.label}: ${num(p.n)}`}
            />
          ))}
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${p.cls}`} />
            {p.label}
            <span className="tabular-nums text-slate-500">{num(p.n)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
