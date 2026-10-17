"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [token, setToken] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
    // Keep the one-time token out of the address bar, history and referrers once it has been read.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) return setError(t("resetMismatch"));
    setBusy(true);
    setError(null);
    try {
      await api.resetPassword(token!, pw);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (token === null) return null;
  return (
    <div className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">{t("resetTitle")}</h1>
      {done ? (
        <div className="card space-y-3">
          <p className="text-sm text-emerald-800">{t("resetDone")}</p>
          <Link href="/login" className="btn">
            {t("signIn")}
          </Link>
        </div>
      ) : token === "" ? (
        <div className="card space-y-3">
          <p className="text-sm text-red-700">{t("resetNoToken")}</p>
          <Link href="/forgot-password" className="btn-ghost">
            {t("forgotTitle")}
          </Link>
        </div>
      ) : (
        <form className="card space-y-4" onSubmit={submit}>
          <div>
            <label className="label" htmlFor="np">
              {t("newPassword")}
            </label>
            <input
              id="np"
              type="password"
              minLength={12}
              className="input"
              dir="ltr"
              required
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">{t("passwordHint")}</p>
          </div>
          <div>
            <label className="label" htmlFor="np2">
              {t("confirmPassword")}
            </label>
            <input
              id="np2"
              type="password"
              minLength={12}
              className="input"
              dir="ltr"
              required
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <button className="btn w-full" disabled={busy}>
            {t("resetSubmit")}
          </button>
        </form>
      )}
    </div>
  );
}
