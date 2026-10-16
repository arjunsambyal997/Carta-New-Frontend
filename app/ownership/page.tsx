"use client";

import { OwnershipTree } from "@/components/OwnershipTree";
import { PageHeader } from "@/components/PageHeader";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function OwnershipPage() {
  const { t } = useI18n();
  const state = useRegister(async (orgId) => {
    const [org, table, links] = await Promise.all([
      api.organization(orgId),
      api.capTable(orgId),
      api.ownershipLinks(orgId).catch(() => []),
    ]);
    return { org, table, links };
  });

  return (
    <div className="space-y-4">
      <PageHeader title={t("navOwnership")} />
      <Status state={state} />
      {state.data && <OwnershipTree org={state.data.org} table={state.data.table} links={state.data.links} />}
    </div>
  );
}
