"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { Icon } from "./Icon";

type Kind = "ok" | "error";
interface Ask {
  message: string;
  detail?: string;
  confirmLabel: string;
  danger?: boolean;
}
interface Feedback {
  toast: (text: string, kind?: Kind) => void;
  /** Resolves true when the user confirms, false on cancel or Escape. */
  confirm: (ask: Ask) => Promise<boolean>;
}

const Ctx = createContext<Feedback | null>(null);

/** Toasts (bottom corner) and a native <dialog> confirm, shared by every page. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<{ id: number; text: string; kind: Kind }[]>([]);
  const [ask, setAsk] = useState<(Ask & { resolve: (ok: boolean) => void }) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const toast = useCallback((text: string, kind: Kind = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((l) => [...l, { id, text, kind }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3500);
  }, []);
  const confirm = useCallback((a: Ask) => new Promise<boolean>((resolve) => setAsk({ ...a, resolve })), []);

  useEffect(() => {
    if (ask && !dialog.current?.open) dialog.current?.showModal();
  }, [ask]);

  const answer = (ok: boolean) => {
    ask?.resolve(ok); // a second resolve (from the close event) is a no-op
    setAsk(null);
    if (dialog.current?.open) dialog.current.close();
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 end-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((x) => (
          <div
            key={x.id}
            role={x.kind === "error" ? "alert" : "status"}
            className="pointer-events-auto flex animate-rise items-start gap-2.5 rounded-xl border border-slate-200 bg-surface px-4 py-3 text-sm text-slate-800 shadow-pop"
          >
            <span className={`mt-px grid size-5 shrink-0 place-items-center rounded-full ${x.kind === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
              <Icon name={x.kind === "error" ? "alert" : "check"} size={13} strokeWidth={2.4} />
            </span>
            <span className="min-w-0 flex-1 break-words">{x.text}</span>
          </div>
        ))}
      </div>
      <dialog
        ref={dialog}
        onClose={() => ask && answer(false)}
        className="w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-surface p-0 text-slate-900 shadow-pop backdrop:bg-slate-900/40 backdrop:backdrop-blur-[1px]"
      >
        {ask && (
          <form className="space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); answer(true); }}>
            <div className="flex gap-3">
              <span className={`grid size-9 shrink-0 place-items-center rounded-full ${ask.danger ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                <Icon name={ask.danger ? "alert" : "check"} size={18} />
              </span>
              <div className="min-w-0 space-y-1 pt-1">
                <p className="font-semibold">{ask.message}</p>
                {ask.detail && <p className="whitespace-pre-line text-sm text-slate-600">{ask.detail}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {/* focus lands on Cancel so Enter never confirms by accident */}
              <button type="button" autoFocus className="btn-ghost h-9" onClick={() => answer(false)}>{t("cancel")}</button>
              <button type="submit" className={`btn h-9 ${ask.danger ? "!bg-red-600 hover:!bg-red-700" : ""}`}>{ask.confirmLabel}</button>
            </div>
          </form>
        )}
      </dialog>
    </Ctx.Provider>
  );
}

export function useFeedback() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFeedback outside FeedbackProvider");
  return v;
}
