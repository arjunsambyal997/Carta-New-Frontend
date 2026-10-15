"use client";

import { CapTableGrid } from "@/components/CapTableGrid";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function CapTablePage() {
  const { t, name } = useI18n();
  const state = useRegister(async (orgId) => {
    const [org, table] = await Promise.all([api.organization(orgId), api.capTable(orgId)]);
    return { org, table };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {state.data ? name(state.data.org.legalNameEn, state.data.org.legalNameAr) : t("navCapTable")}
      </h1>
      <Status state={state} />
      {state.data && <CapTableGrid table={state.data.table} />}
    </div>
  );
}
