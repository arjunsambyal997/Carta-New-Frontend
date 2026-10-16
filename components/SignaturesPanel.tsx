"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useI18n, type Key } from "@/lib/i18n";
import { useFeedback } from "./Feedback";
import type { DocumentType, SignatureView } from "@/lib/types";

/** Who has signed a resolution or certificate, and a form to add your own signature with a fresh authenticator code. */
export function SignaturesPanel({ orgId, type, docRef, allowSign = true }: { orgId: string; type: DocumentType; docRef: string; allowSign?: boolean }) {
  const { t } = useI18n();
  const { confirm, toast } = useFeedback();
  const [list, setList] = useState<SignatureView[] | null>(null);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [statement, setStatement] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.signatures(orgId, type, docRef).then((l) => !cancelled && setList(l)).catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [orgId, type, docRef, version]);

  async function sign(e: FormEvent) {
    e.preventDefault();
    const ok = await confirm({
      message: t("confirmSignTitle"),
      detail: `“${statement.trim() || t("sigStatementDefault")}”

${t("confirmSignDetail")}`,
      confirmLabel: t("sigSign"),
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await api.sign(orgId, { documentType: type, documentRef: docRef, code: code.trim(), statement: statement.trim() || undefined });
      setOpen(false);
      setCode("");
      setStatement("");
      setVersion((v) => v + 1);
      toast(t("toastSigned"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3" aria-label={t("sigTitle")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700">{t("sigTitle")}</h2>
        {allowSign && !open && <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>{t("sigSign")}</button>}
      </div>
      {list && list.length === 0 && <p className="text-sm text-slate-400">{t("sigNone")}</p>}
      {list && list.length > 0 && (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{s.signerName} <span className="font-normal text-slate-500">· {t(`role${s.signerRole}` as Key)}</span></span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${s.valid ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                  {s.valid ? t("sigValid") : s.documentChanged ? t("sigChanged") : t("sigInvalid")}
                </span>
              </div>
              <p className="mt-1 text-slate-600">“{s.statement}”</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(s.signedAt).toLocaleString()} · <span dir="ltr" className="font-mono">{s.signatureHash.slice(0, 16)}…</span></p>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <form onSubmit={sign} className="space-y-3 rounded-lg border border-slate-200 p-3">
          <div>
            <label className="label" htmlFor={`st-${docRef}`}>{t("sigStatement")}</label>
            <input id={`st-${docRef}`} maxLength={300} className="input" placeholder={t("sigStatementDefault")} value={statement} onChange={(e) => setStatement(e.target.value)} />
          </div>
          <div className="max-w-[12rem]">
            <label className="label" htmlFor={`cd-${docRef}`}>{t("sigCode")}</label>
            <input id={`cd-${docRef}`} required inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input" dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <p className="text-xs text-slate-500">{t("sigHint")}</p>
          <div className="flex gap-2">
            <button className="btn" disabled={busy} type="submit">{busy ? t("loading") : t("sigConfirm")}</button>
            <button type="button" className="btn-ghost" onClick={() => { setOpen(false); setError(null); }}>{t("cancel")}</button>
          </div>
        </form>
      )}
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">{error}</div>}
    </section>
  );
}
