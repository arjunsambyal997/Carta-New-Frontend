"use client";

import { useState } from "react";
import { useFeedback } from "@/components/Feedback";
import { PageHeader } from "@/components/PageHeader";
import { Status } from "@/components/Status";
import { useMe } from "@/components/useMe";
import { useRegister } from "@/components/useRegister";
import { api } from "@/lib/api";
import { useI18n, type Key } from "@/lib/i18n";
import type { PendingChange } from "@/lib/types";

export default function ApprovalsPage() {
  const { t } = useI18n();
  const { confirm, toast } = useFeedback();
  const me = useMe();
  const [version, setVersion] = useState(0);
  const state = useRegister(async (orgId) => {
    const [org, changes] = await Promise.all([api.organization(orgId), api.approvals(orgId)]);
    return { org, changes };
  }, version);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const isFounder = me?.role === "FOUNDER";
  const canDecide = me?.role === "FOUNDER" || me?.role === "BOARD_MEMBER";
  const mine = (c: PendingChange) => me?.email.toLowerCase() === c.requestedBy.toLowerCase();

  /** Asks first, runs the call, refreshes the list. Server rules (e.g. not enough shares) show inline. */
  async function act(ask: Parameters<typeof confirm>[0], fn: (orgId: string) => Promise<unknown>, done: Key) {
    if (!state.orgId || !(await confirm(ask))) return;
    setBusy(true);
    setError(null);
    try {
      await fn(state.orgId);
      setVersion((v) => v + 1);
      toast(t(done));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const changes = state.data?.changes ?? [];
  const pending = changes.filter((c) => c.pending);
  const decided = changes.filter((c) => !c.pending);
  const on = !!state.data?.org.requireApproval;
  const when = (s: string | null) => (s ? new Date(s).toLocaleString() : "");

  return (
    <div className="space-y-5">
      <PageHeader title={t("navApprovals")} subtitle={t("subApprovals")} />
      <Status state={state} />
      {state.data && (
        <>
          <section className="card flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h2 className="text-sm font-semibold">
                {t("apprRequire")}{" "}
                <span className={`ms-1 rounded-full px-2 py-0.5 text-[11px] ${on ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{on ? t("apprIsOn") : t("apprIsOff")}</span>
              </h2>
              <p className="mt-1 text-sm text-slate-600">{t("apprRequireHelp")}</p>
            </div>
            {isFounder && (
              <button
                className={on ? "btn-ghost" : "btn"}
                disabled={busy}
                onClick={() => act(
                  { message: t(on ? "confirmApprOffTitle" : "confirmApprOnTitle"), detail: t(on ? "confirmApprOffDetail" : "confirmApprOnDetail"), confirmLabel: t(on ? "apprTurnOff" : "apprTurnOn"), danger: on },
                  (orgId) => api.setApprovalRequired(orgId, !on),
                  "toastApprSetting",
                )}
              >
                {t(on ? "apprTurnOff" : "apprTurnOn")}
              </button>
            )}
          </section>

          {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">{t("apprPending")}</h2>
            {pending.length === 0 && <p className="card text-sm text-slate-500">{t("apprNonePending")}</p>}
            {pending.map((c) => (
              <article key={c.id} className="card space-y-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t(`apprKind${c.kind}` as Key)}</p>
                  <p className="font-medium">{c.summary}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{t("apprBy")} <span dir="ltr">{c.requestedBy}</span> · {when(c.requestedAt)}</p>
                </div>
                {canDecide && !mine(c) && (
                  <div className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3">
                    <div className="min-w-48 flex-1">
                      <label className="label" htmlFor={`n-${c.id}`}>{t("apprNote")}</label>
                      <input id={`n-${c.id}`} maxLength={500} className="input" value={notes[c.id] ?? ""} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} />
                    </div>
                    <button className="btn" disabled={busy} onClick={() => act(
                      { message: t("confirmApproveTitle"), detail: `${c.summary}\n\n${t("confirmApproveDetail")}`, confirmLabel: t("apprApprove") },
                      (orgId) => api.approveChange(orgId, c.id, notes[c.id]),
                      "toastApproved",
                    )}>{t("apprApprove")}</button>
                    <button className="btn-ghost" disabled={busy} onClick={() => act(
                      { message: t("confirmRejectTitle"), detail: `${c.summary}\n\n${t("confirmRejectDetail")}`, confirmLabel: t("apprReject"), danger: true },
                      (orgId) => api.rejectChange(orgId, c.id, notes[c.id]),
                      "toastRejected",
                    )}>{t("apprReject")}</button>
                  </div>
                )}
                {mine(c) && (
                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3">
                    <p className="text-sm text-slate-500">{t("apprWaitingOther")}</p>
                    <button className="btn-ghost" disabled={busy} onClick={() => act(
                      { message: t("confirmWithdrawTitle"), detail: c.summary, confirmLabel: t("apprWithdraw"), danger: true },
                      (orgId) => api.cancelChange(orgId, c.id),
                      "toastWithdrawn",
                    )}>{t("apprWithdraw")}</button>
                  </div>
                )}
              </article>
            ))}
          </section>

          {decided.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">{t("apprHistory")}</h2>
              <div className="card overflow-x-auto p-0">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {[t("detail"), t("statusLabel"), t("apprBy"), t("apprDecidedBy"), t("apprResult")].map((h) => (
                        <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {decided.map((c) => (
                      <tr key={c.id} className="border-t border-slate-100 align-top">
                        <td className="px-3 py-2">
                          <span className="block">{c.summary}</span>
                          {c.decisionNote && <span className="block text-xs text-slate-500">“{c.decisionNote}”</span>}
                        </td>
                        <td className="px-3 py-2">{t(`apprStatus${c.status}` as Key)}</td>
                        <td className="px-3 py-2" dir="ltr">{c.requestedBy}</td>
                        <td className="px-3 py-2"><span dir="ltr">{c.decidedBy}</span><span className="block text-xs text-slate-500">{when(c.decidedAt)}</span></td>
                        <td className="px-3 py-2 font-mono text-xs" dir="ltr">{c.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
