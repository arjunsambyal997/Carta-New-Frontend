"use client";

import Link from "next/link";
import { useState } from "react";
import type { ComplianceItem, PendingChange, Resolution } from "@/api/types";
import { EmptyState } from "@/components/common/EmptyState";
import { Icon, type IconName } from "@/components/common/Icon";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";
import { useI18n, type Key } from "@/context/I18nContext";
import {
  buildAttention,
  daysFrom,
  severityCounts,
  type AttentionAction,
  type AttentionItem,
  type Severity,
} from "@/features/dashboard/attention";
import { Tile } from "@/features/dashboard/widgets/Tile";

const SHOWN = 6;

/** Severity sets the colour of the row's marker and edge; the chip is always the same indigo "do this" colour. */
const TONE: Record<Severity, { mark: string; edge: string; dot: string }> = {
  high: { mark: "bg-red-50 text-red-700", edge: "bg-red-500", dot: "bg-red-500" },
  medium: { mark: "bg-amber-50 text-amber-800", edge: "bg-amber-500", dot: "bg-amber-500" },
  low: { mark: "bg-slate-100 text-slate-600", edge: "bg-slate-300", dot: "bg-slate-400" },
};
const SEV_KEY: Record<Severity, Key> = { high: "attnHigh", medium: "attnMedium", low: "attnLow" };
const KIND: Record<AttentionItem["kind"], { icon: IconName; key: Key }> = {
  approval: { icon: "approvals", key: "attnApproval" },
  vote: { icon: "resolutions", key: "attnVote" },
  filing: { icon: "alert", key: "attnFiling" },
};
const ACTION_KEY: Record<AttentionAction, Key> = {
  approve: "attnActApprove",
  review: "attnActReview",
  file: "attnActFile",
};

/** Approvals, votes and filings waiting on someone, most urgent first, each with the one action it needs. */
export function NeedsAttention({
  approvals,
  resolutions,
  filings,
  className = "",
}: {
  approvals: PendingChange[] | null;
  resolutions: Resolution[] | null;
  filings: ComplianceItem[] | null;
  className?: string;
}) {
  const { t, num, name, locale, date } = useI18n();
  const [now] = useState(() => Date.now());
  const items = buildAttention({ approvals, resolutions, filings, now });
  const shown = items.slice(0, SHOWN);
  const counts = severityCounts(items);
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en", { numeric: "auto" });
  const when = (i: AttentionItem) =>
    i.due
      ? `${t(i.kind === "approval" ? "attnRequested" : "attnDue")} ${rtf.format(daysFrom(i.due, now), "day")}`
      : null;

  return (
    <Tile
      title={
        <span className="flex items-center gap-2">
          {t("needsAttention")}
          {items.length > 0 && (
            <span className="num rounded-full bg-slate-900 px-1.5 text-[11px] font-semibold leading-5 text-surface">
              {num(items.length)}
            </span>
          )}
        </span>
      }
      hint={t("needsAttentionHint")}
      className={className}
      action={
        items.length > 0 && (
          <ul className="hidden shrink-0 items-center gap-3 text-xs text-slate-500 sm:flex">
            {(["high", "medium", "low"] as const)
              .filter((s) => counts[s] > 0)
              .map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${TONE[s].dot}`} aria-hidden />
                  <span className="num font-medium text-slate-700">{num(counts[s])}</span>
                  {t(SEV_KEY[s])}
                </li>
              ))}
          </ul>
        )
      }
    >
      {shown.length === 0 ? (
        <EmptyState compact icon="check" title={t("attnNone")} hint={t("attnNoneHint")} />
      ) : (
        <StaggerList className="-mx-2 space-y-1">
          {shown.map((i) => {
            const tone = TONE[i.severity];
            const kind = KIND[i.kind];
            const due = when(i);
            return (
              <StaggerItem key={i.id}>
                <Link
                  href={i.href}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 sm:gap-4 sm:px-3"
                >
                  {/* Severity edge: slides in from the start side on hover so the row reads as one target. */}
                  <span
                    aria-hidden
                    className={`absolute inset-y-2 start-0 w-0.5 origin-center scale-y-0 rounded-full transition-transform duration-200 group-hover:scale-y-100 group-focus-visible:scale-y-100 ${tone.edge}`}
                  />
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone.mark}`}>
                    <Icon name={kind.icon} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {i.titleAr !== undefined ? name(i.title, i.titleAr) : i.title}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                      <span>{t(kind.key)}</span>
                      {due && (
                        <>
                          <span aria-hidden>·</span>
                          <span title={date(i.due)} className={i.severity === "high" ? "font-medium text-red-700" : ""}>
                            {due}
                          </span>
                        </>
                      )}
                      <span className="sr-only">· {t(SEV_KEY[i.severity])}</span>
                    </span>
                  </span>
                  <span className="action-chip">
                    {t(ACTION_KEY[i.action])}
                    <Icon
                      name="arrow"
                      size={13}
                      className="-me-0.5 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                    />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
      {items.length > shown.length && (
        <p className="num mt-2 text-xs text-slate-500">
          +{num(items.length - shown.length)} {t("attnMore")}
        </p>
      )}
    </Tile>
  );
}
