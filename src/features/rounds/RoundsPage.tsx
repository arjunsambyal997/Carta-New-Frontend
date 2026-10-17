"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";
import type { RoundResult } from "@/api/types";

export default function RoundsPage() {
  const { t, num } = useI18n();
  const state = useRegister((orgId) => api.organization(orgId));
  const [pre, setPre] = useState("");
  const [inv, setInv] = useState("");
  const [pool, setPool] = useState("");
  const [investor, setInvestor] = useState("");
  const [result, setResult] = useState<RoundResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e: FormEvent) {
    e.preventDefault();
    if (!state.orgId) return;
    setBusy(true);
    setError(null);
    try {
      setResult(
        await api.simulateRound(state.orgId, {
          preMoney: Number(pre),
          investment: Number(inv),
          poolPct: pool ? Number(pool) : undefined,
          investorName: investor || undefined,
        }),
      );
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  const pct = (n: number) => `${num(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const cur = state.data?.baseCurrency ?? "";
  const max = result ? Math.max(1, ...result.rows.flatMap((r) => [r.pctBefore, r.pctAfter])) : 1;

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader title={t("navRounds")} subtitle={t("roundsIntro")} />
      <Status state={state} />
      {state.data && (
        <form onSubmit={run} className="card grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pre">
              {t("roundPre")} ({cur})
            </label>
            <input
              id="pre"
              required
              type="number"
              min={1}
              step="any"
              className="input"
              dir="ltr"
              value={pre}
              onChange={(e) => setPre(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="inv">
              {t("roundInvestment")} ({cur})
            </label>
            <input
              id="inv"
              required
              type="number"
              min={1}
              step="any"
              className="input"
              dir="ltr"
              value={inv}
              onChange={(e) => setInv(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="pool">
              {t("roundPool")} ({t("optionalDefault")})
            </label>
            <input
              id="pool"
              type="number"
              min={0}
              max={50}
              step="any"
              className="input"
              dir="ltr"
              value={pool}
              onChange={(e) => setPool(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">{t("roundPoolHint")}</p>
          </div>
          <div>
            <label className="label" htmlFor="who">
              {t("roundInvestor")} ({t("optionalDefault")})
            </label>
            <input
              id="who"
              maxLength={200}
              className="input"
              value={investor}
              onChange={(e) => setInvestor(e.target.value)}
            />
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2"
            >
              {error}
            </div>
          )}
          <div className="sm:col-span-2">
            <button className="btn" disabled={busy} type="submit">
              {busy ? t("loading") : t("roundRun")}
            </button>
          </div>
        </form>
      )}
      {result && (
        <div className="space-y-4" aria-live="polite">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label={t("roundPrice")} value={`${cur} ${num(result.pricePerShare, { maximumFractionDigits: 4 })}`} />
            <Kpi label={t("roundPost")} value={`${cur} ${num(result.postMoney)}`} />
            <Kpi label={t("roundNewShares")} value={num(result.newInvestorShares)} sub={pct(result.investorPct)} />
            <Kpi label={t("roundNewPool")} value={num(result.newPoolShares)} sub={pct(result.poolPct)} />
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 text-start">{t("shareholder")}</th>
                  <th className="text-end">{t("roundBefore")}</th>
                  <th className="text-end">{t("roundAfter")}</th>
                  <th className="w-40 ps-4 text-start" />
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, i) => {
                  const isNew = r.shareholderId === null;
                  return (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-2">{isNew && r.name === "Option pool (new)" ? t("roundPoolRow") : r.name}</td>
                      <td className="text-end tabular-nums">
                        {num(r.sharesBefore)} <span className="text-xs text-slate-400">({pct(r.pctBefore)})</span>
                      </td>
                      <td className="text-end tabular-nums">
                        {num(r.sharesAfter)} <span className="text-xs text-slate-400">({pct(r.pctAfter)})</span>
                      </td>
                      <td className="ps-4">
                        <div className="h-2 rounded-e-[4px]">
                          <div
                            className="h-full rounded-e-[4px]"
                            style={{
                              width: `${(r.pctAfter / max) * 100}%`,
                              background: isNew ? "rgb(var(--series-2))" : "rgb(var(--series-1))",
                              minWidth: 3,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">{t("roundNote")}</p>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <p className="label !mb-2">{label}</p>
      <p className="text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
