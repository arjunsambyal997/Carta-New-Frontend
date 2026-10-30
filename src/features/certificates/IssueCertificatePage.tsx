"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState, type FormEvent } from "react";
import { DownloadButton } from "@/components/common/DownloadButton";
import { EmptyState } from "@/components/common/EmptyState";
import { FieldError } from "@/components/common/FieldError";
import { FieldHint, FormSummary } from "@/components/common/FormSummary";
import { useFeedback } from "@/components/common/Feedback";
import { HelpPanel } from "@/components/common/HelpPanel";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api, isPendingChange } from "@/api";
import { useI18n } from "@/context/I18nContext";
import { fill, validateIssue, type IssueFields } from "@/features/certificates/issueRules";
import type { Certificate, InstrumentType } from "@/api/types";

const INSTRUMENTS: InstrumentType[] = ["SHARES", "OPTION", "WARRANT", "CONVERTIBLE"];
// Where focus goes when a submit finds this field wrong.
const FIELD_ID: Record<keyof IssueFields, string> = {
  holderId: "holder",
  classId: "cls",
  instrument: "instr",
  quantity: "qty",
  price: "price",
};

export default function IssueCertificatePage() {
  const { t, num, name } = useI18n();
  const state = useRegister(async (orgId) => {
    const [holders, classes, cap] = await Promise.all([
      api.shareholders(orgId),
      api.shareClasses(orgId),
      api.capTable(orgId).catch(() => null),
    ]);
    return { holders, classes, cap };
  });

  const [holderId, setHolderId] = useState("");
  const [classId, setClassId] = useState("");
  const [instrument, setInstrument] = useState<InstrumentType>("SHARES");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<Certificate | null>(null);
  const [tried, setTried] = useState(false);

  const selectedClass = state.data?.classes.find((c) => c.id === classId);
  const holder = state.data?.holders.find((h) => h.id === holderId);
  const { confirm, toast } = useFeedback();

  // Shares already allocated in the class come from the cap table; without it the server still enforces the limit.
  // A class with nothing issued yet is missing from the cap table, so it has used none of its limit.
  const cap = state.data?.cap;
  const allocated = cap ? (cap.classes.find((c) => c.shareClassId === classId)?.fullyDilutedShares ?? 0) : undefined;
  const left =
    selectedClass?.authorizedShares != null && allocated != null
      ? Math.max(0, selectedClass.authorizedShares - allocated)
      : null;
  const fields: IssueFields = { holderId, classId, instrument, quantity, price };
  const errors = validateIssue(fields, selectedClass ? { parValue: selectedClass.parValue, left } : null);
  // Required-field errors wait for a submit; a wrong value shows as soon as it is typed.
  const shown = (k: keyof IssueFields) => (tried || fields[k] !== "" ? errors[k] : undefined);
  const cur = selectedClass?.currency ?? "";
  const ready = Object.keys(errors).length === 0 && holder && selectedClass;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!state.orgId) return;
    setTried(true);
    const first = (Object.keys(FIELD_ID) as (keyof IssueFields)[]).find((k) => errors[k]);
    if (first) {
      document.getElementById(FIELD_ID[first])?.focus();
      return;
    }
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
        dateIssued: date || undefined,
      });
      if (isPendingChange(cert)) {
        toast(t("toastSentForApproval"));
        setQuantity("");
        setTried(false);
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
          <DownloadButton
            className="btn"
            label={t("downloadPdf")}
            run={() => api.certificatePdf(state.orgId!, issued.certificateNo)}
          />
          <button
            className="btn-ghost"
            onClick={() => {
              setIssued(null);
              setQuantity("");
              setTried(false);
            }}
          >
            {t("issueAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("navIssue")} subtitle={t("subIssue")} />
      <Status state={state} shape="form" />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {state.data &&
          (state.data.holders.length === 0 || !state.data.classes.some((c) => c.classType !== "TREASURY") ? (
            <div className="card">
              <EmptyState
                icon="members"
                title={t("issueNeedSetup")}
                action={{ label: t("setupTitle"), href: "/setup" }}
              />
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="card grid max-w-5xl gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              <div>
                <label className="label" htmlFor="holder">
                  {t("shareholderLabel")}
                </label>
                <select
                  id="holder"
                  className="input"
                  value={holderId}
                  onChange={(e) => setHolderId(e.target.value)}
                  aria-invalid={!!shown("holderId")}
                  aria-describedby="e-holder"
                >
                  <option value="">{t("select")}</option>
                  {state.data.holders.map((h) => (
                    <option key={h.id} value={h.id}>
                      {name(h.fullNameEn, h.fullNameAr)}
                    </option>
                  ))}
                </select>
                <FieldError id="e-holder">{shown("holderId") && t(shown("holderId")!)}</FieldError>
              </div>
              <div>
                <label className="label" htmlFor="cls">
                  {t("classLabel")}
                </label>
                <select
                  id="cls"
                  className="input"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  aria-invalid={!!shown("classId")}
                  aria-describedby="e-cls"
                >
                  <option value="">{t("select")}</option>
                  {state.data.classes
                    .filter((c) => c.classType !== "TREASURY")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {name(c.name, c.nameAr)}
                      </option>
                    ))}
                </select>
                {shown("classId") ? (
                  <FieldError id="e-cls">{t(shown("classId")!)}</FieldError>
                ) : (
                  <FieldHint id="e-cls">
                    {selectedClass &&
                      `${t("parValueHint")}: ${selectedClass.currency} ${num(selectedClass.parValue)}${
                        selectedClass.authorizedShares != null
                          ? ` · ${t("authorized")}: ${num(selectedClass.authorizedShares)}`
                          : ""
                      }`}
                  </FieldHint>
                )}
              </div>
              <div>
                <label className="label" htmlFor="qty">
                  {t("quantity")}
                </label>
                <input
                  id="qty"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  className="input"
                  dir="ltr"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  aria-invalid={!!shown("quantity")}
                  aria-describedby="e-qty"
                />
                {shown("quantity") ? (
                  <FieldError id="e-qty">{t(shown("quantity")!)}</FieldError>
                ) : (
                  <FieldHint id="e-qty">
                    {left != null &&
                      selectedClass?.authorizedShares != null &&
                      fill(t("issueLeftHint"), { left: num(left), total: num(selectedClass.authorizedShares) })}
                  </FieldHint>
                )}
              </div>
              <div>
                <label className="label" htmlFor="price">
                  {t("pricePerShare")}
                  {cur && ` (${cur})`}
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
                {shown("price") ? (
                  <FieldError id="e-price">{t(shown("price")!)}</FieldError>
                ) : (
                  <FieldHint id="e-price">
                    {selectedClass &&
                      (instrument === "SHARES"
                        ? fill(t("issueParMin"), { par: num(selectedClass.parValue), cur })
                        : fill(t("issuePaidIn"), { cur }))}
                  </FieldHint>
                )}
              </div>
              <div>
                <label className="label" htmlFor="instr">
                  {t("instrument")}
                </label>
                <select
                  id="instr"
                  className="input"
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value as InstrumentType)}
                >
                  {INSTRUMENTS.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
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
                  aria-describedby="h-date"
                />
                <FieldHint id="h-date">{t("issueDateHint")}</FieldHint>
              </div>
              <FormSummary title={t("summaryHeading")}>
                {ready &&
                  fill(t("issueSummary"), {
                    qty: num(Number(quantity)),
                    cls: name(selectedClass.name, selectedClass.nameAr),
                    holder: name(holder.fullNameEn, holder.fullNameAr),
                    cur,
                    total: num(Number(quantity) * Number(price), { maximumFractionDigits: 2 }),
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
                {busy ? t("issuing") : t("issue")}
              </button>
            </form>
          ))}
        <HelpPanel
          title={t("issueHelpTitle")}
          items={[t("issueHelp1"), t("issueHelp2"), t("issueHelp3"), t("issueHelp4")]}
        />
      </div>
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
