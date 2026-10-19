"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";

const PAGE = 50;
const TONE: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-800",
  UPDATE: "bg-sky-50 text-sky-800",
  DELETE: "bg-red-50 text-red-800",
};

export default function AuditPage() {
  const { t, date } = useI18n();
  const state = useRegister((orgId) => api.audit(orgId));
  const trail = state.data;
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("");
  const [shown, setShown] = useState(PAGE);

  const entities = useMemo(() => [...new Set((trail?.entries ?? []).map((e) => e.entityName))].sort(), [trail]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (trail?.entries ?? []).filter(
      (e) =>
        (!entity || e.entityName === entity) &&
        (!q || `${e.detail ?? ""} ${e.performedBy} ${e.entityName}`.toLowerCase().includes(q)),
    );
  }, [trail, query, entity]);

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
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label className="label" htmlFor="aq">
                {t("search")}
              </label>
              <input
                id="aq"
                className="input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShown(PAGE);
                }}
              />
            </div>
            <div>
              <label className="label" htmlFor="ae">
                {t("entity")}
              </label>
              <select
                id="ae"
                className="input"
                value={entity}
                onChange={(e) => {
                  setEntity(e.target.value);
                  setShown(PAGE);
                }}
              >
                <option value="">{t("all")}</option>
                {entities.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {rows.length === 0 ? (
            <div className="card">
              <EmptyState icon="audit" title={t("auditNone")} hint={t("auditNoneHint")} />
            </div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {["#", t("when"), t("entity"), t("action"), t("detail"), t("by")].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-start font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, shown).map((e) => (
                    <tr key={e.id} className="align-top">
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-500">{e.id}</td>
                      <td className="whitespace-nowrap px-3 py-2">{date(e.occurredAt, true)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{e.entityName}</td>
                      <td className="px-3 py-2">
                        <span className={`chip ${TONE[e.action] ?? "bg-slate-100 text-slate-600"}`}>{e.action}</span>
                      </td>
                      <td className="min-w-60 break-words px-3 py-2">{e.detail}</td>
                      <td className="break-all px-3 py-2 text-slate-600" dir="ltr">
                        {e.performedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.length > shown && (
            <div className="flex justify-center">
              <button className="btn-ghost" onClick={() => setShown((n) => n + PAGE)}>
                {t("showMore")} ({rows.length - shown})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
