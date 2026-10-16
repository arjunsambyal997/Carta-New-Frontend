"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { useI18n } from "@/lib/i18n";

export default function ChangePasswordPage() {
  const { t } = useI18n();
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    if (pw !== pw2) return setError(t("resetMismatch"));
    setError(null);
    try {
      await api.changePassword(cur, pw);
      setOk(true);
      setCur(""); setPw(""); setPw2("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="max-w-sm space-y-4">
      <PageHeader title={t("changeTitle")} />
      <form className="card space-y-4" onSubmit={submit}>
        <div><label className="label" htmlFor="cp">{t("currentPassword")}</label><input id="cp" type="password" className="input" dir="ltr" required autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div><label className="label" htmlFor="n1">{t("newPassword")}</label><input id="n1" type="password" minLength={12} className="input" dir="ltr" required autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /><p className="mt-1 text-xs text-slate-500">{t("passwordHint")}</p></div>
        <div><label className="label" htmlFor="n2">{t("confirmPassword")}</label><input id="n2" type="password" minLength={12} className="input" dir="ltr" required autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {ok && <p className="text-sm text-emerald-700">{t("changeDone")}</p>}
        <button className="btn w-full">{t("changeTitle")}</button>
      </form>
    </div>
  );
}
