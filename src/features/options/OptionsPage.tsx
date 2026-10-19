"use client";

import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/common/Avatar";
import { useFeedback } from "@/components/common/Feedback";
import { ExerciseDialog } from "@/features/options/ExerciseDialog";
import { VestingBar } from "@/features/options/VestingBar";
import { PageHeader } from "@/components/common/PageHeader";
import { Status } from "@/components/common/Status";
import { useRegister } from "@/hooks/useRegister";
import { api } from "@/api";
import { useI18n } from "@/context/I18nContext";
import type { VestingStatus } from "@/api/types";

export default function OptionsPage() {
  const { t, num, name } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const state = useRegister(async (orgId) => {
    const [schedules, certs, classes] = await Promise.all([
      api.vesting(orgId),
      api.certificates(orgId),
      api.shareClasses(orgId),
    ]);
    const scheduled = new Set(schedules.map((s) => s.certificateNo));
    const open = certs.filter(
      (c) => c.instrumentType === "OPTION" && c.status === "ISSUED" && !scheduled.has(c.certificateNo),
    );
    return { schedules, open, classes };
  }, refresh);
  const reload = () => setRefresh((n) => n + 1);

  return (
    <div className="space-y-5">
      <PageHeader title={t("navOptions")} subtitle={t("optionsIntro")} />
      <Status state={state} />
      {state.data && state.orgId && (
        <>
          {state.data.schedules.length === 0 && state.data.open.length === 0 && (
            <p className="card text-slate-500">{t("optionsNone")}</p>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {state.data.schedules.map((s) => (
              <Grant key={s.id} s={s} orgId={state.orgId!} classes={state.data!.classes} onDone={reload} />
            ))}
          </div>
          {state.data.open.length > 0 && (
            <section className="card space-y-3">
              <h2 className="text-sm font-semibold">{t("optionsUnscheduled")}</h2>
              {state.data.open.map((c) => (
                <ScheduleForm
                  key={c.id}
                  orgId={state.orgId!}
                  certNo={c.certificateNo}
                  label={`${c.certificateNo} · ${name(c.shareholderNameEn, c.shareholderNameAr)} · ${num(c.quantity)}`}
                  date={c.dateIssued}
                  onDone={reload}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
  small,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
  small?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
      <dt className="truncate text-xs text-slate-500">{label}</dt>
      <dd
        className={`mt-0.5 font-semibold tabular-nums ${small ? "pt-1 text-sm leading-6" : "text-lg"} ${tone ?? "text-slate-900"}`}
      >
        {value}
      </dd>
      {hint && <p className="truncate text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

/** What the grant is, never an input: the numbers and the vesting bar. The one action is the Exercise dialog. */
function Grant({
  s,
  orgId,
  classes,
  onDone,
}: {
  s: VestingStatus;
  orgId: string;
  classes: { id: string; name: string; nameAr: string | null; classType: string }[];
  onDone: () => void;
}) {
  const { t, num, name, date } = useI18n();
  return (
    <section className="card min-w-0 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={s.holderNameEn} size={36} />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{name(s.holderNameEn, s.holderNameAr)}</h2>
            <p className="truncate text-xs text-slate-500">
              <span dir="ltr" className="font-mono">
                {s.certificateNo}
              </span>{" "}
              · {s.shareClassName} · {t("optionsStrike")} {s.currency}{" "}
              {num(s.strikePrice, { maximumFractionDigits: 4 })}
            </p>
          </div>
        </div>
        <ExerciseDialog s={s} orgId={orgId} classes={classes} onDone={onDone} />
      </header>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label={t("optGranted")} value={num(s.granted)} />
        <Metric
          label={t("optVestedLabel")}
          value={num(s.vested)}
          tone="text-emerald-700"
          hint={`${num(s.exercised)} ${t("optionsExercised").toLowerCase()}`}
        />
        <Metric label={t("optUnvestedLabel")} value={num(s.unvested)} />
        <Metric small label={t("optNextVest")} value={s.nextVestDate ? date(s.nextVestDate) : t("optNoNext")} />
      </dl>
      <VestingBar s={s} />
      <p className="text-xs text-slate-500">
        {t("optionsSchedule")}: {t("optStarted")} {date(s.startDate)} · {s.cliffMonths} / {s.vestingMonths}{" "}
        {t("optionsMonths")} · {t("optFullyVested")} {date(s.fullyVestedDate)}
      </p>
    </section>
  );
}

function ScheduleForm({
  orgId,
  certNo,
  label,
  date,
  onDone,
}: {
  orgId: string;
  certNo: string;
  label: string;
  date: string;
  onDone: () => void;
}) {
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
      await api.setVesting(orgId, certNo, {
        startDate: start,
        cliffMonths: Number(cliff),
        vestingMonths: Number(months),
      });
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
          <label className="label" htmlFor={`s-${certNo}`}>
            {t("optionsStart")}
          </label>
          <input
            id={`s-${certNo}`}
            required
            type="date"
            className="input"
            dir="ltr"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="w-24">
          <label className="label" htmlFor={`cl-${certNo}`}>
            {t("optionsCliff")}
          </label>
          <input
            id={`cl-${certNo}`}
            required
            type="number"
            min={0}
            max={120}
            className="input"
            dir="ltr"
            value={cliff}
            onChange={(e) => setCliff(e.target.value)}
          />
        </div>
        <div className="w-28">
          <label className="label" htmlFor={`m-${certNo}`}>
            {t("optionsTotalMonths")}
          </label>
          <input
            id={`m-${certNo}`}
            required
            type="number"
            min={1}
            max={120}
            className="input"
            dir="ltr"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </div>
        <button className="btn" disabled={busy} type="submit">
          {busy ? t("loading") : t("optionsSetSchedule")}
        </button>
      </div>
      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {error}
        </div>
      )}
    </form>
  );
}
