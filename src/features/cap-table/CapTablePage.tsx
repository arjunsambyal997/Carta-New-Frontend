"use client";

import { DownloadButton } from "@/components/common/DownloadButton";
import { CapTableGrid } from "@/features/cap-table/CapTableGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";

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
