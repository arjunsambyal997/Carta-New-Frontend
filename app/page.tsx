"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { Status } from "@/components/Status";
import { useMe } from "@/components/useMe";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function DashboardPage() {
  const router = useRouter();
  const me = useMe();
  const holder = me?.role === "SHAREHOLDER";
  useEffect(() => {
    if (holder) router.replace("/portal");
  }, [holder, router]);
  // Shareholder accounts have their own home; do not load the register views they cannot read.
  if (me === undefined || holder) return null;
  return <StaffDashboard />;
}

function StaffDashboard() {
  const { t, name } = useI18n();
  const state = useRegister(async (orgId) => {
    const [org, table, resolutions, certificates, classes, holders] = await Promise.all([
      api.organization(orgId),
      api.capTable(orgId),
      api.resolutions(orgId).catch(() => null),
      api.certificates(orgId).catch(() => null),
      api.shareClasses(orgId).catch(() => null),
      api.shareholders(orgId).catch(() => null),
    ]);
    return { org, table, resolutions, certificates, setup: { classes: classes?.length ?? 0, holders: holders?.length ?? 0 } };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">{t("dashWelcome")}</p>
        <h1>{state.data ? name(state.data.org.legalNameEn, state.data.org.legalNameAr) : t("navDashboard")}</h1>
      </div>
      <Status state={state} />
      {state.data && <Dashboard table={state.data.table} resolutions={state.data.resolutions} certificates={state.data.certificates} setup={state.data.setup} />}
    </div>
  );
}
