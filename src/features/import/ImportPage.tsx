"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/common/DownloadButton";
import { useFeedback } from "@/components/common/Feedback";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";
import type { ImportResult } from "@/api/types";

type Kind = "shareholders" | "issuances";

export default function ImportPage() {
  const { t, num } = useI18n();
  const { confirm, toast } = useFeedback();
  const state = useRegister((orgId) => api.organization(orgId));
  const [kind, setKind] = useState<Kind>("shareholders");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(dryRun: boolean) {
    if (!state.orgId || !file) return;
    if (
      !dryRun &&
      !(await confirm({
        message: t("confirmImportTitle"),
        detail: `${file.name} · ${num(result?.created ?? 0)} ${t("importWillCreate")}\n\n${t("confirmImportDetail")}`,
        confirmLabel: t("importRun"),
      }))
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.importCsv(state.orgId, kind, file, dryRun);
      setResult(r);
      if (!dryRun) toast(`${t("importDone")} ${num(r.created)} ${t("importCreated")}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const reset = (k: Kind) => {
    setKind(k);
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title={t("navImport")} subtitle={t("importIntro")} />
      <Status state={state} />
      {state.orgId && (
        <div className="card space-y-5">
          <div className="flex flex-wrap gap-2" role="tablist">
            {(["shareholders", "issuances"] as Kind[]).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={kind === k}
                className={kind === k ? "btn" : "btn-ghost"}
                onClick={() => reset(k)}
              >
                {t(k === "shareholders" ? "importHolders" : "importIssuances")}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-600">
            {t(kind === "shareholders" ? "importHoldersHelp" : "importIssuancesHelp")}
          </p>
          <DownloadButton
            label={t("importTemplate")}
            run={() => api.importTemplate(state.orgId!, kind === "shareholders" ? "holders" : "issuances")}
          />
          <div>
            <label className="label" htmlFor="csv">
              {t("importFile")}
            </label>
            <input
              key={kind + (file ? file.name : "")}
              id="csv"
              type="file"
              accept=".csv,text/csv"
              className="input"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" disabled={!file || busy} onClick={() => run(true)}>
              {t("importCheck")}
            </button>
            <button
              className="btn"
              disabled={!file || busy || !result || !result.dryRun || result.errors.length > 0}
              onClick={() => run(false)}
            >
              {t("importRun")}
            </button>
          </div>
          {error && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {result && <ResultView r={result} />}
        </div>
      )}
    </div>
  );
}

function ResultView({ r }: { r: ImportResult }) {
  const { t, num } = useI18n();
  const bad = r.errors.length > 0;
  return (
    <div className="space-y-3" aria-live="polite">
      <div
        className={`rounded-md border p-3 text-sm ${bad ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
      >
        {bad
          ? t("importErrorsFound")
          : r.dryRun
            ? `${t("importCheckOk")} ${num(r.created)} ${t("importWillCreate")}, ${num(r.skipped)} ${t("importSkipped")}`
            : `${t("importDone")} ${num(r.created)} ${t("importCreated")}, ${num(r.skipped)} ${t("importSkipped")}`}
      </div>
      {[...r.errors.map((m) => ({ ...m, bad: true })), ...r.warnings.map((m) => ({ ...m, bad: false }))].length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 text-start">{t("importRow")}</th>
                <th className="text-start">{t("importMessage")}</th>
              </tr>
            </thead>
            <tbody>
              {[...r.errors.map((m) => ({ ...m, bad: true })), ...r.warnings.map((m) => ({ ...m, bad: false }))].map(
                (m, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 tabular-nums">{m.row}</td>
                    <td className={m.bad ? "text-red-700" : "text-amber-700"}>{m.message}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
