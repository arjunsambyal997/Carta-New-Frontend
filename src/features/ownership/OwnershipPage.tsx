"use client";

import { OwnershipTree } from "@/features/ownership/OwnershipTree";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";

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
