"use client";

import Link from "next/link";
import { CircleCheck, CircleX, Clock, FilePen } from "lucide-react";
import type { Resolution } from "@/api/types";
import { EmptyState } from "@/components/common/EmptyState";
import { useI18n } from "@/context/I18nContext";
import { StatusBadge } from "@/features/resolutions/ResolutionBits";
import { Tile, ViewAll } from "@/features/dashboard/widgets/Tile";

const RES_ICON = { DRAFT: FilePen, ACTIVE: Clock, PASSED: CircleCheck, REJECTED: CircleX } as const;

/** The four latest resolutions as compact cards: status, a for/against bar against all votes, quorum and deadline. */
export function Resolutions({ list, className = "" }: { list: Resolution[] | null; className?: string }) {
  const { t, num, name, date } = useI18n();
  const shown = [...(list ?? [])]
    .sort((a, b) => (b.openedAt ?? b.votingDeadline).localeCompare(a.openedAt ?? a.votingDeadline))
    .slice(0, 4);
  return (
    <Tile title={t("recentResolutions")} action={<ViewAll href="/resolutions" />} className={className}>
      {shown.length === 0 ? (
        <EmptyState
          compact
          icon="resolutions"
          title={t("noResolutions")}
          hint={t("noResolutionsHint")}
          action={{ label: t("navResolutions"), href: "/resolutions" }}
        />
      ) : (
        <ul className="space-y-2">
          {shown.map((r) => {
            const Ico = RES_ICON[r.status];
            const total = r.totalVotingPower ?? 0;
            const w = (n: number) => (total > 0 ? Math.min(100, (n / total) * 100) : 0);
            const closed = r.status === "PASSED" || r.status === "REJECTED";
            return (
              <li key={r.id}>
                <Link
                  href={`/resolutions/${r.id}`}
                  className="lift group block rounded-xl border border-hairline bg-slate-50/60 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 min-w-0 text-sm font-medium leading-snug text-slate-900">
                      {name(r.title, r.titleAr)}
                    </p>
                    <StatusBadge status={r.status} icon={<Ico size={12} aria-hidden />} />
                  </div>
                  <div className="mt-2.5 flex h-1 overflow-hidden rounded-full bg-slate-200/70" aria-hidden>
                    <div className="bg-emerald-600" style={{ width: `${w(r.tally.forWeight)}%` }} />
                    <div className="bg-red-500" style={{ width: `${w(r.tally.againstWeight)}%` }} />
                  </div>
                  <p className="num mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                    <span>
                      {t("quorumShort")} {num(r.quorumPct)}%
                    </span>
                    {r.status !== "DRAFT" && (
                      <span>
                        {t("participation")} {num(r.tally.participationPct, { maximumFractionDigits: 1 })}%
                      </span>
                    )}
                    <span className="ms-auto">
                      {closed ? t("resClosedOn") : t("resClosesOn")} {date(r.closedAt ?? r.votingDeadline)}
                    </span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Tile>
  );
}
