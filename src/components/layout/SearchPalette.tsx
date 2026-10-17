"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, getSession } from "@/api";
import { useI18n, type Key } from "@/context/I18nContext";
import type { SearchHit } from "@/api/types";
import { Icon } from "@/components/common/Icon";

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

/** Ctrl/Cmd+K search across holders, certificates, resolutions, documents and classes. */
export function SearchPalette() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
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
      setTimeout(() => input.current?.focus(), 0);
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

  const go = (h: SearchHit) => {
    setOpen(false);
    router.push(ROUTE[h.type](h));
  };

  return (
    <>
      <button
        type="button"
        className="btn-ghost h-9"
        onClick={() => setOpen(true)}
        aria-label={t("searchOpen")}
        title="Ctrl K"
      >
        <Icon name="search" size={16} />
        <span className="hidden md:inline">{t("searchOpen")}</span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("searchOpen")}
            className="card w-full max-w-xl !p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-slate-200 px-4">
              <Icon name="search" size={16} className="text-slate-400" />
              <input
                ref={input}
                className="h-12 w-full bg-transparent text-sm outline-none"
                placeholder={t("searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, hits.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  }
                  if (e.key === "Enter" && hits[active]) go(hits[active]);
                }}
              />
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
              {hits.map((h, i) => (
                <li key={h.type + h.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(h)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm ${i === active ? "bg-emerald-50" : ""}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{h.title}</span>
                      {h.subtitle && <span className="block truncate text-xs text-slate-500">{h.subtitle}</span>}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                      {t(LABEL[h.type])}
                    </span>
                  </button>
                </li>
              ))}
              {q.trim().length >= 2 && hits.length === 0 && !error && (
                <li className="px-3 py-6 text-center text-sm text-slate-500">{t("searchNone")}</li>
              )}
              {q.trim().length < 2 && (
                <li className="px-3 py-6 text-center text-sm text-slate-500">{t("searchHint")}</li>
              )}
              {error && (
                <li role="alert" className="px-3 py-3 text-sm text-red-700">
                  {error}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
