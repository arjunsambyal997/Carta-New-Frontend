"use client";

import { useState, type FormEvent } from "react";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function TransfersPage() {
  const { t, name } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister(async (orgId) => {
    const [holders, classes, resolutions] = await Promise.all([
      api.shareholders(orgId),
      api.shareClasses(orgId),
      api.resolutions(orgId).catch(() => []),
    ]);
    return { holders, classes, resolutions: resolutions.filter((r) => r.status === "PASSED") };
  }, refresh);

  const [mode, setMode] = useState<"transfer" | "buyback">("transfer");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cls, setCls] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [resolution, setResolution] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!state.orgId) return;
    setBusy(true);
    setError(null);
    setDone(false);
    const common = {
      fromShareholderId: from,
      shareClassId: cls,
      quantity: Number(qty),
      date: date || undefined,
      resolutionId: resolution || undefined,
      reference: reference || undefined,
    };
    try {
      if (mode === "transfer") {
        await api.transfer(state.orgId, { ...common, toShareholderId: to, pricePerShare: price ? Number(price) : undefined });
      } else {
        await api.buyBack(state.orgId, { ...common, pricePerShare: Number(price) });
      }
      setDone(true);
      setQty("");
      setRefresh((n) => n + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const classes = state.data?.classes.filter((c) => c.classType !== "TREASURY") ?? [];
  const holders = state.data?.holders ?? [];

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1>{t("navTransfers")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("transfersIntro")}</p>
      </div>
      <Status state={state} />
      {state.data && (
        <form onSubmit={submit} className="card space-y-4">
          <div className="flex gap-2" role="tablist">
            {(["transfer", "buyback"] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "btn" : "btn-ghost"} onClick={() => { setMode(m); setDone(false); setError(null); }}>
                {t(m === "transfer" ? "tabTransfer" : "tabBuyBack")}
              </button>
            ))}
          </div>
          <div>
            <label className="label" htmlFor="from">{t("transferFrom")}</label>
            <select id="from" required className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
              <option value="">{t("select")}</option>
              {holders.map((h) => <option key={h.id} value={h.id}>{name(h.fullNameEn, h.fullNameAr)}</option>)}
            </select>
          </div>
          {mode === "transfer" && (
            <div>
              <label className="label" htmlFor="to">{t("transferTo")}</label>
              <select id="to" required className="input" value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="">{t("select")}</option>
                {holders.filter((h) => h.id !== from).map((h) => <option key={h.id} value={h.id}>{name(h.fullNameEn, h.fullNameAr)}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label" htmlFor="cls">{t("classLabel")}</label>
            <select id="cls" required className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="">{t("select")}</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{name(c.name, c.nameAr)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="qty">{t("quantity")}</label>
              <input id="qty" required type="number" min={1} step={1} className="input" dir="ltr" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="price">{t("pricePerShare")}{mode === "transfer" && ` (${t("optionalDefault")})`}</label>
              <input id="price" required={mode === "buyback"} type="number" min={0} step="0.000001" className="input" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="date">{t("dateIssued")} ({t("optionalDefault")})</label>
              <input id="date" type="date" className="input" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="ref">{t("transferReference")}</label>
              <input id="ref" maxLength={200} className="input" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="res">{t("transferResolution")}</label>
            <select id="res" className="input" value={resolution} onChange={(e) => setResolution(e.target.value)}>
              <option value="">{t("transferNoResolution")}</option>
              {state.data.resolutions.map((r) => <option key={r.id} value={r.id}>{name(r.title, r.titleAr)}</option>)}
            </select>
          </div>
          {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          {done && <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{t(mode === "transfer" ? "transferDone" : "buyBackDone")}</div>}
          <button className="btn" disabled={busy} type="submit">{busy ? t("loading") : t(mode === "transfer" ? "transferSubmit" : "buyBackSubmit")}</button>
        </form>
      )}
    </div>
  );
}
