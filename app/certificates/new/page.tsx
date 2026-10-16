"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState, type FormEvent } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { useFeedback } from "@/components/Feedback";
import { PageHeader } from "@/components/PageHeader";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api, isPendingChange } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Certificate, Currency, InstrumentType } from "@/lib/types";

const INSTRUMENTS: InstrumentType[] = ["SHARES", "OPTION", "WARRANT", "CONVERTIBLE"];
const CURRENCIES: Currency[] = ["AED", "SAR", "USD", "QAR", "BHD", "KWD", "OMR"];

export default function IssueCertificatePage() {
  const { t, num, name } = useI18n();
  const state = useRegister(async (orgId) => {
    const [holders, classes] = await Promise.all([api.shareholders(orgId), api.shareClasses(orgId)]);
    return { holders, classes };
  });

  const [holderId, setHolderId] = useState("");
  const [classId, setClassId] = useState("");
  const [instrument, setInstrument] = useState<InstrumentType>("SHARES");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency | "">("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<Certificate | null>(null);

  const selectedClass = state.data?.classes.find((c) => c.id === classId);
  const { confirm, toast } = useFeedback();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!state.orgId) return;
    const holder = state.data?.holders.find((h) => h.id === holderId);
    const cur = currency || selectedClass?.currency || "";
    const ok = await confirm({
      message: t("confirmIssueTitle"),
      detail: `${num(Number(quantity))} × ${selectedClass ? name(selectedClass.name, selectedClass.nameAr) : ""} → ${holder ? name(holder.fullNameEn, holder.fullNameAr) : ""}
${t("consideration")}: ${cur} ${num(Number(quantity) * Number(price), { maximumFractionDigits: 2 })}

${t("confirmIssueDetail")}`,
      confirmLabel: t("issue"),
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const cert = await api.issueCertificate(state.orgId, {
        shareholderId: holderId,
        shareClassId: classId,
        instrumentType: instrument,
        quantity: Number(quantity),
        pricePerShare: Number(price),
        currency: currency || undefined,
        dateIssued: date || undefined,
      });
      if (isPendingChange(cert)) {
        toast(t("toastSentForApproval"));
        setQuantity("");
      } else {
        setIssued(cert);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (issued) {
    const verifyUrl = `${window.location.origin}/verify/${issued.certificateNo}?h=${issued.recordHash}`;
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold text-emerald-800">{t("issued")}</h1>
        <div className="card flex flex-wrap items-start gap-6">
          <dl className="min-w-[200px] flex-1 space-y-2 text-sm">
            <Row k={t("certNo")} v={issued.certificateNo} mono />
            <Row k={t("shareholder")} v={name(issued.shareholderNameEn, issued.shareholderNameAr)} />
            <Row k={t("className")} v={issued.shareClassName} />
            <Row k={t("quantity")} v={num(issued.quantity)} />
            <Row k={t("pricePerShare")} v={`${issued.currency} ${num(issued.pricePerShare)}`} />
            <Row k={t("consideration")} v={`${issued.currency} ${num(issued.totalConsideration)}`} />
            <Row k={t("dateIssued")} v={issued.dateIssued} />
          </dl>
          <div className="text-center">
            <QRCodeSVG value={verifyUrl} size={132} />
            <p className="mt-2 text-xs text-slate-500">{t("verifyQr")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <DownloadButton className="btn" label={t("downloadPdf")} run={() => api.certificatePdf(state.orgId!, issued.certificateNo)} />
          <button className="btn-ghost" onClick={() => { setIssued(null); setQuantity(""); }}>
            {t("issueAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title={t("navIssue")} />
      <Status state={state} />
      {state.data && (
        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="holder">{t("shareholderLabel")}</label>
            <select id="holder" required className="input" value={holderId} onChange={(e) => setHolderId(e.target.value)}>
              <option value="">{t("select")}</option>
              {state.data.holders.map((h) => (
                <option key={h.id} value={h.id}>{name(h.fullNameEn, h.fullNameAr)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cls">{t("classLabel")}</label>
            <select id="cls" required className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">{t("select")}</option>
              {state.data.classes.filter((c) => c.classType !== "TREASURY").map((c) => (
                <option key={c.id} value={c.id}>{name(c.name, c.nameAr)}</option>
              ))}
            </select>
            {selectedClass && (
              <p className="mt-1 text-xs text-slate-500">
                {t("parValueHint")}: {selectedClass.currency} {num(selectedClass.parValue)}
                {selectedClass.authorizedShares != null && ` · ${t("authorized")}: ${num(selectedClass.authorizedShares)}`}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="qty">{t("quantity")}</label>
              <input id="qty" required type="number" min={1} step={1} className="input" dir="ltr" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="price">{t("pricePerShare")}</label>
              <input id="price" required type="number" min={0} step="0.000001" className="input" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="instr">{t("instrument")}</label>
              <select id="instr" className="input" value={instrument} onChange={(e) => setInstrument(e.target.value as InstrumentType)}>
                {INSTRUMENTS.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="cur">{t("currency")} ({t("optionalDefault")})</label>
              <select id="cur" className="input" value={currency} onChange={(e) => setCurrency(e.target.value as Currency | "")}>
                <option value="">{selectedClass?.currency ?? "—"}</option>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="date">{t("dateIssued")} ({t("optionalDefault")})</label>
              <input id="date" type="date" className="input" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {error && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}
          <button className="btn" disabled={busy} type="submit">{busy ? t("issuing") : t("issue")}</button>
        </form>
      )}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`font-medium ${mono ? "font-mono" : ""}`}>{v}</dd>
    </div>
  );
}
