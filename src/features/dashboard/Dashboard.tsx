"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useI18n } from "@/context/I18nContext";
import type {
  AuditEntry,
  CapTable,
  Certificate,
  Organization,
  PendingChange,
  Resolution,
  ComplianceItem,
} from "@/api/types";
import { CircleCheck, CircleX, Clock, Coins, FilePen, Gavel, Users, Vote } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Icon } from "@/components/common/Icon";
import { Tooltip } from "@/components/common/Tooltip";
import { Trend } from "@/components/common/Trend";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/features/resolutions/ResolutionBits";
import { buildAttention, type AttentionItem, type Severity } from "@/features/dashboard/attention";
import { checklistProgress, checklistSteps, type ChecklistStep } from "@/features/dashboard/checklist";

const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];
const col = (i: number) => `rgb(${SERIES[i % SERIES.length]})`;

function Kpi({
  label,
  value,
  sub,
  delay,
  icon,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  delay: number;
  icon: ReactNode;
  trend?: ReactNode;
}) {
  return (
    <div className="card animate-rise !p-4 sm:!p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
        {trend}
        <span>{sub}</span>
      </div>
    </div>
  );
}

function Panel({
  title,
  hint,
  action,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
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
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
    >
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
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-[width] duration-500 group-hover:brightness-110"
          style={{ width: `${(v / max) * 100}%`, background: color, minWidth: v > 0 ? 4 : 0 }}
        />
      </div>
      <span className="w-14 shrink-0 text-end text-xs tabular-nums text-slate-600">{pct(v)}</span>
    </div>
  );
  return (
    <Panel
      title={t("econVsVoting")}
      hint={t("econVsVotingHint")}
      className="lg:col-span-2"
      action={
        <Legend
          items={[
            { label: t("economic"), color: col(0) },
            { label: t("voting"), color: col(1) },
          ]}
        />
      }
    >
      <ul className="space-y-1">
        {top.map((h) => {
          const gap = h.votingPct - h.fullyDilutedOwnershipPct;
          return (
            <li key={h.shareholderId}>
              <Tooltip
                content={
                  <dl className="space-y-1">
                    <dt className="font-semibold text-slate-900">{name(h.nameEn, h.nameAr)}</dt>
                    <dd className="flex justify-between gap-6 tabular-nums">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-sm" style={{ background: col(0) }} />
                        {t("economic")}
                      </span>
                      {pct(h.fullyDilutedOwnershipPct)}
                    </dd>
                    <dd className="flex justify-between gap-6 tabular-nums">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-sm" style={{ background: col(1) }} />
                        {t("voting")}
                      </span>
                      {pct(h.votingPct)}
                    </dd>
                    <dd className="border-t border-slate-200 pt-1 text-slate-500">
                      {t("controlGap")}: {gap > 0 ? "+" : ""}
                      {num(gap, { maximumFractionDigits: 1 })} pp
                    </dd>
                  </dl>
                }
              >
                <div
                  tabIndex={0}
                  className="group grid cursor-default grid-cols-[minmax(0,8rem)_1fr] items-center gap-x-4 gap-y-1 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 sm:grid-cols-[minmax(0,12rem)_1fr]"
                >
                  <span className="truncate text-sm text-slate-800">{name(h.nameEn, h.nameAr)}</span>
                  <div className="space-y-1.5">
                    {bar(h.fullyDilutedOwnershipPct, col(0))}
                    {bar(h.votingPct, col(1))}
                  </div>
                </div>
              </Tooltip>
            </li>
          );
        })}
      </ul>
      {rest > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          +{rest} {t("others").toLowerCase()}
        </p>
      )}
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
          <div
            key={c.shareClassId}
            className="h-full first:rounded-s-full last:rounded-e-full"
            style={{ width: `${(c.fullyDilutedShares / total) * 100}%`, background: col(i) }}
            title={`${c.name}: ${num(c.fullyDilutedShares)}`}
          />
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

const RES_ICON = { DRAFT: FilePen, ACTIVE: Clock, PASSED: CircleCheck, REJECTED: CircleX } as const;
const RES_ACCENT = {
  DRAFT: "bg-slate-300",
  ACTIVE: "bg-sky-600",
  PASSED: "bg-emerald-600",
  REJECTED: "bg-red-500",
} as const;

function Resolutions({ list }: { list: Resolution[] | null }) {
  const { t, num, name, date } = useI18n();
  const shown = [...(list ?? [])]
    .sort((a, b) => (b.openedAt ?? b.votingDeadline).localeCompare(a.openedAt ?? a.votingDeadline))
    .slice(0, 4);
  return (
    <Panel title={t("recentResolutions")} action={<ViewAll href="/resolutions" />}>
      {shown.length === 0 ? (
        <EmptyState
          compact
          icon="resolutions"
          title={t("noResolutions")}
          hint={t("noResolutionsHint")}
          action={{ label: t("navResolutions"), href: "/resolutions" }}
        />
      ) : (
        <ul className="space-y-2.5">
          {shown.map((r) => {
            const Ico = RES_ICON[r.status];
            const total = r.totalVotingPower ?? 0;
            const w = (n: number) => (total > 0 ? Math.min(100, (n / total) * 100) : 0);
            const closed = r.status === "PASSED" || r.status === "REJECTED";
            return (
              <li key={r.id}>
                <Link
                  href={`/resolutions/${r.id}`}
                  className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-surface p-3 ps-4 transition-all hover:-translate-y-px hover:border-slate-300 hover:shadow-card"
                >
                  <span aria-hidden className={`absolute inset-y-0 start-0 w-1 ${RES_ACCENT[r.status]}`} />
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm font-medium leading-snug text-slate-900 group-hover:text-emerald-700">
                      {name(r.title, r.titleAr)}
                    </p>
                    <span className="flex shrink-0 items-center gap-1">
                      <StatusBadge status={r.status} icon={<Ico size={12} aria-hidden />} />
                    </span>
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                    <div className="bg-emerald-600" style={{ width: `${w(r.tally.forWeight)}%` }} />
                    <div className="bg-red-500" style={{ width: `${w(r.tally.againstWeight)}%` }} />
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs tabular-nums text-slate-500">
                    <span>
                      {t("quorumShort")} {num(r.quorumPct)}%
                    </span>
                    {r.status !== "DRAFT" && (
                      <span>
                        {t("participation")} {num(r.tally.participationPct, { maximumFractionDigits: 1 })}%
                      </span>
                    )}
                    <span className="ms-auto">
                      {closed ? t("resClosedOn") : t("resClosesOn")} {date(r.closedAt ?? r.votingDeadline)}
                    </span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function Certificates({ list }: { list: Certificate[] | null }) {
  const { t, num, name } = useI18n();
  const shown = [...(list ?? [])]
    .sort((a, b) => b.dateIssued.localeCompare(a.dateIssued) || b.certificateNo.localeCompare(a.certificateNo))
    .slice(0, 5);
  return (
    <Panel title={t("recentCertificates")} action={<ViewAll href="/certificates" />}>
      {shown.length === 0 ? (
        <EmptyState
          compact
          icon="certificates"
          title={t("noCertificates")}
          hint={t("noCertificatesHint")}
          action={{ label: t("navCertificates"), href: "/certificates/new" }}
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {shown.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={c.shareholderNameEn} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{name(c.shareholderNameEn, c.shareholderNameAr)}</span>
                  <span className="text-xs text-slate-500" dir="ltr">
                    {c.certificateNo}
                  </span>
                </span>
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
  members: number;
}

const STEP_KEYS: Record<
  ChecklistStep["key"],
  [Parameters<ReturnType<typeof useI18n>["t"]>[0], Parameters<ReturnType<typeof useI18n>["t"]>[0]]
> = {
  company: ["obCompany", "obCompanyHint"],
  logo: ["obLogo", "obLogoHint"],
  classes: ["obClass", "obClassHint"],
  holders: ["obHolders", "obHoldersHint"],
  team: ["obTeam", "obTeamHint"],
  certificate: ["obCert", "obCertHint"],
  resolution: ["obRes", "obResHint"],
};

/** Guided first-run checklist with a progress bar; goes away once the required steps are done. */
function Onboarding({
  org,
  setup,
  resolutions,
  certificates,
}: {
  org: Organization;
  setup: Setup;
  resolutions: Resolution[] | null;
  certificates: Certificate[] | null;
}) {
  const { t, num } = useI18n();
  const steps = checklistSteps({
    hasLogo: !!org.hasLogo,
    classes: setup.classes,
    holders: setup.holders,
    members: setup.members,
    certificates: (certificates ?? []).length,
    resolutions: (resolutions ?? []).length,
  });
  const progress = checklistProgress(steps);
  if (progress.complete) return null;
  return (
    <Panel
      title={t("obTitle")}
      hint={t("obSubtitle")}
      action={<span className="chip bg-emerald-50 text-emerald-800">{num(progress.pct)}%</span>}
    >
      <div
        className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.pct}
        aria-label={t("obTitle")}
      >
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width] duration-500"
          style={{ width: `${progress.pct}%` }}
        />
      </div>
      <ol className="grid gap-1 sm:grid-cols-2">
        {steps.map((st) => {
          const [title, hint] = STEP_KEYS[st.key];
          return (
            <li key={st.key}>
              <Link href={st.href} className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
                <span
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${st.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}
                >
                  {st.done && <Icon name="check" size={12} />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-medium ${st.done ? "text-slate-400 line-through" : ""}`}>
                    {t(title)}
                    {st.optional && !st.done && (
                      <span className="ms-2 text-[11px] font-normal text-slate-400">{t("obOptional")}</span>
                    )}
                  </span>
                  <span className="block text-xs text-slate-500">{t(hint)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

const SEV_TONE: Record<Severity, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-800",
  low: "bg-slate-100 text-slate-600",
};

function NeedsAttention({
  approvals,
  resolutions,
  filings,
}: {
  approvals: PendingChange[] | null;
  resolutions: Resolution[] | null;
  filings: ComplianceItem[] | null;
}) {
  const { t, name, date } = useI18n();
  const [now] = useState(() => Date.now());
  const items = buildAttention({ approvals, resolutions, filings, now });
  const shown = items.slice(0, 6);
  const label = (i: AttentionItem) =>
    t(i.kind === "approval" ? "attnApproval" : i.kind === "vote" ? "attnVote" : "attnFiling");
  return (
    <Panel title={t("needsAttention")} hint={t("needsAttentionHint")} className="lg:col-span-2">
      {shown.length === 0 ? (
        <EmptyState compact icon="check" title={t("attnNone")} hint={t("attnNoneHint")} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {shown.map((i) => (
            <li key={i.id}>
              <Link href={i.href} className="flex items-center justify-between gap-3 py-2.5 hover:text-emerald-700">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {i.titleAr !== undefined ? name(i.title, i.titleAr) : i.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {label(i)}
                    {i.due && <> · {date(i.due)}</>}
                  </span>
                </span>
                <span className={`chip shrink-0 ${SEV_TONE[i.severity]}`}>
                  {t(i.severity === "high" ? "attnHigh" : i.severity === "medium" ? "attnMedium" : "attnLow")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {items.length > shown.length && <p className="mt-2 text-xs text-slate-500">+{items.length - shown.length}</p>}
    </Panel>
  );
}

/** Fully diluted ownership as a donut: the five biggest holders, everyone else grouped. Hand-drawn SVG, no chart library. */
function OwnershipDonut({ table }: { table: CapTable }) {
  const { t, num, name } = useI18n();
  const sorted = [...table.holders].sort((a, b) => b.fullyDilutedOwnershipPct - a.fullyDilutedOwnershipPct);
  const top = sorted.slice(0, 5).filter((h) => h.fullyDilutedOwnershipPct > 0);
  const otherPct = Math.max(0, 100 - top.reduce((s, h) => s + h.fullyDilutedOwnershipPct, 0));
  const slices = [
    ...top.map((h, i) => ({
      key: h.shareholderId,
      label: name(h.nameEn, h.nameAr),
      pct: h.fullyDilutedOwnershipPct,
      color: col(i),
    })),
    ...(otherPct > 0.05 && sorted.length > top.length
      ? [{ key: "others", label: t("others"), pct: otherPct, color: "rgb(148 163 184)" }]
      : []),
  ];
  const R = 15.9155;
  let offset = 0;
  return (
    <Panel title={t("ownershipDonut")} hint={t("ownershipDonutHint")}>
      {slices.length === 0 ? (
        <EmptyState
          compact
          icon="captable"
          title={t("noOwnershipYet")}
          hint={t("noOwnershipYetHint")}
          action={{ label: t("navCertificates"), href: "/certificates/new" }}
        />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <svg viewBox="0 0 36 36" className="size-36 shrink-0 -rotate-90" role="img" aria-label={t("ownershipDonut")}>
            <circle cx="18" cy="18" r={R} fill="none" stroke="rgb(241 245 249)" strokeWidth="4.5" />
            {slices.map((s) => {
              const dash = Math.min(100, s.pct);
              const el = (
                <circle
                  key={s.key}
                  cx="18"
                  cy="18"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="4.5"
                  strokeDasharray={`${Math.max(0, dash - 0.6)} ${100 - Math.max(0, dash - 0.6)}`}
                  strokeDashoffset={-offset}
                >
                  <title>{`${s.label}: ${num(s.pct, { maximumFractionDigits: 1 })}%`}</title>
                </circle>
              );
              offset += dash;
              return el;
            })}
          </svg>
          <ul className="w-full min-w-0 space-y-2 text-sm">
            {slices.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                  <span className="truncate text-slate-800">{s.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-slate-500">
                  {num(s.pct, { maximumFractionDigits: 1 })}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

/** Audit details embed record ids; they mean nothing on a dashboard, so drop them. */
const tidy = (d: string | null) =>
  d?.replace(/\s*\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "").trim() ?? null;

function ActivityFeed({ entries }: { entries: AuditEntry[] | null }) {
  const { t, date } = useI18n();
  if (entries === null) return null; // this role cannot read the audit trail
  const shown = [...entries].sort((a, b) => b.id - a.id).slice(0, 8);
  return (
    <Panel title={t("recentActivity")} action={<ViewAll href="/audit" />} className="lg:col-span-2">
      {shown.length === 0 ? (
        <EmptyState compact icon="audit" title={t("noActivity")} hint={t("noActivityHint")} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {shown.map((e) => (
            <li key={e.id} className="flex items-start gap-3 py-2.5">
              <Avatar name={e.performedBy} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{tidy(e.detail) ?? `${e.action} ${e.entityName}`}</span>
                <span className="text-xs text-slate-500">
                  <span dir="ltr">{e.performedBy}</span> · {date(e.occurredAt, true)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function Dashboard({
  org,
  table,
  prior,
  resolutions,
  certificates,
  setup,
  approvals,
  filings,
  audit,
}: {
  org: Organization;
  table: CapTable;
  /** The register 30 days ago, for the change badges. `null` when it could not be loaded. */
  prior?: CapTable | null;
  resolutions: Resolution[] | null;
  certificates: Certificate[] | null;
  setup: Setup;
  approvals: PendingChange[] | null;
  filings: ComplianceItem[] | null;
  audit: AuditEntry[] | null;
}) {
  const { t, num } = useI18n();
  const open = (resolutions ?? []).filter((r) => r.status === "ACTIVE").length;
  const pctFmt = (n: number) => num(Math.abs(n), { maximumFractionDigits: 1 });
  return (
    <div className="space-y-5">
      <Onboarding org={org} setup={setup} resolutions={resolutions} certificates={certificates} />
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4 2xl:gap-5">
        <Kpi
          delay={0}
          icon={<Coins size={16} aria-hidden />}
          label={t("issuedShares")}
          value={num(table.totalIssuedShares)}
          trend={
            <Trend
              now={table.totalIssuedShares}
              before={prior?.totalIssuedShares ?? null}
              format={pctFmt}
              label={t("kpiSince")}
            />
          }
          sub={`${t("kpiFdSub")} ${num(table.totalFullyDilutedShares)}`}
        />
        <Kpi
          delay={40}
          icon={<Vote size={16} aria-hidden />}
          label={t("votingPower")}
          value={num(table.totalVotingPower)}
          trend={
            <Trend
              now={table.totalVotingPower}
              before={prior?.totalVotingPower ?? null}
              format={pctFmt}
              label={t("kpiSince")}
            />
          }
          sub={`${t("kpiTreasurySub")} ${num(table.treasuryShares)}`}
        />
        <Kpi
          delay={80}
          icon={<Users size={16} aria-hidden />}
          label={t("kpiHolders")}
          value={num(table.holders.length)}
          trend={
            <Trend
              now={table.holders.length}
              before={prior?.holders.length ?? null}
              format={pctFmt}
              label={t("kpiSince")}
            />
          }
          sub={`${num(table.classes.length)} ${t("shareClasses").toLowerCase()}`}
        />
        <Kpi
          delay={120}
          icon={<Gavel size={16} aria-hidden />}
          label={t("kpiOpenRes")}
          value={num(open)}
          trend={open > 0 ? <span className="chip bg-sky-50 text-sky-700">{t("statusACTIVE")}</span> : undefined}
          sub={`${num((resolutions ?? []).length)} ${t("navResolutions").toLowerCase()}`}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <NeedsAttention approvals={approvals} resolutions={resolutions} filings={filings} />
        <OwnershipDonut table={table} />
        <EconVsVoting table={table} />
        <div className="space-y-5">
          <ClassMix table={table} />
          <Resolutions list={resolutions} />
        </div>
        <ActivityFeed entries={audit} />
        <Certificates list={certificates} />
      </div>
    </div>
  );
}
