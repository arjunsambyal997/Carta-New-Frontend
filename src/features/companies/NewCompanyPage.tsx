"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { api, saveSession } from "@/api";
import { useI18n } from "@/context/I18nContext";
import type { Jurisdiction } from "@/api/types";

const JURISDICTIONS: Jurisdiction[] = ["MAINLAND_UAE", "ADGM", "DIFC", "KSA"];
const CURRENCIES = ["AED", "SAR", "USD", "QAR", "BHD", "KWD", "OMR"];

/** Start another company under the account you are signed in with. You become its founder. */
export default function NewCompanyPage() {
  const { t } = useI18n();
  const [f, setF] = useState({
    legalNameEn: "",
    legalNameAr: "",
    jurisdiction: "MAINLAND_UAE" as Jurisdiction,
    commercialLicenseNo: "",
    baseCurrency: "AED",
    certificatePrefix: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.addOrganization({ ...f, legalNameAr: f.legalNameAr || undefined });
      saveSession(r.accessToken!, r.organizationId!, r.refreshToken);
      window.location.assign("/");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("addCompany")} subtitle={t("addCompanyIntro")} />
      <form onSubmit={submit} className="card grid max-w-4xl gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="l1">
            {t("legalNameEn")}
          </label>
          <input id="l1" className="input" required value={f.legalNameEn} onChange={set("legalNameEn")} />
        </div>
        <div>
          <label className="label" htmlFor="l2">
            {t("legalNameAr")}
          </label>
          <input id="l2" className="input" dir="rtl" value={f.legalNameAr} onChange={set("legalNameAr")} />
        </div>
        <div>
          <label className="label" htmlFor="j">
            {t("jurisdiction")}
          </label>
          <select id="j" className="input" value={f.jurisdiction} onChange={set("jurisdiction")}>
            {JURISDICTIONS.map((j) => (
              <option key={j} value={j}>
                {t(`jur${j}` as never)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="lic">
            {t("licenseNo")}
          </label>
          <input
            id="lic"
            className="input"
            dir="ltr"
            required
            value={f.commercialLicenseNo}
            onChange={set("commercialLicenseNo")}
          />
        </div>
        <div>
          <label className="label" htmlFor="c">
            {t("baseCurrency")}
          </label>
          <select id="c" className="input" value={f.baseCurrency} onChange={set("baseCurrency")}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pre">
            {t("certPrefix")}
          </label>
          <input
            id="pre"
            className="input"
            dir="ltr"
            required
            pattern="[A-Za-z0-9]{2,12}"
            value={f.certificatePrefix}
            onChange={set("certificatePrefix")}
          />
          <p className="mt-1 text-xs text-slate-500">{t("certPrefixHint")}</p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700 sm:col-span-2">
            {error}
          </p>
        )}
        <button className="btn justify-self-start sm:col-span-2" disabled={busy}>
          {busy ? t("creating") : t("addCompanySubmit")}
        </button>
      </form>
    </div>
  );
}
