"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n, type Key } from "@/lib/i18n";

/** Everything one shareholder acquired and disposed of, in date order, with a running share count. */
export default function HolderLedgerPage() {
  const { t, num, name } = useI18n();
  const { id } = useParams<{ id: string }>();
  const state = useRegister((orgId) => api.ledger(orgId, id));
  const l = state.data;

  return (
    <div className="max-w-5xl space-y-4">
      <Link href="/cap-table" className="text-sm text-slate-500 hover:underline">← {t("back")}</Link>
      <Status state={state} />
      {l && (
        <>
          <PageHeader eyebrow={t("ledgerTitle")} title={name(l.nameEn, l.nameAr)} subtitle={`${t("ledgerNow")}: ${num(l.currentShares)}`} />
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {[t("dateIssued"), t("ledgerEvent"), t("certNo"), t("className"), t("quantity"), t("ledgerWith"), t("ledgerSharesAfter")].map((h, i) => (
                    <th key={h} className={`px-3 py-2 font-medium ${i === 4 || i === 6 ? "text-end" : "text-start"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {l.events.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500">{t("ledgerEmpty")}</td></tr>
                )}
                {l.events.map((e, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2">{e.date}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${e.type === "ACQUIRED" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                        {t(e.type === "ACQUIRED" ? "ledgerAcquired" : "ledgerDisposed")}
                      </span>
                      <span className="ms-2 text-xs text-slate-500">{t(`reason${e.reason}` as Key)}</span>
                    </td>
                    <td className="px-3 py-2 font-mono" dir="ltr"><Link className="hover:underline" href={`/certificates/${encodeURIComponent(e.certificateNo)}`}>{e.certificateNo}</Link></td>
                    <td className="px-3 py-2">{e.className}{e.instrumentType !== "SHARES" && <span className="ms-1 text-xs text-slate-500">({e.instrumentType})</span>}</td>
                    <td className="px-3 py-2 text-end">{e.type === "ACQUIRED" ? "+" : "−"}{num(e.quantity)}</td>
                    <td className="px-3 py-2">{e.counterpartyEn ? name(e.counterpartyEn, e.counterpartyAr) : ""}</td>
                    <td className="px-3 py-2 text-end font-medium">{num(e.sharesAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
