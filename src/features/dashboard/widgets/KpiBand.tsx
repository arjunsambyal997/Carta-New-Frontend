"use client";

import Link from "next/link";
import { m } from "motion/react";
import type { ReactNode } from "react";
import { Coins, Gavel, Users, Vote } from "lucide-react";
import type { CapTable, Resolution } from "@/api/types";
import { Trend } from "@/components/common/Trend";
import { useI18n } from "@/context/I18nContext";
import { rise } from "@/designSystem/motion";

function Kpi({
  href,
  icon,
  label,
  value,
  trend,
  sub,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
  trend?: ReactNode;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-w-0 flex-col bg-surface p-4 outline-offset-[-2px] transition-colors hover:bg-slate-50 sm:p-5"
    >
      <span className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
        <span className="text-slate-400 transition-colors group-hover:text-emerald-700">{icon}</span>
        {label}
      </span>
      <span className="num-display mt-3">{value}</span>
      <span className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
        {trend}
        <span className="num">{sub}</span>
      </span>
    </Link>
  );
}

/** The four headline numbers as one tile split by hairlines, each opening the page behind it. */
export function KpiBand({
  table,
  prior,
  resolutions,
}: {
  table: CapTable;
  prior?: CapTable | null;
  resolutions: Resolution[] | null;
}) {
  const { t, num } = useI18n();
  const open = (resolutions ?? []).filter((r) => r.status === "ACTIVE").length;
  const pctFmt = (n: number) => num(Math.abs(n), { maximumFractionDigits: 1 });
  const trend = (now: number, before: number | null | undefined) => (
    <Trend now={now} before={before ?? null} format={pctFmt} label={t("kpiSince")} />
  );
  return (
    <m.section
      variants={rise}
      aria-label={t("dashWelcome")}
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline shadow-tile md:col-span-6 lg:grid-cols-4 xl:col-span-12"
    >
      <Kpi
        href="/cap-table"
        icon={<Coins size={15} aria-hidden />}
        label={t("issuedShares")}
        value={num(table.totalIssuedShares)}
        trend={trend(table.totalIssuedShares, prior?.totalIssuedShares)}
        sub={`${t("kpiFdSub")} ${num(table.totalFullyDilutedShares)}`}
      />
      <Kpi
        href="/cap-table"
        icon={<Vote size={15} aria-hidden />}
        label={t("votingPower")}
        value={num(table.totalVotingPower)}
        trend={trend(table.totalVotingPower, prior?.totalVotingPower)}
        sub={`${t("kpiTreasurySub")} ${num(table.treasuryShares)}`}
      />
      <Kpi
        href="/cap-table"
        icon={<Users size={15} aria-hidden />}
        label={t("kpiHolders")}
        value={num(table.holders.length)}
        trend={trend(table.holders.length, prior?.holders.length)}
        sub={`${num(table.classes.length)} ${t("shareClasses").toLowerCase()}`}
      />
      <Kpi
        href="/resolutions"
        icon={<Gavel size={15} aria-hidden />}
        label={t("kpiOpenRes")}
        value={num(open)}
        trend={
          open > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden />
              {t("statusACTIVE")}
            </span>
          ) : undefined
        }
        sub={`${num((resolutions ?? []).length)} ${t("navResolutions").toLowerCase()}`}
      />
    </m.section>
  );
}
