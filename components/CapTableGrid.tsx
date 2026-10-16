"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import type { CapTable } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-24 rounded bg-slate-100" aria-hidden>
      <div className="h-full rounded bg-emerald-600" style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export function CapTableGrid({ table }: { table: CapTable }) {
  const { t, num, name } = useI18n();
  const pct = (n: number) => `${num(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        {t("asOf")} {new Date(table.asOf).toLocaleString()}
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("issuedShares")} value={num(table.totalIssuedShares)} />
        <Stat label={t("fullyDiluted")} value={num(table.totalFullyDilutedShares)} />
        <Stat label={t("votingPower")} value={num(table.totalVotingPower)} />
        <Stat label={t("treasury")} value={num(table.treasuryShares)} />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {[t("shareholder"), t("issuedShares"), t("issuedPct"), t("fdPct"), t("votes"), t("votesPct")].map((h, i) => (
                <th key={h} className={`px-3 py-2 font-medium ${i === 0 ? "text-start" : "text-end"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums">
            {table.holders.map((h) => (
              <tr key={h.shareholderId} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-start font-medium"><Link className="hover:underline" href={`/holders/${h.shareholderId}`} title={t("ledgerTitle")}>{name(h.nameEn, h.nameAr)}</Link></td>
                <td className="px-3 py-2 text-end">{num(h.issuedShares)}</td>
                <td className="px-3 py-2 text-end">{pct(h.issuedOwnershipPct)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <Bar pct={h.fullyDilutedOwnershipPct} />
                    <span className="w-16 text-end">{pct(h.fullyDilutedOwnershipPct)}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-end">{num(h.votingPower)}</td>
                <td className="px-3 py-2 text-end">{pct(h.votingPct)}</td>
              </tr>
            ))}
            {table.holders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">{t("shareClasses")}</h2>
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {[t("className"), t("type"), t("issuedShares"), t("fullyDiluted"), t("votesPct")].map((h, i) => (
                  <th key={h} className={`px-3 py-2 font-medium ${i < 2 ? "text-start" : "text-end"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {table.classes.map((c) => (
                <tr key={c.shareClassId}>
                  <td className="px-3 py-2 text-start font-medium">{c.name}</td>
                  <td className="px-3 py-2 text-start text-slate-500">{c.classType.replaceAll("_", " ").toLowerCase()}</td>
                  <td className="px-3 py-2 text-end">{num(c.issuedShares)}</td>
                  <td className="px-3 py-2 text-end">{num(c.fullyDilutedShares)}</td>
                  <td className="px-3 py-2 text-end">{pct(c.votingPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
