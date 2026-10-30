"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useMe } from "@/hooks/useMe";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";

export default function DashboardPage() {
  const router = useRouter();
  const me = useMe();
  const holder = me?.role === "SHAREHOLDER";
  useEffect(() => {
    if (holder) router.replace("/portal");
  }, [holder, router]);
  // Shareholder accounts have their own home; do not load the register views they cannot read.
  if (me === undefined || holder) return null;
  return <StaffDashboard role={me?.role} />;
}

/** `role` comes from the page: a second `useMe()` here would still be loading on first render, and the loader below reads it once. */
function StaffDashboard({ role }: { role: string | undefined }) {
  const { t, name } = useI18n();
  // Only request panels this role may read, so restricted roles do not trigger 403s.
  const canMembers = role === "FOUNDER";
  const canAudit = role === "FOUNDER" || role === "CORPORATE_SECRETARY" || role === "LEGAL_AUDITOR";
  const canIssue = role === "FOUNDER" || role === "CORPORATE_SECRETARY";
  const state = useRegister(async (orgId) => {
    const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const [org, table, prior, resolutions, certificates, classes, holders, members, approvals, compliance, audit] =
      await Promise.all([
        api.organization(orgId),
        api.capTable(orgId),
        api.capTable(orgId, monthAgo).catch(() => null),
        api.resolutions(orgId).catch(() => null),
        api.certificates(orgId).catch(() => null),
        api.shareClasses(orgId).catch(() => null),
        api.shareholders(orgId).catch(() => null),
        canMembers ? api.members(orgId).catch(() => null) : Promise.resolve(null),
        api.approvals(orgId).catch(() => null),
        api.compliance(orgId).catch(() => null),
        canAudit ? api.audit(orgId).catch(() => null) : Promise.resolve(null),
      ]);
    return {
      org,
      table,
      prior,
      resolutions,
      certificates,
      setup: { classes: classes?.length ?? 0, holders: holders?.length ?? 0, members: members?.length ?? 0 },
      approvals,
      filings: compliance?.items ?? null,
      audit: audit?.entries ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("dashWelcome")}
        title={state.data ? name(state.data.org.legalNameEn, state.data.org.legalNameAr) : t("navDashboard")}
        action={
          canIssue && (
            <>
              <Link href="/resolutions?new" className="btn-ghost h-9 rounded-full px-4">
                {t("newResolution")}
              </Link>
              <Link href="/certificates/new" className="btn h-9 rounded-full">
                {t("navIssue")}
              </Link>
            </>
          )
        }
      />
      <Status state={state} />
      {state.data && (
        <Dashboard
          org={state.data.org}
          approvals={state.data.approvals}
          filings={state.data.filings}
          audit={state.data.audit}
          table={state.data.table}
          prior={state.data.prior}
          resolutions={state.data.resolutions}
          certificates={state.data.certificates}
          setup={state.data.setup}
        />
      )}
    </div>
  );
}
