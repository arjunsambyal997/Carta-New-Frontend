"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import type { CapTable, HolderPosition } from "@/api/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card !p-4">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

/** A percentage with a thin bar behind the number; the bar is scaled so 100% fills the track. */
function PctBar({ pct, text, tone = "brand" }: { pct: number; text: string; tone?: "brand" | "blue" }) {
  return (
    <div className="flex items-center justify-end gap-2.5">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <div
          className={`h-full rounded-full ${tone === "brand" ? "bg-emerald-600" : "bg-[rgb(var(--series-1))]"}`}
          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, minWidth: pct > 0 ? 3 : 0 }}
        />
      </div>
      <span className="w-16 text-end">{text}</span>
    </div>
  );
}

type SortKey =
  "name" | "issuedShares" | "issuedOwnershipPct" | "fullyDilutedOwnershipPct" | "votingPower" | "votingPct";

export function CapTableGrid({ table, query = "" }: { table: CapTable; query?: string }) {
  const { t, num, name, date } = useI18n();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "fullyDilutedOwnershipPct", dir: -1 });
  const pct = (n: number) => `${num(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const label = (h: HolderPosition) => name(h.nameEn, h.nameAr);
    const list = q
      ? table.holders.filter((h) => `${h.nameEn} ${h.nameAr ?? ""}`.toLowerCase().includes(q))
      : [...table.holders];
    return list.sort((a, b) =>
      sort.key === "name" ? label(a).localeCompare(label(b)) * sort.dir : (a[sort.key] - b[sort.key]) * sort.dir,
    );
  }, [table.holders, query, sort, name]);

  const cols: { key: SortKey; label: string }[] = [
    { key: "name", label: t("shareholder") },
    { key: "issuedShares", label: t("issuedShares") },
    { key: "issuedOwnershipPct", label: t("issuedPct") },
    { key: "fullyDilutedOwnershipPct", label: t("fdPct") },
    { key: "votingPower", label: t("votes") },
    { key: "votingPct", label: t("votesPct") },
  ];
  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }));

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        {t("asOf")} {date(table.asOf, true)} · {num(rows.length)}
        {rows.length !== table.holders.length && ` / ${num(table.holders.length)}`} {t("capHolders")}
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("issuedShares")} value={num(table.totalIssuedShares)} />
        <Stat label={t("fullyDiluted")} value={num(table.totalFullyDilutedShares)} />
        <Stat label={t("votingPower")} value={num(table.totalVotingPower)} />
        <Stat label={t("treasury")} value={num(table.treasuryShares)} />
      </div>

      <div className="card overflow-auto sm:max-h-[70vh] !p-0 [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:bg-surface">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-slate-500">
            <tr>
              {cols.map((c, i) => {
                const on = sort.key === c.key;
                const Arrow = !on ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={c.key}
                    aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                    className={`border-b border-slate-200 px-4 py-3 font-medium ${i === 0 ? "text-start" : "text-end"}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(c.key)}
                      title={`${t("capSort")}: ${c.label}`}
                      className={`inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-slate-900 ${on ? "text-slate-900" : ""}`}
                    >
                      {c.label}
                      <Arrow size={12} aria-hidden className={on ? "" : "opacity-40"} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums">
            {rows.map((h, i) => (
              <tr key={h.shareholderId} className={`hover:!bg-emerald-50/60 ${i % 2 ? "bg-slate-50/50" : ""}`}>
                <td className="px-4 py-3 text-start font-medium">
                  <Link
                    className="hover:text-emerald-700 hover:underline"
                    href={`/holders/${h.shareholderId}`}
                    title={t("ledgerTitle")}
                  >
                    {name(h.nameEn, h.nameAr)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-end">{num(h.issuedShares)}</td>
                <td className="px-4 py-3">
                  <PctBar pct={h.issuedOwnershipPct} text={pct(h.issuedOwnershipPct)} tone="blue" />
                </td>
                <td className="px-4 py-3">
                  <PctBar pct={h.fullyDilutedOwnershipPct} text={pct(h.fullyDilutedOwnershipPct)} />
                </td>
                <td className="px-4 py-3 text-end">{num(h.votingPower)}</td>
                <td className="px-4 py-3 text-end">{pct(h.votingPct)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {table.holders.length === 0 ? "—" : t("capNoMatch")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">{t("shareClasses")}</h2>
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-slate-500">
              <tr>
                {[t("className"), t("type"), t("issuedShares"), t("fullyDiluted"), t("votesPct")].map((h, i) => (
                  <th
                    key={h}
                    className={`border-b border-slate-200 px-4 py-3 font-medium ${i < 2 ? "text-start" : "text-end"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {table.classes.map((c) => (
                <tr key={c.shareClassId} className="hover:!bg-emerald-50/60">
                  <td className="px-4 py-3 text-start font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-start text-slate-500">
                    {c.classType.replaceAll("_", " ").toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-end">{num(c.issuedShares)}</td>
                  <td className="px-4 py-3 text-end">{num(c.fullyDilutedShares)}</td>
                  <td className="px-4 py-3 text-end">{pct(c.votingPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
