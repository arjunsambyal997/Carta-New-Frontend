import type { ComplianceItem, PendingChange, Resolution } from "@/api/types";

export type AttentionKind = "approval" | "vote" | "filing";
export type Severity = "high" | "medium" | "low";

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  severity: Severity;
  title: string;
  titleAr?: string | null;
  /** ISO date or timestamp the item is due, when it has one. */
  due?: string | null;
  href: string;
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
    });
  }
  return items.sort(
    (x, y) =>
      RANK[x.severity] - RANK[y.severity] ||
      (x.due ?? "9999").localeCompare(y.due ?? "9999") ||
      x.id.localeCompare(y.id),
  );
}
