"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">{t("forgotTitle")}</h1>
      {sent ? (
        <div className="card space-y-3">
          <p className="text-sm">{t("forgotSent")}</p>
          <Link href="/login" className="btn-ghost">{t("signIn")}</Link>
        </div>
      ) : (
        <form className="card space-y-4" onSubmit={submit}>
          <p className="text-sm text-slate-600">{t("forgotIntro")}</p>
          <div>
            <label className="label" htmlFor="fe">{t("email")}</label>
            <input id="fe" type="email" className="input" dir="ltr" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button className="btn w-full" disabled={busy}>{t("forgotSend")}</button>
        </form>
      )}
    </div>
  );
}
