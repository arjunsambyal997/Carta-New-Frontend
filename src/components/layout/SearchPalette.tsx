"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, getSession } from "@/api";
import { useI18n, type Key } from "@/context/I18nContext";
import type { SearchHit } from "@/api/types";
import { Icon, type IconName } from "@/components/common/Icon";
import { GROUPS, type Role } from "@/components/layout/nav";

const ROUTE: Record<SearchHit["type"], (h: SearchHit) => string> = {
  shareholder: () => "/cap-table",
  certificate: () => "/certificates",
  resolution: (h) => `/resolutions/${h.id}`,
  document: () => "/vault",
  shareClass: () => "/setup",
};
const LABEL: Record<SearchHit["type"], Key> = {
  shareholder: "hitShareholder",
  certificate: "hitCertificate",
  resolution: "hitResolution",
  document: "hitDocument",
  shareClass: "hitShareClass",
};

type Row = { id: string; title: string; subtitle?: string | null; badge: string; icon?: IconName; href: string };

/** Command palette on Ctrl/Cmd+K: jump to any page, or search holders, certificates, resolutions, documents and classes. */
export function SearchPalette({ role }: { role?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setHits([]);
      setError(null);
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    const s = getSession();
    if (!open || !s || q.trim().length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const id = setTimeout(() => {
      api
        .search(s.orgId, q.trim())
        .then((h) => !cancelled && (setHits(h), setActive(0), setError(null)))
        .catch((e: Error) => !cancelled && setError(e.message));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q, open]);

  const pages = useMemo<Row[]>(
    () =>
      GROUPS.flatMap((g) => g.items)
        .filter((n) => !n.roles || !role || n.roles.includes(role as Role))
        .map((n) => ({ id: n.href, title: t(n.key), badge: t(n.key), icon: n.icon, href: n.href })),
    [role, t],
  );
  const needle = q.trim().toLowerCase();
  const pageRows = needle ? pages.filter((p) => p.title.toLowerCase().includes(needle)) : pages.slice(0, 8);
  const hitRows: Row[] = hits.map((h) => ({
    id: h.type + h.id,
    title: h.title,
    subtitle: h.subtitle,
    badge: t(LABEL[h.type]),
    href: ROUTE[h.type](h),
  }));
  const rows = [...pageRows, ...hitRows];

  const go = (r: Row) => {
    setOpen(false);
    router.push(r.href);
  };

  const section = (label: string) => (
    <li
      role="presentation"
      className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
    >
      {label}
    </li>
  );
  const row = (r: Row, i: number) => (
    <li key={r.id} role="option" aria-selected={i === active}>
      <button
        type="button"
        onMouseEnter={() => setActive(i)}
        onClick={() => go(r)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm ${i === active ? "bg-emerald-50 text-emerald-900" : "text-slate-700"}`}
      >
        {r.icon && <Icon name={r.icon} size={16} className="shrink-0 text-slate-400" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{r.title}</span>
          {r.subtitle && <span className="block truncate text-xs text-slate-500">{r.subtitle}</span>}
        </span>
        {!r.icon && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{r.badge}</span>
        )}
      </button>
    </li>
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-surface px-2.5 text-sm text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-700 md:w-64 md:justify-start"
        onClick={() => setOpen(true)}
        aria-label={t("searchOpen")}
        title="Ctrl K"
      >
        <Icon name="search" size={16} />
        <span className="hidden md:inline">{t("searchOpen")}</span>
        <kbd
          dir="ltr"
          className="ms-auto hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-medium text-slate-500 md:inline"
        >
          ⌘K
        </kbd>
      </button>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="card fixed start-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 !p-0 outline-none rtl:translate-x-1/2"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector("input")?.focus();
          }}
        >
          <Dialog.Title className="sr-only">{t("searchOpen")}</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-slate-200 px-4">
            <Icon name="search" size={16} className="text-slate-400" />
            <input
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder={t("searchPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, rows.length - 1));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                }
                if (e.key === "Enter" && rows[active]) go(rows[active]);
              }}
            />
          </div>
          <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
            {pageRows.length > 0 && section(t("searchPages"))}
            {pageRows.map((r, i) => row(r, i))}
            {hitRows.length > 0 && section(t("searchResults"))}
            {hitRows.map((r, i) => row(r, pageRows.length + i))}
            {needle.length >= 2 && rows.length === 0 && !error && (
              <li className="px-3 py-6 text-center text-sm text-slate-500">{t("searchNone")}</li>
            )}
            {needle.length < 2 && <li className="px-3 py-3 text-center text-xs text-slate-400">{t("searchTyping")}</li>}
            {error && (
              <li role="alert" className="px-3 py-3 text-sm text-red-700">
                {error}
              </li>
            )}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
