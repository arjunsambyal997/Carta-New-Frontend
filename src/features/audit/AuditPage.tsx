"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";

export default function AuditPage() {
  const { t } = useI18n();
  const state = useRegister((orgId) => api.audit(orgId));
  const trail = state.data;

  return (
    <div className="space-y-4">
      <PageHeader title={t("navAudit")} subtitle={t("subAudit")} />
      <Status state={state} />
      {trail && (
        <>
          <div
            className={`rounded-md p-3 text-sm font-medium ${trail.chainIntact ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
          >
            {trail.chainIntact ? t("chainIntact") : `${t("chainBroken")} #${trail.firstBrokenEntry}`}
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["#", t("when"), t("entity"), t("action"), t("detail"), t("by")].map((h) => (
                    <th key={h} className="px-3 py-2 text-start font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trail.entries.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="px-3 py-2 tabular-nums">{e.id}</td>
                    <td className="whitespace-nowrap px-3 py-2">{new Date(e.occurredAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{e.entityName}</td>
                    <td className="px-3 py-2">{e.action}</td>
                    <td className="px-3 py-2">{e.detail}</td>
                    <td className="px-3 py-2">{e.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
