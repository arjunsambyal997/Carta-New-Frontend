"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, isPendingChange } from "@/api";
import { useFeedback } from "@/components/common/Feedback";
import { useI18n } from "@/context/I18nContext";
import type { VestingStatus } from "@/api/types";

interface ClassOption {
  id: string;
  name: string;
  nameAr: string | null;
  classType: string;
}

/** The exercise flow in one focused dialog: how many, into which class, what it costs, then a single deliberate confirm. */
export function ExerciseDialog({
  s,
  orgId,
  classes,
  onDone,
}: {
  s: VestingStatus;
  orgId: string;
  classes: ClassOption[];
  onDone: () => void;
}) {
  const { t, num, name } = useI18n();
  const { toast } = useFeedback();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [cls, setCls] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const n = Number(qty);
  const valid = Number.isInteger(n) && n >= 1 && n <= s.exercisable;
  const money = (v: number) => `${s.currency} ${num(v, { maximumFractionDigits: 2 })}`;
  const into = classes.find((c) => c.id === cls);

  const reset = (o: boolean) => {
    setOpen(o);
    if (o) {
      setQty("");
      setCls("");
      setError(null);
    }
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.exerciseOptions(orgId, s.certificateNo, { quantity: n, shareClassId: cls || undefined });
      toast(isPendingChange(res) ? t("toastSentForApproval") : t("optionsExerciseDone"));
      setOpen(false);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={reset}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="btn"
          disabled={s.exercisable <= 0}
          title={s.exercisable <= 0 ? t("optNothingToExercise") : undefined}
        >
          {t("optExerciseBtn")}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="card fixed start-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto shadow-pop outline-none rtl:translate-x-1/2"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-base font-semibold">{t("optExerciseTitle")}</Dialog.Title>
              <p className="mt-0.5 text-sm text-slate-500">
                {name(s.holderNameEn, s.holderNameAr)} ·{" "}
                <span dir="ltr" className="font-mono">
                  {s.certificateNo}
                </span>
              </p>
            </div>
            <Dialog.Close
              className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label={t("menuClose")}
            >
              <X size={16} aria-hidden />
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <div className="flex items-end justify-between">
                <label className="label" htmlFor={`ex-q-${s.id}`}>
                  {t("quantity")}
                </label>
                <span className="mb-1 text-xs tabular-nums text-slate-500">
                  {num(s.exercisable)} {t("optAvailable")}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  id={`ex-q-${s.id}`}
                  required
                  autoFocus
                  type="number"
                  min={1}
                  max={s.exercisable}
                  step={1}
                  className="input"
                  dir="ltr"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
                <button type="button" className="btn-ghost shrink-0" onClick={() => setQty(String(s.exercisable))}>
                  {t("optMax")}
                </button>
              </div>
            </div>
            <div>
              <label className="label" htmlFor={`ex-c-${s.id}`}>
                {t("optionsInto")}
              </label>
              <select id={`ex-c-${s.id}`} className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
                <option value="">{s.shareClassName}</option>
                {classes
                  .filter((c) => c.classType !== "TREASURY")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {name(c.name, c.nameAr)}
                    </option>
                  ))}
              </select>
            </div>

            <dl className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("optNewShares")}</dt>
                <dd className="font-medium tabular-nums">
                  {valid ? num(n) : "–"} {into ? `· ${name(into.name, into.nameAr)}` : `· ${s.shareClassName}`}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 first-letter:uppercase">{t("optionsStrike")}</dt>
                <dd className="tabular-nums">{money(s.strikePrice)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-1.5">
                <dt className="font-medium">{t("optCost")}</dt>
                <dd className="font-semibold tabular-nums">{valid ? money(n * s.strikePrice) : "–"}</dd>
              </div>
            </dl>
            <p className="text-xs text-slate-500">{t("optIrreversible")}</p>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Dialog.Close className="btn-ghost">{t("cancel")}</Dialog.Close>
              <button type="submit" className="btn" disabled={busy || !valid}>
                {busy ? t("loading") : t("optionsExercise")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
