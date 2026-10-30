"use client";

import { useState, type FormEvent } from "react";
import { useFeedback } from "@/components/common/Feedback";
import { FieldError } from "@/components/common/FieldError";
import { FieldHint, FormSummary } from "@/components/common/FormSummary";
import { HelpPanel } from "@/components/common/HelpPanel";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api, isPendingChange } from "@/api";
import { useI18n } from "@/context/I18nContext";
import { fill } from "@/features/certificates/issueRules";
import { heldShares, validateMove, type MoveFields } from "@/features/transfers/transferRules";

const FIELD_ID: Record<keyof MoveFields, string> = {
  mode: "from",
  from: "from",
  to: "to",
  cls: "cls",
  qty: "qty",
  price: "price",
};

export default function TransfersPage() {
  const { t, name, num } = useI18n();
  const { confirm, toast } = useFeedback();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister(async (orgId) => {
    const [holders, classes, resolutions, certificates] = await Promise.all([
      api.shareholders(orgId),
      api.shareClasses(orgId),
      api.resolutions(orgId).catch(() => []),
      api.certificates(orgId).catch(() => null),
    ]);
    return { holders, classes, certificates, resolutions: resolutions.filter((r) => r.status === "PASSED") };
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
  const [tried, setTried] = useState(false);

  const classes = state.data?.classes.filter((c) => c.classType !== "TREASURY") ?? [];
  const holders = state.data?.holders ?? [];
  const certs = state.data?.certificates;
  // Older servers leave the ids off certificates; then the server alone checks the holding.
  const knowsHoldings = !!certs && certs.every((c) => c.shareholderId && c.shareClassId);
  const held = knowsHoldings && from && cls ? heldShares(certs, from, cls) : null;
  const fields: MoveFields = { mode, from, to, cls, qty, price };
  const errors = validateMove(fields, held);
  const shown = (k: keyof MoveFields) => (tried || fields[k] !== "" ? errors[k] : undefined);
  const holderName = (id: string) => {
    const h = holders.find((x) => x.id === id);
    return h ? name(h.fullNameEn, h.fullNameAr) : "";
  };
  const chosenClass = classes.find((x) => x.id === cls);
  const ready = Object.keys(errors).length === 0 && !!chosenClass;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!state.orgId) return;
    setTried(true);
    const first = (Object.keys(FIELD_ID) as (keyof MoveFields)[]).find((k) => errors[k]);
    if (first) {
      document.getElementById(FIELD_ID[first])?.focus();
      return;
    }
    const ok = await confirm({
      message: t(mode === "transfer" ? "confirmTransferTitle" : "confirmBuyBackTitle"),
      detail: `${num(Number(qty))} × ${chosenClass ? name(chosenClass.name, chosenClass.nameAr) : ""}: ${holderName(from)} → ${mode === "transfer" ? holderName(to) : t("tabBuyBack")}${price ? ` · ${t("pricePerShare")} ${price}` : ""}

${t("confirmMoveDetail")}`,
      confirmLabel: t(mode === "transfer" ? "transferSubmit" : "buyBackSubmit"),
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    const common = {
      fromShareholderId: from,
      shareClassId: cls,
      quantity: Number(qty),
      date: date || undefined,
      resolutionId: resolution || undefined,
      reference: reference || undefined,
    };
    try {
      const res =
        mode === "transfer"
          ? await api.transfer(state.orgId, {
              ...common,
              toShareholderId: to,
              pricePerShare: price ? Number(price) : undefined,
            })
          : await api.buyBack(state.orgId, { ...common, pricePerShare: Number(price) });
      toast(isPendingChange(res) ? t("toastSentForApproval") : t(mode === "transfer" ? "transferDone" : "buyBackDone"));
      setQty("");
      setTried(false);
      setRefresh((n) => n + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("navTransfers")} subtitle={t("transfersIntro")} />
      <Status state={state} shape="form" />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {state.data && (
          <form noValidate onSubmit={submit} className="card grid max-w-5xl gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            <div className="col-span-full flex gap-2" role="tablist">
              {(["transfer", "buyback"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  className={mode === m ? "btn" : "btn-ghost"}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setTried(false);
                  }}
                >
                  {t(m === "transfer" ? "tabTransfer" : "tabBuyBack")}
                </button>
              ))}
            </div>
            <div>
              <label className="label" htmlFor="from">
                {t("transferFrom")}
              </label>
              <select
                id="from"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-invalid={!!shown("from")}
                aria-describedby="e-from"
              >
                <option value="">{t("select")}</option>
                {holders.map((h) => (
                  <option key={h.id} value={h.id}>
                    {name(h.fullNameEn, h.fullNameAr)}
                  </option>
                ))}
              </select>
              <FieldError id="e-from">{shown("from") && t(shown("from")!)}</FieldError>
            </div>
            {mode === "transfer" && (
              <div>
                <label className="label" htmlFor="to">
                  {t("transferTo")}
                </label>
                <select
                  id="to"
                  className="input"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  aria-invalid={!!shown("to")}
                  aria-describedby="e-to"
                >
                  <option value="">{t("select")}</option>
                  {holders
                    .filter((h) => h.id !== from)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {name(h.fullNameEn, h.fullNameAr)}
                      </option>
                    ))}
                </select>
                {shown("to") ? (
                  <FieldError id="e-to">{t(shown("to")!)}</FieldError>
                ) : (
                  <FieldHint id="e-to">{holders.length < 2 && t("moveNeedTwo")}</FieldHint>
                )}
              </div>
            )}
            <div>
              <label className="label" htmlFor="cls">
                {t("classLabel")}
              </label>
              <select
                id="cls"
                className="input"
                value={cls}
                onChange={(e) => setCls(e.target.value)}
                aria-invalid={!!shown("cls")}
                aria-describedby="e-cls"
              >
                <option value="">{t("select")}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {name(c.name, c.nameAr)}
                    {knowsHoldings && from && ` · ${num(heldShares(certs, from, c.id))} ${t("moveHeldShort")}`}
                  </option>
                ))}
              </select>
              <FieldError id="e-cls">{shown("cls") && t(shown("cls")!)}</FieldError>
            </div>
            <div className="contents">
              <div>
                <label className="label" htmlFor="qty">
                  {t("quantity")}
                </label>
                <input
                  id="qty"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={held ?? undefined}
                  step={1}
                  className="input"
                  dir="ltr"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  aria-invalid={!!shown("qty")}
                  aria-describedby="e-qty h-qty"
                />
                <FieldError id="e-qty">{shown("qty") && t(shown("qty")!)}</FieldError>
                {held != null && (
                  <p id="h-qty" className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    {fill(t("moveHeldHint"), { n: num(held) })}
                    {held > 0 && (
                      <button
                        type="button"
                        className="font-medium text-emerald-700 underline-offset-2 hover:underline"
                        onClick={() => setQty(String(held))}
                      >
                        {t("moveUseAll")}
                      </button>
                    )}
                  </p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="price">
                  {t("pricePerShare")}
                  {mode === "transfer" && ` (${t("optionalDefault")})`}
                </label>
                <input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.000001"
                  className="input"
                  dir="ltr"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-invalid={!!shown("price")}
                  aria-describedby="e-price"
                />
                <FieldError id="e-price">{shown("price") && t(shown("price")!)}</FieldError>
              </div>
              <div>
                <label className="label" htmlFor="date">
                  {t("dateIssued")} ({t("optionalDefault")})
                </label>
                <input
                  id="date"
                  type="date"
                  className="input"
                  dir="ltr"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="ref">
                  {t("transferReference")}
                </label>
                <input
                  id="ref"
                  maxLength={200}
                  className="input"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="res">
                {t("transferResolution")}
              </label>
              <select id="res" className="input" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                <option value="">{t("transferNoResolution")}</option>
                {state.data.resolutions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {name(r.title, r.titleAr)}
                  </option>
                ))}
              </select>
            </div>
            <FormSummary title={t("summaryHeading")}>
              {ready &&
                fill(t(mode === "transfer" ? "moveSummaryTransfer" : "moveSummaryBuyBack"), {
                  qty: num(Number(qty)),
                  cls: name(chosenClass.name, chosenClass.nameAr),
                  from: holderName(from),
                  to: holderName(to),
                  price: `${chosenClass.currency} ${num(Number(price))}`,
                })}
            </FormSummary>
            {(error || (tried && !ready)) && (
              <div
                role="alert"
                className="col-span-full rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {error ?? t("fixFields")}
              </div>
            )}
            <button className="btn col-span-full justify-self-start" disabled={busy} type="submit">
              {busy ? t("loading") : t(mode === "transfer" ? "transferSubmit" : "buyBackSubmit")}
            </button>
          </form>
        )}
        <HelpPanel
          title={t("transfersHelpTitle")}
          items={[
            t("transfersHelp1"),
            t("transfersHelp2"),
            t("transfersHelp3"),
            t("transfersHelp4"),
            t("transfersHelp5"),
          ]}
        />
      </div>
    </div>
  );
}
