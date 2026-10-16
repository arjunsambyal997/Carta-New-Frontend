"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { CapTableGrid } from "@/components/CapTableGrid";
import { PageHeader } from "@/components/PageHeader";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function CapTablePage() {
  const { t } = useI18n();
  const [asOf, setAsOf] = useState("");
  const [version, setVersion] = useState(0);
  const state = useRegister((orgId) => api.capTable(orgId, asOf || undefined), version);
  const today = new Date().toISOString().slice(0, 10);

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
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="label" htmlFor="asof">{t("capAsOf")}</label>
          <input id="asof" type="date" className="input" dir="ltr" max={today} value={asOf} onChange={(e) => { setAsOf(e.target.value); setVersion((v) => v + 1); }} />
        </div>
        {asOf && <button className="btn-ghost h-10" onClick={() => { setAsOf(""); setVersion((v) => v + 1); }}>{t("capToday")}</button>}
      </div>
      {asOf && <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t("capHistoricNote")} {asOf}</p>}
      <Status state={state} />
      {state.data && <CapTableGrid table={state.data} />}
    </div>
  );
}
