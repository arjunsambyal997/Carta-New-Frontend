"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { SignaturesPanel } from "@/components/SignaturesPanel";
import { useMe } from "@/components/useMe";
import { DownloadButton } from "@/components/DownloadButton";
import { PageHeader } from "@/components/PageHeader";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function CertificatesPage() {
  const { t, num, name } = useI18n();
  const state = useRegister((o) => api.certificates(o));
  const me = useMe();
  const [signing, setSigning] = useState<string | null>(null);
  const canSign = !!me && me.role !== "LEGAL_AUDITOR";
  return (
    <div className="space-y-4">
      <PageHeader title={t("navCertificates")} subtitle={t("subCertificates")} action={<Link href="/certificates/new" className="btn">{t("navIssue")}</Link>} />
      <Status state={state} />
      {state.data && state.orgId && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-start text-xs uppercase text-slate-500">
                <th className="py-2 text-start">{t("certNo")}</th>
                <th className="text-start">{t("shareholder")}</th>
                <th className="text-start">{t("className")}</th>
                <th className="text-end">{t("quantity")}</th>
                <th className="text-start ps-4">{t("dateIssued")}</th>
                <th className="text-start">{t("statusLabel")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.data.map((c) => (
                <Fragment key={c.id}>
                <tr className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-mono" dir="ltr">{c.certificateNo}</td>
                  <td>{name(c.shareholderNameEn, c.shareholderNameAr)}</td>
                  <td>{c.shareClassName}</td>
                  <td className="text-end tabular-nums">{num(c.quantity)}</td>
                  <td className="ps-4">{c.dateIssued}</td>
                  <td>{c.status}</td>
                  <td className="text-end">
                    <DownloadButton label={t("downloadPdf")} run={() => api.certificatePdf(state.orgId!, c.certificateNo)} />
                    {me && me.role !== "SHAREHOLDER" && <Link className="btn-ghost ms-1" href={`/certificates/${encodeURIComponent(c.certificateNo)}`}>{t("lineageTitle")}</Link>}
                    {canSign && c.status === "ISSUED" && (
                      <button className="btn-ghost ms-1" onClick={() => setSigning(signing === c.certificateNo ? null : c.certificateNo)}>{t("sigTitle")}</button>
                    )}
                  </td>
                </tr>
                {signing === c.certificateNo && (
                  <tr className="border-b border-slate-100">
                    <td colSpan={7} className="py-3"><SignaturesPanel orgId={state.orgId!} type="CERTIFICATE" docRef={c.certificateNo} /></td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {state.data.length === 0 && <p className="py-4 text-slate-500">{t("noCertificates")}</p>}
        </div>
      )}
    </div>
  );
}
