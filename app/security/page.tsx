"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { api, getSession, saveSession } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { useI18n } from "@/lib/i18n";
import type { Enrollment } from "@/lib/types";

export default function SecurityPage() {
  const { t } = useI18n();
  const [enr, setEnr] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    if (!getSession()) return;
    api.mfaEnroll().then(setEnr).catch((e: Error) => setError(e.message));
  }, []);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await api.mfaConfirm(code.trim());
      saveSession(r.accessToken!, r.organizationId ?? getSession()!.orgId, r.refreshToken);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!ready) return null;
  if (!getSession() && !enr)
    return <Link href="/login" className="btn">{t("signIn")}</Link>;

  return (
    <div className="max-w-md space-y-4">
      <PageHeader title={t("securityTitle")} />
      {done ? (
        <div className="card space-y-3">
          <p className="text-emerald-800">{t("mfaEnabled")}</p>
          <Link href="/setup" className="btn">{t("navSetup")}</Link>
        </div>
      ) : (
        <form className="card space-y-4" onSubmit={confirm}>
          <p className="text-sm text-slate-600">{t("securityIntro")}</p>
          {enr && (
            <>
              <div className="flex justify-center rounded bg-white p-2"><QRCodeSVG value={enr.otpauthUri} size={168} /></div>
              <div>
                <span className="label">{t("secretKey")}</span>
                <code className="block break-all rounded bg-slate-100 p-2 text-sm" dir="ltr">{enr.secret}</code>
              </div>
            </>
          )}
          <input className="input text-center text-lg tracking-widest" dir="ltr" inputMode="numeric" autoComplete="one-time-code"
            maxLength={6} pattern="[0-9]{6}" required aria-label={t("mfaCode")} value={code} onChange={(e) => setCode(e.target.value)} />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button className="btn w-full" disabled={!enr}>{t("confirmEnable")}</button>
        </form>
      )}
    </div>
  );
}
