"use client";

import { DownloadButton } from "@/components/DownloadButton";
import { CapTableGrid } from "@/components/CapTableGrid";
import { PageHeader } from "@/components/PageHeader";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function CapTablePage() {
  const { t } = useI18n();
  const state = useRegister((orgId) => api.capTable(orgId));

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("navCapTable")}
        subtitle={t("subCapTable")}
        action={
          state.orgId && (
            <>
              <DownloadButton label={t("exportCsv")} run={() => api.capTableExport(state.orgId!, "csv")} />
              <DownloadButton label={t("exportPdf")} run={() => api.capTableExport(state.orgId!, "pdf")} />
            </>
          )
        }
      />
      <Status state={state} />
      {state.data && <CapTableGrid table={state.data} />}
    </div>
  );
}
