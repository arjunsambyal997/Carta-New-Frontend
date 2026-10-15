"use client";

import { CapTableGrid } from "@/components/CapTableGrid";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function CapTablePage() {
  const { t } = useI18n();
  const state = useRegister((orgId) => api.capTable(orgId));

  return (
    <div className="space-y-5">
      <h1>{t("navCapTable")}</h1>
      <Status state={state} />
      {state.data && <CapTableGrid table={state.data} />}
    </div>
  );
}
