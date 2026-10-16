"use client";

import { useState, type FormEvent } from "react";
import { useFeedback } from "@/components/Feedback";
import { PageHeader } from "@/components/PageHeader";
import { Status } from "@/components/Status";
import { useRegister } from "@/components/useRegister";
import { api, isPendingChange } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { VestingStatus } from "@/lib/types";

export default function OptionsPage() {
  const { t, num, name } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister(async (orgId) => {
    const [schedules, certs, classes] = await Promise.all([api.vesting(orgId), api.certificates(orgId), api.shareClasses(orgId)]);
    const scheduled = new Set(schedules.map((s) => s.certificateNo));
    const open = certs.filter((c) => c.instrumentType === "OPTION" && c.status === "ISSUED" && !scheduled.has(c.certificateNo));
    return { schedules, open, classes };
  }, refresh);
  const reload = () => setRefresh((n) => n + 1);

  return (
    <div className="space-y-5">
      <PageHeader title={t("navOptions")} subtitle={t("optionsIntro")} />
      <Status state={state} />
      {state.data && state.orgId && (
        <>
          {state.data.schedules.length === 0 && state.data.open.length === 0 && <p className="card text-slate-500">{t("optionsNone")}</p>}
          <div className="grid gap-4 lg:grid-cols-2">
            {state.data.schedules.map((s) => (
              <Grant key={s.id} s={s} orgId={state.orgId!} classes={state.data!.classes} onDone={reload} />
            ))}
          </div>
          {state.data.open.length > 0 && (
            <section className="card space-y-3">
              <h2 className="text-sm font-semibold">{t("optionsUnscheduled")}</h2>
              {state.data.open.map((c) => (
                <ScheduleForm key={c.id} orgId={state.orgId!} certNo={c.certificateNo} label={`${c.certificateNo} · ${name(c.shareholderNameEn, c.shareholderNameAr)} · ${num(c.quantity)}`} date={c.dateIssued} onDone={reload} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Grant({ s, orgId, classes, onDone }: { s: VestingStatus; orgId: string; classes: { id: string; name: string; nameAr: string | null; classType: string }[]; onDone: () => void }) {
  const { t, num, name } = useI18n();
  const { confirm, toast } = useFeedback();
  const [qty, setQty] = useState("");
  const [cls, setCls] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const w = (n: number) => `${(n / s.granted) * 100}%`;

  async function exercise(e: FormEvent) {
    e.preventDefault();
    const into = classes.find((c) => c.id === cls);
    const ok = await confirm({
      message: t("confirmExerciseTitle"),
      detail: `${num(Number(qty))} × ${into ? name(into.name, into.nameAr) : s.shareClassName} → ${name(s.holderNameEn, s.holderNameAr)} · ${t("optionsStrike")} ${s.currency} ${num(s.strikePrice, { maximumFractionDigits: 4 })}

${t("confirmExerciseDetail")}`,
      confirmLabel: t("optionsExercise"),
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.exerciseOptions(orgId, s.certificateNo, { quantity: Number(qty), shareClassId: cls || undefined });
      toast(isPendingChange(res) ? t("toastSentForApproval") : t("optionsExerciseDone"));
      setQty("");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card min-w-0 space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{name(s.holderNameEn, s.holderNameAr)}</h2>
          <p className="text-xs text-slate-500"><span dir="ltr" className="font-mono">{s.certificateNo}</span> · {s.shareClassName} · {t("optionsStrike")} {s.currency} {num(s.strikePrice, { maximumFractionDigits: 4 })}</p>
        </div>
        <p className="shrink-0 text-end text-lg font-semibold tabular-nums">{num(s.granted)}</p>
      </header>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${t("optionsVested")} ${num(s.vested)} / ${num(s.granted)}`}>
        <div style={{ width: w(s.exercised), background: "rgb(var(--series-3))" }} />
        <div style={{ width: w(s.exercisable), background: "rgb(var(--series-1))" }} />
      </div>
      <dl className="grid grid-cols-3 gap-2 text-xs">
        <Stat k={t("optionsExercised")} v={num(s.exercised)} />
        <Stat k={t("optionsExercisable")} v={num(s.exercisable)} />
        <Stat k={t("optionsUnvested")} v={num(s.unvested)} />
      </dl>
      <p className="text-xs text-slate-500">
        {t("optionsSchedule")}: {s.startDate} · {s.cliffMonths} / {s.vestingMonths} {t("optionsMonths")}
        {s.nextVestDate && ` · ${t("optionsNext")} ${s.nextVestDate}`}
      </p>
      {s.exercisable > 0 && (
        <form onSubmit={exercise} className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3">
          <div className="w-28">
            <label className="label" htmlFor={`q-${s.id}`}>{t("quantity")}</label>
            <input id={`q-${s.id}`} required type="number" min={1} max={s.exercisable} step={1} className="input" dir="ltr" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="min-w-32 flex-1">
            <label className="label" htmlFor={`c-${s.id}`}>{t("optionsInto")}</label>
            <select id={`c-${s.id}`} className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="">{s.shareClassName}</option>
              {classes.filter((c) => c.classType !== "TREASURY").map((c) => <option key={c.id} value={c.id}>{name(c.name, c.nameAr)}</option>)}
            </select>
          </div>
          <button className="btn" disabled={busy} type="submit">{busy ? t("loading") : t("optionsExercise")}</button>
        </form>
      )}
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">{error}</div>}
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium tabular-nums">{v}</dd>
    </div>
  );
}

function ScheduleForm({ orgId, certNo, label, date, onDone }: { orgId: string; certNo: string; label: string; date: string; onDone: () => void }) {
  const { t } = useI18n();
  const { confirm, toast } = useFeedback();
  const [start, setStart] = useState(date);
  const [cliff, setCliff] = useState("12");
  const [months, setMonths] = useState("48");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    const ok = await confirm({
      message: t("confirmScheduleTitle"),
      detail: `${label}
${t("optionsStart")} ${start} · ${t("optionsCliff")} ${cliff} · ${t("optionsTotalMonths")} ${months}

${t("confirmScheduleDetail")}`,
      confirmLabel: t("optionsSetSchedule"),
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await api.setVesting(orgId, certNo, { startDate: start, cliffMonths: Number(cliff), vestingMonths: Number(months) });
      toast(t("toastScheduled"));
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-2 rounded-lg border border-slate-200 p-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="label" htmlFor={`s-${certNo}`}>{t("optionsStart")}</label>
          <input id={`s-${certNo}`} required type="date" className="input" dir="ltr" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="w-24">
          <label className="label" htmlFor={`cl-${certNo}`}>{t("optionsCliff")}</label>
          <input id={`cl-${certNo}`} required type="number" min={0} max={120} className="input" dir="ltr" value={cliff} onChange={(e) => setCliff(e.target.value)} />
        </div>
        <div className="w-28">
          <label className="label" htmlFor={`m-${certNo}`}>{t("optionsTotalMonths")}</label>
          <input id={`m-${certNo}`} required type="number" min={1} max={120} className="input" dir="ltr" value={months} onChange={(e) => setMonths(e.target.value)} />
        </div>
        <button className="btn" disabled={busy} type="submit">{busy ? t("loading") : t("optionsSetSchedule")}</button>
      </div>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">{error}</div>}
    </form>
  );
}
