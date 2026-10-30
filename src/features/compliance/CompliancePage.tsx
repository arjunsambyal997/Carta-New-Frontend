"use client";

import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useFeedback } from "@/components/common/Feedback";
import { useMe } from "@/hooks/useMe";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";
import { useI18n, type Key } from "@/context/I18nContext";
import type { ComplianceItem, ComplianceStatus } from "@/api/types";

const STATUS_KEY: Record<ComplianceStatus, Key> = {
  UP_TO_DATE: "compUpToDate",
  PENDING: "compPending",
  DUE_SOON: "compDueSoon",
  OVERDUE: "compOverdue",
};

const STATUS_TONE: Record<ComplianceStatus, string> = {
  UP_TO_DATE: "bg-emerald-50 text-emerald-800",
  PENDING: "bg-slate-100 text-slate-700",
  DUE_SOON: "bg-amber-50 text-amber-800",
  OVERDUE: "bg-red-50 text-red-800",
};

export default function CompliancePage() {
  const { t, date, locale } = useI18n();
  const { toast } = useFeedback();
  const me = useMe();
  const [version, setVersion] = useState(0);
  const state = useRegister((orgId) => api.compliance(orgId), version);
  const [open, setOpen] = useState<string | null>(null);
  const [filedOn, setFiledOn] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFile = me?.role === "FOUNDER" || me?.role === "CORPORATE_SECRETARY";
  const items = state.data?.items ?? [];

  async function save(item: ComplianceItem) {
    if (!state.orgId) return;
    setBusy(true);
    setError(null);
    try {
      await api.recordFiling(state.orgId, item.key, {
        filedOn: filedOn || undefined,
        reference: reference || undefined,
      });
      setOpen(null);
      setFiledOn("");
      setReference("");
      setVersion((v) => v + 1);
      toast(t("toastFiled"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("navCompliance")} subtitle={t("subCompliance")} />
      <Status state={state} shape="cards" />
      {state.data && (
        <>
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {state.data.disclaimer}
          </p>
          {error && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {items.length === 0 && (
            <div className="card">
              <EmptyState icon="check" title={t("compNone")} hint={t("compNoneHint")} />
            </div>
          )}
          <StaggerList className="space-y-5">
            {items.map((i) => (
              <StaggerItem key={i.key} className="card space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-medium">{locale === "ar" ? i.titleAr : i.titleEn}</h2>
                    <p className="text-xs text-slate-500">
                      {t("compDue")}: {i.dueDate ? date(i.dueDate) : "—"}
                      {i.lastFiledOn && (
                        <>
                          {" · "}
                          {t("compLastFiled")}: {date(i.lastFiledOn)}
                          {i.lastReference && <span dir="ltr"> ({i.lastReference})</span>}
                        </>
                      )}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_TONE[i.status]}`}>
                    {t(STATUS_KEY[i.status])}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">{t("compBasis")}:</span> {i.basis}
                </p>
                {i.note && <p className="text-sm text-slate-500">{i.note}</p>}
                {canFile && open !== i.key && (
                  <button className="btn-ghost" onClick={() => setOpen(i.key)}>
                    {t("compMarkFiled")}
                  </button>
                )}
                {canFile && open === i.key && (
                  <div className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3">
                    <div>
                      <label className="label" htmlFor={`f-${i.key}`}>
                        {t("compFiledOn")}
                      </label>
                      <input
                        id={`f-${i.key}`}
                        type="date"
                        className="input"
                        value={filedOn}
                        onChange={(e) => setFiledOn(e.target.value)}
                      />
                    </div>
                    <div className="min-w-48 flex-1">
                      <label className="label" htmlFor={`r-${i.key}`}>
                        {t("compReference")}
                      </label>
                      <input
                        id={`r-${i.key}`}
                        maxLength={200}
                        className="input"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                      />
                    </div>
                    <button className="btn" disabled={busy} onClick={() => save(i)}>
                      {t("compSave")}
                    </button>
                  </div>
                )}
              </StaggerItem>
            ))}
          </StaggerList>
        </>
      )}
    </div>
  );
}
