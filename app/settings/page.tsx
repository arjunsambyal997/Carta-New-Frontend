"use client";

import { useEffect, useState } from "react";
import { clearSession, getSession, saveSession } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useI18n();
  const [token, setToken] = useState("");
  const [orgId, setOrgId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s) {
      setToken(s.token);
      setOrgId(s.orgId);
      setSaved(true);
    }
  }, []);

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title={t("connectTitle")} />
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveSession(token, orgId);
          setSaved(true);
        }}
      >
        <div>
          <label className="label" htmlFor="org">{t("orgId")}</label>
          <input id="org" className="input" dir="ltr" required value={orgId} onChange={(e) => setOrgId(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="tok">{t("token")}</label>
          <textarea id="tok" className="input h-28 font-mono text-xs" dir="ltr" required value={token} onChange={(e) => setToken(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">{t("tokenHint")}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" type="submit">{t("save")}</button>
          {saved && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                clearSession();
                setToken("");
                setOrgId("");
                setSaved(false);
              }}
            >
              {t("disconnect")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
