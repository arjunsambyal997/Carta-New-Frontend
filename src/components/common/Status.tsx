"use client";

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import type { Loaded } from "@/hooks/useRegister";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** The rough shape of a page, so the placeholder looks like what is about to appear. */
export type SkeletonShape = "dashboard" | "table" | "cards" | "form" | "detail";

function PageSkeleton({ shape }: { shape: SkeletonShape }) {
  switch (shape) {
    case "table":
      return (
        <div className="card space-y-3 p-4">
          <Skeleton className="h-9 w-full max-w-xs" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      );
    case "cards":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      );
    case "form":
      return (
        <div className="card max-w-2xl space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10" />
            </div>
          ))}
          <Skeleton className="h-10 w-32" />
        </div>
      );
    case "detail":
      return (
        <div className="space-y-3">
          <div className="card space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      );
    default:
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      );
  }
}

/** Renders loading / not-connected / error states; returns null when data is ready. */
export function Status({ state, shape = "dashboard" }: { state: Loaded<unknown>; shape?: SkeletonShape }) {
  const { t } = useI18n();
  if (state.loading)
    return (
      <div role="status" aria-label={t("loading")} data-shape={shape}>
        <PageSkeleton shape={shape} />
      </div>
    );
  if (!state.connected)
    return (
      <div className="card flex flex-col items-center gap-3 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>
        <p className="max-w-sm text-slate-600">{t("notConnected")}</p>
        <Link href="/login" className="btn">
          {t("goConnect")}
        </Link>
      </div>
    );
  if (state.error)
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      >
        <span className="min-w-0 break-words">
          {t("error")}: {state.error}
        </span>
        {state.reload && (
          <button type="button" className="btn-ghost h-8 shrink-0" onClick={state.reload}>
            {t("errorRetry")}
          </button>
        )}
      </div>
    );
  return null;
}
