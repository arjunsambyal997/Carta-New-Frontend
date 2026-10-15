"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import type { CapTable, Certificate, Resolution } from "@/lib/types";
import { Icon } from "./Icon";
import { StatusBadge } from "./ResolutionBits";

const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];
const col = (i: number) => `rgb(${SERIES[i % SERIES.length]})`;

function Kpi({ label, value, sub, delay }: { label: string; value: string; sub: string; delay: number }) {
  return (
    <div className="card animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <p className="label !mb-2">{label}</p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs leading-snug text-slate-500">{sub}</p>
    </div>
  );
}

function Panel({ title, hint, action, children, className = "" }: { title: string; hint?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 animate-rise ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function ViewAll({ href }: { href: string }) {
  const { t } = useI18n();
  return (
    <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
      {t("viewAll")}
      <Icon name="arrow" size={14} className="rtl:-scale-x-100" />
    </Link>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** Economic (fully diluted) share beside voting share per holder: shows where control differs from ownership. */
function EconVsVoting({ table }: { table: CapTable }) {
  const { t, num, name } = useI18n();
  const pct = (n: number) => `${num(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  const top = [...table.holders].sort((a, b) => b.fullyDilutedOwnershipPct - a.fullyDilutedOwnershipPct).slice(0, 7);
  const max = Math.max(1, ...top.flatMap((h) => [h.fullyDilutedOwnershipPct, h.votingPct]));
  const rest = table.holders.length - top.length;
  const bar = (v: number, color: string) => (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-e-[4px] bg-transparent">
        <div className="h-full rounded-e-[4px] transition-[width] duration-500" style={{ width: `${(v / max) * 100}%`, background: color, minWidth: v > 0 ? 3 : 0 }} />
      </div>
      <span className="w-14 shrink-0 text-end text-xs tabular-nums text-slate-600">{pct(v)}</span>
    </div>
  );
  return (
    <Panel title={t("econVsVoting")} hint={t("econVsVotingHint")} className="lg:col-span-2">
      <div className="mb-4">
        <Legend items={[{ label: t("economic"), color: col(0) }, { label: t("voting"), color: col(1) }]} />
      </div>
      <ul className="space-y-3">
        {top.map((h) => (
          <li key={h.shareholderId} className="group grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-x-4 gap-y-1 rounded-lg px-1 py-0.5 hover:bg-slate-50 sm:grid-cols-[minmax(0,12rem)_1fr]" title={`${name(h.nameEn, h.nameAr)}: ${t("economic")} ${pct(h.fullyDilutedOwnershipPct)}, ${t("voting")} ${pct(h.votingPct)}`}>
            <span className="truncate text-sm text-slate-800">{name(h.nameEn, h.nameAr)}</span>
            <div className="space-y-1">
              {bar(h.fullyDilutedOwnershipPct, col(0))}
              {bar(h.votingPct, col(1))}
            </div>
          </li>
        ))}
      </ul>
      {rest > 0 && <p className="mt-3 text-xs text-slate-500">+{rest} {t("others").toLowerCase()}</p>}
    </Panel>
  );
}

function ClassMix({ table }: { table: CapTable }) {
  const { t, num } = useI18n();
  const classes = table.classes.filter((c) => c.fullyDilutedShares > 0);
  const total = classes.reduce((s, c) => s + c.fullyDilutedShares, 0) || 1;
  return (
    <Panel title={t("classMix")} hint={t("classMixHint")}>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={t("classMix")}>
        {classes.map((c, i) => (
          <div key={c.shareClassId} className="h-full first:rounded-s-full last:rounded-e-full" style={{ width: `${(c.fullyDilutedShares / total) * 100}%`, background: col(i) }} title={`${c.name}: ${num(c.fullyDilutedShares)}`} />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {classes.map((c, i) => (
          <li key={c.shareClassId} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-start gap-2">
              <span className="mt-1 size-2.5 shrink-0 rounded-sm" style={{ background: col(i) }} />
              <span className="break-words text-slate-800">{c.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-500">
              {num(c.fullyDilutedShares)} · {num((c.fullyDilutedShares / total) * 100, { maximumFractionDigits: 1 })}%
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Resolutions({ list }: { list: Resolution[] | null }) {
  const { t, num, name } = useI18n();
  const shown = [...(list ?? [])].sort((a, b) => (b.openedAt ?? b.votingDeadline).localeCompare(a.openedAt ?? a.votingDeadline)).slice(0, 4);
  return (
    <Panel title={t("recentResolutions")} action={<ViewAll href="/resolutions" />}>
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">{t("noResolutions")}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {shown.map((r) => (
            <li key={r.id}>
              <Link href={`/resolutions/${r.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-emerald-700">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{name(r.title, r.titleAr)}</span>
                  <span className="text-xs tabular-nums text-slate-500">
                    {t("quorumShort")} {num(r.quorumPct)}% · {new Date(r.votingDeadline).toLocaleDateString()}
                  </span>
                </span>
                <StatusBadge status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Certificates({ list }: { list: Certificate[] | null }) {
  const { t, num, name } = useI18n();
  const shown = [...(list ?? [])].sort((a, b) => b.dateIssued.localeCompare(a.dateIssued) || b.certificateNo.localeCompare(a.certificateNo)).slice(0, 5);
  return (
    <Panel title={t("recentCertificates")} action={<ViewAll href="/certificates" />} className="lg:col-span-2">
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">{t("noCertificates")}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {shown.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium">{name(c.shareholderNameEn, c.shareholderNameAr)}</span>
                <span className="text-xs text-slate-500" dir="ltr">{c.certificateNo}</span>
              </span>
              <span className="shrink-0 text-end tabular-nums">
                <span className="block">{num(c.quantity)}</span>
                <span className="text-xs text-slate-500">{c.shareClassName}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export interface Setup {
  classes: number;
  holders: number;
}

/** Guided first-run checklist; disappears once the register has classes, holders, certificates and a resolution. */
function Onboarding({ setup, resolutions, certificates }: { setup: Setup; resolutions: Resolution[] | null; certificates: Certificate[] | null }) {
  const { t } = useI18n();
  const steps = [
    { done: setup.classes > 0, href: "/setup", title: t("obClass"), hint: t("obClassHint") },
    { done: setup.holders > 0, href: "/import", title: t("obHolders"), hint: t("obHoldersHint") },
    { done: (certificates ?? []).length > 0, href: "/certificates/new", title: t("obCert"), hint: t("obCertHint") },
    { done: (resolutions ?? []).length > 0, href: "/resolutions", title: t("obRes"), hint: t("obResHint") },
    { done: false, href: "/ubo", title: t("obUbo"), hint: t("obUboHint"), optional: true },
  ];
  const required = steps.filter((x) => !x.optional);
  if (required.every((x) => x.done)) return null;
  const doneCount = required.filter((x) => x.done).length;
  return (
    <Panel title={t("obTitle")} hint={`${doneCount} / ${required.length}`}>
      <ol className="space-y-2">
        {steps.map((st) => (
          <li key={st.href}>
            <Link href={st.href} className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
              <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${st.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}>
                {st.done && <Icon name="check" size={12} />}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${st.done ? "text-slate-400 line-through" : ""}`}>{st.title}</span>
                <span className="block text-xs text-slate-500">{st.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function Dashboard({ table, resolutions, certificates, setup }: { table: CapTable; resolutions: Resolution[] | null; certificates: Certificate[] | null; setup: Setup }) {
  const { t, num } = useI18n();
  const open = (resolutions ?? []).filter((r) => r.status === "ACTIVE").length;
  return (
    <div className="space-y-5">
      <Onboarding setup={setup} resolutions={resolutions} certificates={certificates} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi delay={0} label={t("issuedShares")} value={num(table.totalIssuedShares)} sub={`${t("kpiFdSub")} ${num(table.totalFullyDilutedShares)}`} />
        <Kpi delay={40} label={t("votingPower")} value={num(table.totalVotingPower)} sub={`${t("kpiTreasurySub")} ${num(table.treasuryShares)}`} />
        <Kpi delay={80} label={t("kpiHolders")} value={num(table.holders.length)} sub={`${num(table.classes.length)} ${t("shareClasses").toLowerCase()}`} />
        <Kpi delay={120} label={t("kpiOpenRes")} value={num(open)} sub={`${num((resolutions ?? []).length)} ${t("navResolutions").toLowerCase()}`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <EconVsVoting table={table} />
        <ClassMix table={table} />
        <Certificates list={certificates} />
        <Resolutions list={resolutions} />
      </div>
    </div>
  );
}
