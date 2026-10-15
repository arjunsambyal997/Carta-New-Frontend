"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, saveSession } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { AuthResult } from "@/lib/types";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgs, setOrgs] = useState<AuthResult["organizations"]>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function finish(r: AuthResult, orgId?: string) {
    if (r.status === "ORG_SELECTION_REQUIRED") return setOrgs(r.organizations);
    if (r.status === "MFA_REQUIRED") return setMfaToken(r.mfaToken);
    saveSession(r.accessToken!, r.organizationId ?? orgId!);
    router.push(r.mfaEnrollmentRequired ? "/security" : "/");
  }

  async function run(fn: () => Promise<AuthResult>, orgId?: string) {
    setBusy(true);
    setError(null);
    try {
      await finish(await fn(), orgId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (mfaToken)
    return (
      <div className="max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">{t("mfaTitle")}</h1>
        <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => api.verifyMfa(mfaToken, code.trim())); }}>
          <p className="text-sm text-slate-600">{t("mfaPrompt")}</p>
          <input className="input text-center text-lg tracking-widest" dir="ltr" inputMode="numeric" autoComplete="one-time-code"
            maxLength={6} pattern="[0-9]{6}" required autoFocus aria-label={t("mfaCode")} value={code} onChange={(e) => setCode(e.target.value)} />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button className="btn w-full" disabled={busy}>{t("verify")}</button>
        </form>
      </div>
    );

  if (orgs)
    return (
      <div className="max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">{t("chooseOrg")}</h1>
        <ul className="card space-y-2">
          {orgs.map((o) => (
            <li key={o.id}>
              <button className="btn-ghost w-full justify-between" disabled={busy} onClick={() => run(() => api.login(email, password, o.id), o.id)}>
                <span>{o.name}</span>
                <span className="text-xs text-slate-500">{t(`role${o.role}` as never)}</span>
              </button>
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    );

  return (
    <div className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>
      <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => api.login(email, password)); }}>
        <div>
          <label className="label" htmlFor="email">{t("email")}</label>
          <input id="email" type="email" className="input" dir="ltr" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">{t("password")}</label>
          <input id="pw" type="password" className="input" dir="ltr" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? t("signingIn") : t("signIn")}</button>
        <p className="text-sm"><Link href="/forgot-password" className="text-emerald-700 underline">{t("forgotLink")}</Link></p>
      </form>
      <p className="text-sm text-slate-600">
        {t("noAccount")} <Link href="/signup" className="text-emerald-700 underline">{t("createOne")}</Link>
      </p>
      <p className="text-xs text-slate-400"><Link href="/settings">{t("advancedConnect")}</Link></p>
    </div>
  );
}
