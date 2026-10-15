"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { CertificateVerification } from "@/lib/types";

function Verify() {
  const { t, num, name } = useI18n();
  const { certNo } = useParams<{ certNo: string }>();
  const hash = useSearchParams().get("h") ?? undefined;
  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.verifyCertificate(certNo, hash).then(setResult).catch((e: Error) => setError(e.message));
  }, [certNo, hash]);

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">{t("verifyTitle")}</h1>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {result && (
        <div className="card space-y-3">
          <div className={`rounded-md p-3 text-sm font-medium ${result.authentic ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
            {result.authentic ? t("authentic") : t("notAuthentic")}
          </div>
          <dl className="space-y-2 text-sm">
            {([
              [t("certNo"), result.certificateNo],
              [t("issuer"), name(result.issuerNameEn, result.issuerNameAr)],
              [t("className"), result.shareClassName],
              [t("quantity"), num(result.quantity)],
              [t("dateIssued"), result.dateIssued],
              [t("status"), result.status],
            ] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
