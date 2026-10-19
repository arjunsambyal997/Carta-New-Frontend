"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, saveSession } from "@/api";
import { useI18n, type Key } from "@/context/I18nContext";
import type { Role } from "@/api/types";
import { Icon } from "@/components/common/Icon";

interface Company {
  id: string;
  name: string;
  role: Role;
}

/** The company name in the top bar. Click it to move to another company on the same login, or to add one. */
export function CompanySwitcher({
  current,
  orgId,
  canAdd,
}: {
  current: string | null;
  orgId: string;
  canAdd: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Company[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api
      .organizations()
      .then((l) => !cancelled && setList(l))
      .catch((e: Error) => !cancelled && setError(e.message));
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      cancelled = true;
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  async function pick(id: string) {
    if (id === orgId) return setOpen(false);
    setBusy(id);
    setError(null);
    try {
      const r = await api.switchOrganization(id);
      saveSession(r.accessToken!, r.organizationId!, r.refreshToken);
      window.location.assign("/"); // a clean start: nothing from the previous company stays on screen
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <div ref={box} className="relative min-w-0">
      <button
        type="button"
        className="flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("switchCompany")}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">{current ?? t("switchCompany")}</span>
        <Icon name="chevron" size={14} className="shrink-0 text-slate-400" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t("yourCompanies")}
          className="absolute start-0 top-full z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-surface p-1.5 shadow-pop"
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t("yourCompanies")}
          </p>
          {!list && !error && <p className="px-2.5 py-2 text-sm text-slate-500">{t("loading")}</p>}
          {error && (
            <p role="alert" className="px-2.5 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {list?.map((c) => (
            <button
              key={c.id}
              type="button"
              role="menuitem"
              disabled={busy !== null}
              onClick={() => pick(c.id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-start text-sm hover:bg-slate-100 disabled:opacity-60"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block text-xs text-slate-500">{t(`role${c.role}` as Key)}</span>
              </span>
              {c.id === orgId && <Icon name="check" size={16} className="shrink-0 text-emerald-700" />}
            </button>
          ))}
          {canAdd && (
            <Link
              href="/companies/new"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 border-t border-slate-200 px-2.5 pb-2 pt-3 text-sm font-medium text-emerald-700 hover:underline"
            >
              + {t("addCompany")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
