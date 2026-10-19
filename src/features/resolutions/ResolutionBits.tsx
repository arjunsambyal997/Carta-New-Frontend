"use client";

import type { ReactNode } from "react";
import { useI18n, type Key } from "@/context/I18nContext";
import type { Resolution, ResolutionStatus } from "@/api/types";

const BADGE: Record<ResolutionStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-sky-50 text-sky-700",
  PASSED: "bg-emerald-50 text-emerald-800",
  REJECTED: "bg-red-50 text-red-800",
};

/** Translation key for each majority a resolution can require. */
export const THRESHOLD_LABEL = {
  ORDINARY: "thresholdOrdinary",
  TWO_THIRDS: "thresholdTwoThirds",
  SPECIAL: "thresholdSpecial",
} as const;

export function StatusBadge({ status, icon }: { status: ResolutionStatus; icon?: ReactNode }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[status]}`}
    >
      {icon}
      {t(`status${status}` as Key)}
    </span>
  );
}

/** Stacked for / against / abstain bar scaled to total voting power, with a marker at the quorum. */
export function TallyBar({ r }: { r: Resolution }) {
  const { t, num } = useI18n();
  const total = r.totalVotingPower ?? 0;
  const w = (n: number) => (total > 0 ? Math.min(100, (n / total) * 100) : 0);
  const pct = (n: number) => `${num(n, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;

  if (total === 0) return <p className="text-xs text-slate-400">{t("noVotes")}</p>;
  return (
    <div className="space-y-1.5">
      <div className="relative h-4 w-full overflow-hidden rounded bg-slate-100" role="img" aria-label={t("votesCast")}>
        <div className="absolute inset-y-0 start-0 flex w-full">
          <div className="bg-emerald-600" style={{ width: `${w(r.tally.forWeight)}%` }} />
          <div className="bg-red-500" style={{ width: `${w(r.tally.againstWeight)}%` }} />
          <div className="bg-slate-400" style={{ width: `${w(r.tally.abstainWeight)}%` }} />
        </div>
        <div
          className="absolute inset-y-0 w-0.5 bg-slate-900"
          style={{ insetInlineStart: `${r.quorumPct}%` }}
          title={`${t("quorumShort")} ${pct(r.quorumPct)}`}
        />
      </div>
      <p className="text-xs text-slate-500">
        {t("participation")} {pct(r.tally.participationPct)} · {t("quorumShort")} {pct(r.quorumPct)} ·{" "}
        {r.tally.quorumMet ? t("quorumReached") : t("quorumNotReached")}
      </p>
    </div>
  );
}
