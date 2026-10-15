"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, saveSession } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Jurisdiction } from "@/lib/types";

const JURISDICTIONS: Jurisdiction[] = ["MAINLAND_UAE", "ADGM", "DIFC", "KSA"];
const CURRENCIES = ["AED", "SAR", "USD", "QAR", "BHD", "KWD", "OMR"];

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [f, setF] = useState({
    displayName: "", email: "", password: "", legalNameEn: "", legalNameAr: "",
    jurisdiction: "MAINLAND_UAE" as Jurisdiction, commercialLicenseNo: "", baseCurrency: "AED", certificatePrefix: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.signup({
        email: f.email, password: f.password, displayName: f.displayName,
        organization: {
          legalNameEn: f.legalNameEn, legalNameAr: f.legalNameAr || undefined, jurisdiction: f.jurisdiction,
          commercialLicenseNo: f.commercialLicenseNo, baseCurrency: f.baseCurrency, certificatePrefix: f.certificatePrefix,
        },
      });
      saveSession(r.accessToken!, r.organizationId!, r.refreshToken);
      router.push("/security");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">{t("signupTitle")}</h1>
      <form className="card grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <div><label className="label" htmlFor="n">{t("yourName")}</label><input id="n" className="input" required value={f.displayName} onChange={set("displayName")} /></div>
        <div><label className="label" htmlFor="e">{t("email")}</label><input id="e" type="email" className="input" dir="ltr" required autoComplete="username" value={f.email} onChange={set("email")} /></div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p">{t("password")}</label>
          <input id="p" type="password" minLength={12} className="input" dir="ltr" required autoComplete="new-password" value={f.password} onChange={set("password")} />
          <p className="mt-1 text-xs text-slate-500">{t("passwordHint")}</p>
        </div>
        <div><label className="label" htmlFor="l1">{t("legalNameEn")}</label><input id="l1" className="input" required value={f.legalNameEn} onChange={set("legalNameEn")} /></div>
        <div><label className="label" htmlFor="l2">{t("legalNameAr")}</label><input id="l2" className="input" dir="rtl" value={f.legalNameAr} onChange={set("legalNameAr")} /></div>
        <div>
          <label className="label" htmlFor="j">{t("jurisdiction")}</label>
          <select id="j" className="input" value={f.jurisdiction} onChange={set("jurisdiction")}>
            {JURISDICTIONS.map((j) => <option key={j} value={j}>{t(`jur${j}` as never)}</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="lic">{t("licenseNo")}</label><input id="lic" className="input" dir="ltr" required value={f.commercialLicenseNo} onChange={set("commercialLicenseNo")} /></div>
        <div>
          <label className="label" htmlFor="c">{t("baseCurrency")}</label>
          <select id="c" className="input" value={f.baseCurrency} onChange={set("baseCurrency")}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pre">{t("certPrefix")}</label>
          <input id="pre" className="input" dir="ltr" required pattern="[A-Za-z0-9]{2,12}" value={f.certificatePrefix} onChange={set("certificatePrefix")} />
          <p className="mt-1 text-xs text-slate-500">{t("certPrefixHint")}</p>
        </div>
        {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
        <button className="btn sm:col-span-2" disabled={busy}>{t("create")}</button>
      </form>
      <p className="text-sm text-slate-600">{t("haveAccount")} <Link href="/login" className="text-emerald-700 underline">{t("signIn")}</Link></p>
    </div>
  );
}
