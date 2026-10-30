"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n, type Key } from "@/context/I18nContext";
import type { RoundInput, RoundResult } from "@/api/types";

interface Conv {
  id: number;
  kind: "SAFE" | "NOTE";
  name: string;
  amount: string;
  cap: string;
  discount: string;
  interest: string;
  months: string;
}

interface Hire {
  id: number;
  role: string;
  count: string;
  pct: string;
}

interface Scenario {
  id: number;
  n: number;
  input: RoundInput;
  result: RoundResult;
}

const MAX_SCENARIOS = 4;
const POOL_ROW = "Option pool (new)";

export default function RoundsPage() {
  const { t, num } = useI18n();
  const state = useRegister((orgId) => api.organization(orgId));
  const [pre, setPre] = useState("");
  const [inv, setInv] = useState("");
  const [pool, setPool] = useState("");
  const [investor, setInvestor] = useState("");
  const [convs, setConvs] = useState<Conv[]>([]);
  const [hires, setHires] = useState<Hire[]>([]);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [lastInput, setLastInput] = useState<RoundInput | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [nextId, setNextId] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newId = () => {
    setNextId((n) => n + 1);
    return nextId;
  };
  const setConv = (id: number, patch: Partial<Conv>) =>
    setConvs((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const setHire = (id: number, patch: Partial<Hire>) =>
    setHires((l) => l.map((h) => (h.id === id ? { ...h, ...patch } : h)));

  async function run(e: FormEvent) {
    e.preventDefault();
    if (!state.orgId) return;
    setBusy(true);
    setError(null);
    const input: RoundInput = {
      preMoney: Number(pre),
      investment: Number(inv),
      poolPct: pool ? Number(pool) : undefined,
      investorName: investor || undefined,
      convertibles: convs.length
        ? convs.map((c) => ({
            kind: c.kind,
            name: c.name || undefined,
            amount: Number(c.amount),
            capValuation: c.cap ? Number(c.cap) : undefined,
            discountPct: c.discount ? Number(c.discount) : undefined,
            interestPct: c.kind === "NOTE" && c.interest ? Number(c.interest) : undefined,
            months: c.kind === "NOTE" && c.months ? Number(c.months) : undefined,
          }))
        : undefined,
    };
    try {
      setResult(await api.simulateRound(state.orgId, input));
      setLastInput(input);
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
  const rowName = (name: string) => (name === POOL_ROW ? t("roundPoolRow") : name);
  const plannerTotal = hires.reduce((sum, h) => sum + (Number(h.count) || 0) * (Number(h.pct) || 0), 0);

  function saveScenario() {
    if (!result || !lastInput || scenarios.length >= MAX_SCENARIOS) return;
    const n = (scenarios.at(-1)?.n ?? 0) + 1;
    setScenarios((l) => [...l, { id: Date.now(), n, input: lastInput, result }]);
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("navRounds")} subtitle={t("roundsIntro")} />
      <Status state={state} shape="form" />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,40rem)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
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

              <fieldset className="space-y-3 sm:col-span-2">
                <legend className="text-sm font-semibold">{t("roundConvertibles")}</legend>
                <p className="text-xs text-slate-500">{t("roundConvertiblesHint")}</p>
                {convs.map((c) => (
                  <div key={c.id} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 p-3">
                    <div>
                      <label className="label" htmlFor={`k-${c.id}`}>
                        {t("roundConvKind")}
                      </label>
                      <select
                        id={`k-${c.id}`}
                        className="input"
                        value={c.kind}
                        onChange={(e) => setConv(c.id, { kind: e.target.value as Conv["kind"] })}
                      >
                        <option value="SAFE">{t("roundKindSAFE")}</option>
                        <option value="NOTE">{t("roundKindNOTE")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor={`n-${c.id}`}>
                        {t("roundConvName")}
                      </label>
                      <input
                        id={`n-${c.id}`}
                        maxLength={100}
                        className="input"
                        value={c.name}
                        onChange={(e) => setConv(c.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`a-${c.id}`}>
                        {t("roundConvAmount")}
                      </label>
                      <input
                        id={`a-${c.id}`}
                        required
                        type="number"
                        min={1}
                        step="any"
                        className="input"
                        dir="ltr"
                        value={c.amount}
                        onChange={(e) => setConv(c.id, { amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`c-${c.id}`}>
                        {t("roundConvCap")}
                      </label>
                      <input
                        id={`c-${c.id}`}
                        type="number"
                        min={1}
                        step="any"
                        className="input"
                        dir="ltr"
                        value={c.cap}
                        onChange={(e) => setConv(c.id, { cap: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`d-${c.id}`}>
                        {t("roundConvDiscount")}
                      </label>
                      <input
                        id={`d-${c.id}`}
                        type="number"
                        min={0}
                        max={99.99}
                        step="any"
                        className="input"
                        dir="ltr"
                        value={c.discount}
                        onChange={(e) => setConv(c.id, { discount: e.target.value })}
                      />
                    </div>
                    {c.kind === "NOTE" && (
                      <>
                        <div>
                          <label className="label" htmlFor={`i-${c.id}`}>
                            {t("roundConvInterest")}
                          </label>
                          <input
                            id={`i-${c.id}`}
                            type="number"
                            min={0}
                            max={100}
                            step="any"
                            className="input"
                            dir="ltr"
                            value={c.interest}
                            onChange={(e) => setConv(c.id, { interest: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label" htmlFor={`m-${c.id}`}>
                            {t("roundConvMonths")}
                          </label>
                          <input
                            id={`m-${c.id}`}
                            type="number"
                            min={0}
                            max={120}
                            step={1}
                            className="input"
                            dir="ltr"
                            value={c.months}
                            onChange={(e) => setConv(c.id, { months: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    <div className="col-span-2 flex items-end justify-end">
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setConvs((l) => l.filter((x) => x.id !== c.id))}
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                ))}
                {convs.length < 20 && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() =>
                      setConvs((l) => [
                        ...l,
                        {
                          id: newId(),
                          kind: "SAFE",
                          name: "",
                          amount: "",
                          cap: "",
                          discount: "",
                          interest: "",
                          months: "",
                        },
                      ])
                    }
                  >
                    + {t("roundAddConvertible")}
                  </button>
                )}
              </fieldset>

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

          {state.data && (
            <details className="card">
              <summary className="cursor-pointer text-sm font-semibold">{t("plannerTitle")}</summary>
              <div className="mt-3 space-y-3">
                <p className="text-sm text-slate-600">{t("plannerHelp")}</p>
                {hires.map((h) => (
                  <div key={h.id} className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="label" htmlFor={`r-${h.id}`}>
                        {t("plannerRole")}
                      </label>
                      <input
                        id={`r-${h.id}`}
                        maxLength={100}
                        className="input"
                        value={h.role}
                        onChange={(e) => setHire(h.id, { role: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`hc-${h.id}`}>
                        {t("plannerCount")}
                      </label>
                      <input
                        id={`hc-${h.id}`}
                        type="number"
                        min={1}
                        step={1}
                        className="input"
                        dir="ltr"
                        value={h.count}
                        onChange={(e) => setHire(h.id, { count: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <label className="label" htmlFor={`hp-${h.id}`}>
                          {t("plannerPct")}
                        </label>
                        <input
                          id={`hp-${h.id}`}
                          type="number"
                          min={0}
                          step="any"
                          className="input"
                          dir="ltr"
                          value={h.pct}
                          onChange={(e) => setHire(h.id, { pct: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setHires((l) => l.filter((x) => x.id !== h.id))}
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setHires((l) => [...l, { id: newId(), role: "", count: "1", pct: "" }])}
                  >
                    + {t("plannerAdd")}
                  </button>
                  {hires.length > 0 && (
                    <>
                      <span className="text-sm">
                        {t("plannerTotal")}: <strong className="tabular-nums">{pct(plannerTotal)}</strong>
                      </span>
                      <button
                        type="button"
                        className="btn"
                        disabled={plannerTotal <= 0 || plannerTotal > 50}
                        onClick={() => setPool(String(Math.round(plannerTotal * 100) / 100))}
                      >
                        {t("plannerUse")}
                      </button>
                      {plannerTotal > 50 && (
                        <span role="alert" className="text-sm text-red-700">
                          {t("plannerTooBig")}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </details>
          )}
        </div>
        <div className="min-w-0 space-y-5">
          {!result && scenarios.length === 0 && state.data && (
            <p className="card text-sm text-slate-500">{t("roundResultsEmpty")}</p>
          )}
          {result && (
            <div className="space-y-4" aria-live="polite">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi
                  label={t("roundPrice")}
                  value={`${cur} ${num(result.pricePerShare, { maximumFractionDigits: 4 })}`}
                />
                <Kpi label={t("roundPost")} value={`${cur} ${num(result.postMoney)}`} />
                <Kpi label={t("roundNewShares")} value={num(result.newInvestorShares)} sub={pct(result.investorPct)} />
                <Kpi label={t("roundNewPool")} value={num(result.newPoolShares)} sub={pct(result.poolPct)} />
              </div>

              {result.conversions && result.conversions.length > 0 && (
                <div className="card overflow-x-auto">
                  <h2 className="mb-2 text-sm font-semibold">{t("roundConversions")}</h2>
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                        <th className="py-2 text-start">{t("roundConvName")}</th>
                        <th className="text-end">{t("roundConvConverted")}</th>
                        <th className="text-end">{t("roundConvPrice")}</th>
                        <th className="text-end">{t("roundNewShares")}</th>
                        <th className="ps-4 text-start">{t("roundConvBasis")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.conversions.map((c, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="py-2">{c.name}</td>
                          <td className="text-end tabular-nums">
                            {cur} {num(c.amountConverted)}
                          </td>
                          <td className="text-end tabular-nums">
                            {cur} {num(c.conversionPrice, { maximumFractionDigits: 4 })}
                          </td>
                          <td className="text-end tabular-nums">{num(c.shares)}</td>
                          <td className="ps-4">{t(`roundBasis${c.basis}` as Key)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

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
                          <td className="py-2">{isNew ? rowName(r.name) : r.name}</td>
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
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={scenarios.length >= MAX_SCENARIOS}
                  onClick={saveScenario}
                >
                  {t("roundSaveScenario")}
                </button>
                {scenarios.length >= MAX_SCENARIOS && (
                  <span className="text-xs text-slate-500">{t("roundScenarioMax")}</span>
                )}
              </div>
              <p className="text-xs text-slate-500">{t("roundNote")}</p>
            </div>
          )}

          {scenarios.length > 0 && (
            <section className="card overflow-x-auto" aria-label={t("roundScenarios")}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">{t("roundScenarios")}</h2>
                <button type="button" className="btn-ghost" onClick={() => setScenarios([])}>
                  {t("roundClearScenarios")}
                </button>
              </div>
              <Comparison
                scenarios={scenarios}
                cur={cur}
                rowName={rowName}
                pct={pct}
                onRemove={(id) => setScenarios((l) => l.filter((s) => s.id !== id))}
              />
              <p className="mt-2 text-xs text-slate-500">{t("roundScenarioNote")}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/** Scenarios side by side: the headline numbers, then everyone's ownership after each one. */
function Comparison({
  scenarios,
  cur,
  rowName,
  pct,
  onRemove,
}: {
  scenarios: Scenario[];
  cur: string;
  rowName: (n: string) => string;
  pct: (n: number) => string;
  onRemove: (id: number) => void;
}) {
  const { t, num } = useI18n();
  const names: { key: string; label: string }[] = [];
  for (const s of scenarios) {
    for (const r of s.result.rows) {
      const key = r.shareholderId ?? r.name;
      if (!names.some((n) => n.key === key)) names.push({ key, label: r.shareholderId ? r.name : rowName(r.name) });
    }
  }
  const after = (s: Scenario, key: string) => s.result.rows.find((r) => (r.shareholderId ?? r.name) === key)?.pctAfter;
  const head = (label: string) => <th className="py-2 pe-3 text-start font-medium text-slate-500">{label}</th>;
  return (
    <table className="w-full min-w-[560px] text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          {head("")}
          {scenarios.map((s) => (
            <th key={s.id} className="px-2 text-end font-medium">
              {t("roundScenario")} {s.n}
              <button
                type="button"
                className="ms-2 text-xs text-slate-400 hover:text-red-600"
                aria-label={t("remove")}
                onClick={() => onRemove(s.id)}
              >
                ×
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {[
          [t("roundPre"), (s: Scenario) => `${cur} ${num(s.result.preMoney)}`],
          [t("roundInvestment"), (s: Scenario) => `${cur} ${num(s.result.investment)}`],
          [t("roundPrice"), (s: Scenario) => `${cur} ${num(s.result.pricePerShare, { maximumFractionDigits: 4 })}`],
          [t("roundNewShares"), (s: Scenario) => `${num(s.result.newInvestorShares)} (${pct(s.result.investorPct)})`],
          [t("roundNewPool"), (s: Scenario) => `${num(s.result.newPoolShares)} (${pct(s.result.poolPct)})`],
          [t("roundConvertedShares"), (s: Scenario) => num(s.result.convertedShares ?? 0)],
        ].map(([label, f]) => (
          <tr key={label as string} className="border-b border-slate-100">
            <td className="py-2 pe-3 text-slate-600">{label as string}</td>
            {scenarios.map((s) => (
              <td key={s.id} className="px-2 text-end">
                {(f as (s: Scenario) => string)(s)}
              </td>
            ))}
          </tr>
        ))}
        <tr>
          <td colSpan={scenarios.length + 1} className="pt-3 text-xs font-semibold uppercase text-slate-500">
            {t("roundOwnershipAfter")}
          </td>
        </tr>
        {names.map((n) => (
          <tr key={n.key} className="border-b border-slate-100 last:border-0">
            <td className="py-2 pe-3">{n.label}</td>
            {scenarios.map((s) => {
              const v = after(s, n.key);
              return (
                <td key={s.id} className="px-2 text-end">
                  {v === undefined ? "–" : pct(v)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
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
