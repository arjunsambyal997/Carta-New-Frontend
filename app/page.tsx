"use client";

import { Dashboard } from "@/components/Dashboard";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function DashboardPage() {
  const { t, name } = useI18n();
  const state = useRegister(async (orgId) => {
    const [org, table, resolutions, certificates] = await Promise.all([
      api.organization(orgId),
      api.capTable(orgId),
      api.resolutions(orgId).catch(() => null),
      api.certificates(orgId).catch(() => null),
    ]);
    return { org, table, resolutions, certificates };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">{t("dashWelcome")}</p>
        <h1>{state.data ? name(state.data.org.legalNameEn, state.data.org.legalNameAr) : t("navDashboard")}</h1>
      </div>
      <Status state={state} />
      {state.data && <Dashboard table={state.data.table} resolutions={state.data.resolutions} certificates={state.data.certificates} />}
    </div>
  );
}
