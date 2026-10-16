"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DownloadButton } from "@/components/DownloadButton";
import { PageHeader } from "@/components/PageHeader";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n, type Key } from "@/lib/i18n";

/** The family tree of a certificate: what it replaced and what replaced it. */
export default function CertificateLineagePage() {
  const { t, num, name } = useI18n();
  const { no } = useParams<{ no: string }>();
  const certNo = decodeURIComponent(no);
  const state = useRegister((orgId) => api.lineage(orgId, certNo));
  const nodes = state.data;

  return (
    <div className="max-w-4xl space-y-4">
      <Link href="/certificates" className="text-sm text-slate-500 hover:underline">← {t("back")}</Link>
      <PageHeader eyebrow={t("lineageTitle")} title={<span dir="ltr" className="font-mono">{certNo}</span>} subtitle={t("lineageIntro")} />
      <Status state={state} />
      {nodes && (
        <ol className="space-y-2">
          {nodes.map((n) => (
            <li key={n.certificateNo} style={{ marginInlineStart: `${Math.min(n.depth, 8) * 1.5}rem` }}>
              <div className={`card flex flex-wrap items-center justify-between gap-2 ${n.current ? "ring-2 ring-emerald-600/40" : ""}`}>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium" dir="ltr">
                    {n.current ? n.certificateNo : <Link className="hover:underline" href={`/certificates/${encodeURIComponent(n.certificateNo)}`}>{n.certificateNo}</Link>}
                  </p>
                  <p className="text-sm text-slate-600">
                    {name(n.holderEn, n.holderAr)} · {num(n.quantity)} {n.className}
                    {n.instrumentType !== "SHARES" && <span className="ms-1 text-xs text-slate-500">({n.instrumentType})</span>} · {n.dateIssued}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {n.reason === "TRANSFER" && state.orgId && (
                    <DownloadButton label={t("transferFormDownload")} run={() => api.transferFormPdf(state.orgId!, n.certificateNo)} />
                  )}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{t(`reason${n.reason}` as Key)}</span>
                  <span className={`rounded-full px-2 py-0.5 ${n.status === "ISSUED" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{n.status}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
