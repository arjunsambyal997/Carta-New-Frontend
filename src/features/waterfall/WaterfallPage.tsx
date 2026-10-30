"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";
import type { Waterfall } from "@/api/types";

const COLORS = [
  "bg-[rgb(var(--series-1))]",
  "bg-[rgb(var(--series-2))]",
  "bg-[rgb(var(--series-3))]",
  "bg-[rgb(var(--series-4))]",
  "bg-[rgb(var(--series-5))]",
  "bg-slate-500",
];

export default function WaterfallPage() {
  const { t, num, name } = useI18n();
  const state = useRegister((orgId) => api.organization(orgId));
  const [exit, setExit] = useState("10000000");
  const [result, setResult] = useState<Waterfall | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e: FormEvent) {
    e.preventDefault();
    if (!state.orgId) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api.waterfall(state.orgId, Number(exit)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const money = (n: number) => num(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (n: number) => `${num(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const cur = state.data?.baseCurrency ?? "";

  return (
    <div className="space-y-4">
      <PageHeader title={t("navWaterfall")} />
      <Status state={state} shape="form" />
      {state.data && (
        <>
          <form onSubmit={run} className="card flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label className="label" htmlFor="exit">
                {t("exitValue")} ({cur})
              </label>
              <input
                id="exit"
                required
                type="number"
                min={0}
                step="any"
                dir="ltr"
                className="input"
                value={exit}
                onChange={(e) => setExit(e.target.value)}
              />
            </div>
            <button className="btn" disabled={busy} type="submit">
              {busy ? t("calculating") : t("calculate")}
            </button>
          </form>
          {error && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <p className="text-xs text-slate-500">{t("waterfallHint")}</p>
        </>
      )}

      {result && (
        <div className="space-y-6">
          <div className="card space-y-3">
            <div className="flex h-6 w-full overflow-hidden rounded bg-slate-100" role="img" aria-label={t("byClass")}>
              {result.classes.map((c, i) => (
                <div
                  key={c.shareClassId}
                  className={COLORS[i % COLORS.length]}
                  style={{ width: `${Math.max(0, c.pctOfExit)}%` }}
                  title={`${c.name}: ${pct(c.pctOfExit)}`}
                />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              {result.classes.map((c, i) => (
                <li key={c.shareClassId} className="flex items-center gap-1.5">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${COLORS[i % COLORS.length]}`} />
                  {c.name} · {pct(c.pctOfExit)}
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-600">
              {t("commonPrice")}:{" "}
              <span className="font-medium tabular-nums">
                {cur} {num(result.commonPricePerShare, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            </p>
          </div>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">{t("byClass")}</h2>
            <div className="card overflow-x-auto p-0">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {[
                      t("className"),
                      t("invested"),
                      t("preference"),
                      t("prefPaid"),
                      t("residual"),
                      t("total"),
                      t("pctExit"),
                    ].map((h, i) => (
                      <th key={h} className={`px-3 py-2 font-medium ${i === 0 ? "text-start" : "text-end"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {result.classes.map((c) => (
                    <tr key={c.shareClassId}>
                      <td className="px-3 py-2 text-start font-medium">
                        {c.name}
                        {c.liquidationPreference > 0 && (
                          <span
                            className={`ms-2 rounded px-1.5 py-0.5 text-[11px] ${c.converted ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"}`}
                          >
                            {c.converted ? t("converted") : t("keepsPref")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-end">{money(c.invested)}</td>
                      <td className="px-3 py-2 text-end">{money(c.liquidationPreference)}</td>
                      <td className="px-3 py-2 text-end">{money(c.preferencePaid)}</td>
                      <td className="px-3 py-2 text-end">{money(c.residualPaid)}</td>
                      <td className="px-3 py-2 text-end font-semibold">{money(c.total)}</td>
                      <td className="px-3 py-2 text-end">{pct(c.pctOfExit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">{t("byHolder")}</h2>
            <div className="card overflow-x-auto p-0">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {[t("shareholder"), t("total"), t("pctExit")].map((h, i) => (
                      <th key={h} className={`px-3 py-2 font-medium ${i === 0 ? "text-start" : "text-end"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {result.holders.map((h) => (
                    <tr key={h.shareholderId}>
                      <td className="px-3 py-2 text-start font-medium">{name(h.nameEn, h.nameAr)}</td>
                      <td className="px-3 py-2 text-end">{money(h.total)}</td>
                      <td className="px-3 py-2 text-end">{pct(h.pctOfExit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
