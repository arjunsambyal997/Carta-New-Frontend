import type { ComplianceItem, PendingChange, Resolution } from "@/api/types";

export type AttentionKind = "approval" | "vote" | "filing";
export type Severity = "high" | "medium" | "low";
/** The one thing a person does next with an item, shown as a chip on its row. */
export type AttentionAction = "approve" | "review" | "file";

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  severity: Severity;
  title: string;
  titleAr?: string | null;
  /** ISO date or timestamp the item is due, when it has one. */
  due?: string | null;
  href: string;
  action: AttentionAction;
}

const RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
const DAY = 86_400_000;

export interface AttentionInput {
  approvals: PendingChange[] | null;
  resolutions: Resolution[] | null;
  filings: ComplianceItem[] | null;
  now: number;
}

/** What needs a person today: waiting approvals, votes about to close, filings due or overdue. Null inputs (not allowed to read) add nothing. */
export function buildAttention({ approvals, resolutions, filings, now }: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const a of approvals ?? []) {
    if (!a.pending) continue;
    items.push({
      id: `a-${a.id}`,
      kind: "approval",
      severity: "low",
      title: a.summary,
      due: a.requestedAt,
      href: "/approvals",
      action: "approve",
    });
  }
  for (const r of resolutions ?? []) {
    if (r.status !== "ACTIVE") continue;
    const left = new Date(r.votingDeadline).getTime() - now;
    items.push({
      id: `r-${r.id}`,
      kind: "vote",
      severity: left < 0 ? "high" : left < 3 * DAY ? "medium" : "low",
      title: r.title,
      titleAr: r.titleAr,
      due: r.votingDeadline,
      href: `/resolutions/${r.id}`,
      action: "review",
    });
  }
  for (const f of filings ?? []) {
    if (f.status !== "OVERDUE" && f.status !== "DUE_SOON") continue;
    items.push({
      id: `f-${f.key}`,
      kind: "filing",
      severity: f.status === "OVERDUE" ? "high" : "medium",
      title: f.titleEn,
      titleAr: f.titleAr,
      due: f.dueDate,
      href: "/compliance",
      action: "file",
    });
  }
  return items.sort(
    (x, y) =>
      RANK[x.severity] - RANK[y.severity] ||
      (x.due ?? "9999").localeCompare(y.due ?? "9999") ||
      x.id.localeCompare(y.id),
  );
}

/** How many of each severity, for the queue's summary line. */
export function severityCounts(items: AttentionItem[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const i of items) counts[i.severity]++;
  return counts;
}

/** Whole days from `now` to `iso` (negative when it is in the past), rounded toward the nearer day. */
export function daysFrom(iso: string, now: number): number {
  const isDay = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const t = new Date(isDay ? `${iso}T12:00:00Z` : iso).getTime();
  return Math.round((t - now) / DAY);
}
