"use client";

import Link from "next/link";
import { useState } from "react";
import { useFeedback } from "@/components/common/Feedback";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";
import type { Certificate, Conversion, SuccessionRule, SuccessionTrigger } from "@/api/types";

const TRIGGERS: SuccessionTrigger[] = [
  "FOUNDER_DEATH",
  "FOUNDER_INCAPACITY",
  "FOUNDER_EXIT",
  "TRANSFER_TO_HEIR",
  "IPO",
  "CUSTOM",
];

export default function SuccessionPage() {
  const { t, name } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister(async (o) => {
    const [rules, classes, holders, resolutions] = await Promise.all([
      api.successionRules(o),
      api.shareClasses(o),
      api.shareholders(o),
      api.resolutions(o).catch(() => []),
    ]);
    return { rules, classes, holders, passed: resolutions.filter((r) => r.status === "PASSED") };
  }, refresh);

  return (
    <div className="space-y-6">
      <PageHeader title={t("succTitle")} subtitle={t("succIntro")} />
      <Status state={state} />
      {state.data && state.orgId && (
        <>
          <RuleForm
            orgId={state.orgId}
            classes={state.data.classes}
            holders={state.data.holders}
            onDone={() => setRefresh((n) => n + 1)}
          />
          <div className="space-y-3">
            {state.data.rules.length === 0 && <p className="text-slate-500">{t("succEmpty")}</p>}
            {state.data.rules.map((r) => (
              <RuleCard
                key={r.id}
                orgId={state.orgId!}
                rule={r}
                passed={state.data!.passed}
                onChanged={() => setRefresh((n) => n + 1)}
                name={name}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RuleForm({
  orgId,
  classes,
  holders,
  onDone,
}: {
  orgId: string;
  classes: { id: string; name: string; nameAr: string | null }[];
  holders: { id: string; fullNameEn: string; fullNameAr: string | null }[];
  onDone: () => void;
}) {
  const { t, name } = useI18n();
  const [f, setF] = useState({
    name: "",
    trigger: "FOUNDER_DEATH" as SuccessionTrigger,
    subjectId: "",
    fromClassId: "",
    toClassId: "",
    num: "1",
    den: "1",
    beneficiaryId: "",
    legalReference: "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createSuccessionRule(orgId, {
        name: f.name,
        trigger: f.trigger,
        subjectId: f.subjectId || undefined,
        fromClassId: f.fromClassId,
        toClassId: f.toClassId,
        ratioNumerator: Number(f.num),
        ratioDenominator: Number(f.den),
        beneficiaryId: f.beneficiaryId || undefined,
        legalReference: f.legalReference,
      });
      setF({ ...f, name: "", legalReference: "" });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const holderOptions = holders.map((h) => (
    <option key={h.id} value={h.id}>
      {name(h.fullNameEn, h.fullNameAr)}
    </option>
  ));
  const classOptions = classes.map((c) => (
    <option key={c.id} value={c.id}>
      {name(c.name, c.nameAr)}
    </option>
  ));
  return (
    <form className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
      <h2 className="font-medium sm:col-span-2 lg:col-span-3">{t("succNew")}</h2>
      <div>
        <label className="label" htmlFor="sn">
          {t("succName")}
        </label>
        <input id="sn" className="input" required maxLength={200} value={f.name} onChange={set("name")} />
      </div>
      <div>
        <label className="label" htmlFor="st">
          {t("succTrigger")}
        </label>
        <select id="st" className="input" value={f.trigger} onChange={set("trigger")}>
          {TRIGGERS.map((x) => (
            <option key={x} value={x}>
              {t(`trig${x}` as never)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="ss">
          {t("succSubject")}
        </label>
        <select id="ss" className="input" value={f.subjectId} onChange={set("subjectId")}>
          <option value="">{t("succAllHolders")}</option>
          {holderOptions}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="sf">
          {t("succFrom")}
        </label>
        <select id="sf" className="input" required value={f.fromClassId} onChange={set("fromClassId")}>
          <option value="">{t("select")}</option>
          {classOptions}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="sto">
          {t("succTo")}
        </label>
        <select id="sto" className="input" required value={f.toClassId} onChange={set("toClassId")}>
          <option value="">{t("select")}</option>
          {classOptions}
        </select>
      </div>
      <div>
        <label className="label">{t("succRatio")}</label>
        <div className="flex items-center gap-2" dir="ltr">
          <input
            aria-label={t("succRatioNew")}
            className="input"
            type="number"
            min="1"
            required
            value={f.num}
            onChange={set("num")}
          />
          <span>:</span>
          <input
            aria-label={t("succRatioOld")}
            className="input"
            type="number"
            min="1"
            required
            value={f.den}
            onChange={set("den")}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">{t("succRatioHint")}</p>
      </div>
      <div>
        <label className="label" htmlFor="sb">
          {t("succBeneficiary")}
        </label>
        <select id="sb" className="input" value={f.beneficiaryId} onChange={set("beneficiaryId")}>
          <option value="">{t("succKeepHolder")}</option>
          {holderOptions}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="sl">
          {t("succLegal")}
        </label>
        <input
          id="sl"
          className="input"
          required
          maxLength={500}
          value={f.legalReference}
          onChange={set("legalReference")}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2 lg:col-span-3">
          {error}
        </p>
      )}
      <button className="btn sm:col-span-2 lg:col-span-3">{t("create")}</button>
    </form>
  );
}

function RuleCard({
  orgId,
  rule,
  passed,
  onChanged,
  name,
}: {
  orgId: string;
  rule: SuccessionRule;
  passed: { id: string; title: string }[];
  onChanged: () => void;
  name: (en: string, ar?: string | null) => string;
}) {
  const { t, num } = useI18n();
  const [plan, setPlan] = useState<Conversion[] | null>(null);
  const [resolutionId, setResolutionId] = useState("");
  const [created, setCreated] = useState<Certificate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { confirm, toast } = useFeedback();

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const badge =
    rule.status === "EXECUTED"
      ? "bg-emerald-100 text-emerald-800"
      : rule.status === "CANCELLED"
        ? "bg-slate-100 text-slate-600"
        : "bg-amber-100 text-amber-800";
  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{rule.name}</h3>
          <p className="text-sm text-slate-600">
            {t(`trig${rule.trigger}` as never)}: {name(rule.fromClass.nameEn, rule.fromClass.nameAr)} →{" "}
            {name(rule.toClass.nameEn, rule.toClass.nameAr)}{" "}
            <span dir="ltr">
              ({rule.ratioNumerator}:{rule.ratioDenominator})
            </span>
          </p>
          <p className="text-xs text-slate-500">
            {rule.subject ? name(rule.subject.nameEn, rule.subject.nameAr) : t("succAllHolders")}
            {rule.beneficiary ? ` → ${name(rule.beneficiary.nameEn, rule.beneficiary.nameAr)}` : ""} ·{" "}
            {rule.legalReference}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
          {t(`succ${rule.status}` as never)}
        </span>
      </div>

      {rule.status === "DRAFT" && (
        <div className="flex flex-wrap items-end gap-2">
          <button
            className="btn-ghost"
            disabled={busy}
            onClick={() => run(async () => setPlan(await api.previewSuccession(orgId, rule.id)))}
          >
            {t("succPreview")}
          </button>
          <div>
            <label className="label" htmlFor={`res-${rule.id}`}>
              {t("succResolution")}
            </label>
            <select
              id={`res-${rule.id}`}
              className="input"
              value={resolutionId}
              onChange={(e) => setResolutionId(e.target.value)}
            >
              <option value="">{t("none")}</option>
              {passed.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn"
            disabled={busy || !plan || plan.length === 0 || plan.some((c) => c.problem)}
            onClick={async () => {
              if (await confirm({ message: t("succConfirm"), confirmLabel: t("succExecute"), danger: true }))
                run(async () => {
                  setCreated(await api.executeSuccession(orgId, rule.id, resolutionId || undefined));
                  setPlan(null);
                  onChanged();
                });
            }}
          >
            {t("succExecute")}
          </button>
          <button
            className="btn-ghost"
            disabled={busy}
            onClick={async () => {
              if (await confirm({ message: t("confirmSuccCancel"), confirmLabel: t("succCancel"), danger: true }))
                run(async () => {
                  await api.cancelSuccession(orgId, rule.id);
                  toast(t("toastCancelled"));
                  onChanged();
                });
            }}
          >
            {t("succCancel")}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {plan && (
        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                <th className="p-2 text-start">{t("certNo")}</th>
                <th className="text-start">{t("succFromHolder")}</th>
                <th className="text-end">{t("quantity")}</th>
                <th className="ps-4 text-start">{t("succToHolder")}</th>
                <th className="text-end">{t("succNewQty")}</th>
                <th className="text-end">{t("pricePerShare")}</th>
              </tr>
            </thead>
            <tbody>
              {plan.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-2 text-slate-500">
                    {t("succNothing")}
                  </td>
                </tr>
              )}
              {plan.map((c) => (
                <tr key={c.issuanceId} className="border-t border-slate-100">
                  <td className="p-2 font-mono" dir="ltr">
                    {c.certificateNo}
                  </td>
                  <td>{name(c.holderNameEn, c.holderNameAr)}</td>
                  <td className="text-end tabular-nums">{num(c.fromQuantity)}</td>
                  <td className="ps-4">{name(c.toHolderNameEn, c.toHolderNameAr)}</td>
                  <td className="text-end tabular-nums">{num(c.toQuantity)}</td>
                  <td className="text-end tabular-nums">{num(c.toPricePerShare)}</td>
                  {c.problem && <td className="text-xs text-red-700">{c.problem}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {created && (
        <div className="rounded bg-emerald-50 p-3 text-sm text-emerald-900">
          {t("succDone")}: {created.map((c) => c.certificateNo).join(", ")}.{" "}
          <Link href="/certificates" className="underline">
            {t("navCertificates")}
          </Link>
        </div>
      )}
      {rule.status === "EXECUTED" && rule.executedAt && (
        <p className="text-xs text-slate-500">
          {t("succExecutedBy")} {rule.executedBy} · {rule.executedAt.slice(0, 10)}
        </p>
      )}
    </div>
  );
}
