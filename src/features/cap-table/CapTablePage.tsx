"use client";

import { CalendarDays, Download, FileText, Search, X } from "lucide-react";
import { useState } from "react";
import { DownloadButton } from "@/components/common/DownloadButton";
import { CapTableGrid } from "@/features/cap-table/CapTableGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function CapTablePage() {
  const { t } = useI18n();
  const [asOf, setAsOf] = useState("");
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(0);
  const state = useRegister((orgId) => api.capTable(orgId, asOf || undefined), version);
  const [now] = useState(() => new Date());
  const today = iso(now);
  const presets = [
    { label: t("capPresetToday"), value: "" },
    { label: t("capPreset30"), value: iso(new Date(now.getTime() - 30 * 86_400_000)) },
    { label: t("capPresetYear"), value: `${now.getFullYear()}-01-01` },
  ];
  const pick = (value: string) => {
    setAsOf(value);
    setVersion((v) => v + 1);
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("navCapTable")} subtitle={t("subCapTable")} />
      <div className="card flex flex-wrap items-end gap-x-4 gap-y-3 !p-3 sm:!p-4">
        <div>
          <label className="label" htmlFor="asof">
            {t("capAsOf")}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <CalendarDays
                size={16}
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="asof"
                type="date"
                className="input !ps-9"
                dir="ltr"
                max={today}
                value={asOf}
                onChange={(e) => pick(e.target.value)}
              />
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 p-0.5" role="group">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={asOf === p.value}
                  onClick={() => pick(p.value)}
                  className="rounded-[10px] px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 aria-pressed:bg-emerald-600/10 aria-pressed:text-emerald-800"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="min-w-48 flex-1 sm:max-w-xs">
          <label className="label" htmlFor="cap-filter">
            {t("capSearch")}
          </label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="cap-filter"
              type="search"
              className="input !ps-9 !pe-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("capSearch")}
            />
            {query && (
              <button
                type="button"
                aria-label={t("menuClose")}
                onClick={() => setQuery("")}
                className="absolute end-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={14} aria-hidden />
              </button>
            )}
          </div>
        </div>
        {state.orgId && (
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <DownloadButton
              label={
                <>
                  <Download size={16} aria-hidden />
                  {t("exportCsv")}
                </>
              }
              run={() => api.capTableExport(state.orgId!, "csv")}
            />
            <DownloadButton
              className="btn"
              label={
                <>
                  <FileText size={16} aria-hidden />
                  {t("exportPdf")}
                </>
              }
              run={() => api.capTableExport(state.orgId!, "pdf")}
            />
          </div>
        )}
      </div>
      {asOf && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t("capHistoricNote")} {asOf}
        </p>
      )}
      <Status state={state} shape="table" />
      {state.data && <CapTableGrid table={state.data} query={query} />}
    </div>
  );
}
