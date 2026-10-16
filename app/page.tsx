"use client";

import { Dashboard } from "@/components/Dashboard";
import { PageHeader } from "@/components/PageHeader";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function DashboardPage() {
  const { t, name } = useI18n();
  const state = useRegister(async (orgId) => {
    const [org, table, resolutions, certificates, classes, holders, members] = await Promise.all([
      api.organization(orgId),
      api.capTable(orgId),
      api.resolutions(orgId).catch(() => null),
      api.certificates(orgId).catch(() => null),
      api.shareClasses(orgId).catch(() => null),
      api.shareholders(orgId).catch(() => null),
      api.members(orgId).catch(() => null), // admins only; others never see the invite step
    ]);
    const progress = { classes: classes?.length ?? null, holders: holders?.length ?? null, members: members?.length ?? null };
    return { org, table, resolutions, certificates, progress };
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("dashWelcome")} title={state.data ? name(state.data.org.legalNameEn, state.data.org.legalNameAr) : t("navDashboard")} />
      <Status state={state} />
      {state.data && <Dashboard table={state.data.table} resolutions={state.data.resolutions} certificates={state.data.certificates} progress={state.data.progress} />}
    </div>
  );
}
