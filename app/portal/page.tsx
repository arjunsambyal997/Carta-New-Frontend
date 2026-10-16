"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { PageHeader } from "@/components/PageHeader";
import { SignaturesPanel } from "@/components/SignaturesPanel";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function PortalPage() {
  const { t, num, name } = useI18n();
  const state = useRegister(() => api.portalSummary());
  const [signing, setSigning] = useState<string | null>(null);
  const pct = (n: number) => `${num(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const d = state.data;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={d ? name(d.organizationNameEn, d.organizationNameAr) : undefined}
        title={d ? name(d.holderNameEn, d.holderNameAr) : t("navPortal")}
        subtitle={t("portalIntro")}
        action={d && (
          <>
            <DownloadButton label={t("statementDownload")} run={() => api.statementPdf(d.organizationId, d.shareholderId)} />
            {d.certificates.some((c) => c.instrumentType === "OPTION") && (
              <DownloadButton label={t("optionStatementDownload")} run={() => api.optionStatementPdf(d.organizationId, d.shareholderId)} />
            )}
          </>
        )}
      />
      <Status state={state} />
      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label={t("portalShares")} value={num(d.position.issuedShares)} />
            <Kpi label={t("portalFd")} value={num(d.position.fullyDilutedShares)} />
            <Kpi label={t("portalOwnership")} value={pct(d.position.ownershipPct)} />
            <Kpi label={t("votingPower")} value={pct(d.position.votingPct)} />
          </div>

          <section className="card space-y-3">
            <h2 className="text-sm font-semibold">{t("portalVotes")}</h2>
            {d.openVotes.length === 0 && <p className="text-sm text-slate-400">{t("portalNoVotes")}</p>}
            <ul className="space-y-2">
              {d.openVotes.map((v) => (
                <li key={v.id}>
                  <Link href={`/resolutions/${v.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{name(v.title, v.titleAr)}</span>
                      <span className="block text-xs text-slate-500">{t("deadline")}: {new Date(v.votingDeadline).toLocaleString()}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${v.voted ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                      {v.voted ? t("portalVoted") : t("portalVoteNow")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card overflow-x-auto">
            <h2 className="mb-3 text-sm font-semibold">{t("navCertificates")}</h2>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 text-start">{t("certNo")}</th>
                  <th className="text-start">{t("className")}</th>
                  <th className="text-end">{t("quantity")}</th>
                  <th className="ps-4 text-start">{t("dateIssued")}</th>
                  <th className="text-start">{t("statusLabel")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {d.certificates.map((c) => (
                  <Fragment key={c.certificateNo}>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 font-mono" dir="ltr">{c.certificateNo}</td>
                      <td>{c.shareClassName}{c.instrumentType !== "SHARES" && <span className="ms-1 text-xs text-slate-500">({c.instrumentType})</span>}</td>
                      <td className="text-end tabular-nums">{num(c.quantity)}</td>
                      <td className="ps-4">{c.dateIssued}</td>
                      <td>{c.status}</td>
                      <td className="space-x-1 text-end rtl:space-x-reverse">
                        <DownloadButton label={t("downloadPdf")} run={() => api.certificatePdf(d.organizationId, c.certificateNo)} />
                        {c.status === "ISSUED" && (
                          <button className="btn-ghost" onClick={() => setSigning(signing === c.certificateNo ? null : c.certificateNo)}>{t("sigTitle")}</button>
                        )}
                      </td>
                    </tr>
                    {signing === c.certificateNo && (
                      <tr className="border-b border-slate-100">
                        <td colSpan={6} className="py-3">
                          <SignaturesPanel orgId={d.organizationId} type="CERTIFICATE" docRef={c.certificateNo} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {d.certificates.length === 0 && <p className="py-4 text-slate-500">{t("noCertificates")}</p>}
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="label !mb-2">{label}</p>
      <p className="text-xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
