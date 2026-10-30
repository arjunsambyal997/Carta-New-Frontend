import { describe, expect, it } from "vitest";
import { buildAttention, daysFrom, severityCounts } from "./attention";
import { checklistProgress, checklistSteps } from "./checklist";
import type { ComplianceItem, PendingChange, Resolution } from "@/api/types";

const NOW = Date.parse("2026-10-19T12:00:00Z");
const approval = (id: string, pending = true) =>
  ({ id, pending, summary: `Transfer ${id}`, requestedAt: "2026-10-18T10:00:00Z" }) as PendingChange;
const vote = (id: string, deadline: string, status = "ACTIVE") =>
  ({ id, title: `Vote ${id}`, titleAr: null, status, votingDeadline: deadline }) as Resolution;
const filing = (key: string, status: ComplianceItem["status"], dueDate: string | null) =>
  ({ key, titleEn: key, titleAr: key, status, dueDate }) as ComplianceItem;

describe("buildAttention", () => {
  it("gives each kind of item the action a person takes next", () => {
    const items = buildAttention({
      approvals: [approval("1")],
      resolutions: [vote("1", "2026-12-01T00:00:00Z")],
      filings: [filing("ubo", "OVERDUE", "2026-10-01")],
      now: NOW,
    });
    expect(Object.fromEntries(items.map((i) => [i.kind, i.action]))).toEqual({
      approval: "approve",
      vote: "review",
      filing: "file",
    });
    expect(severityCounts(items)).toEqual({ high: 1, medium: 0, low: 2 });
  });

  it("counts whole days to a due date, negative once it has passed", () => {
    expect(daysFrom("2026-10-21", NOW)).toBe(2);
    expect(daysFrom("2026-10-17", NOW)).toBe(-2);
    expect(daysFrom("2026-10-19T18:00:00Z", NOW)).toBe(0);
  });

  it("lists nothing when nothing needs a person", () => {
    expect(buildAttention({ approvals: [], resolutions: [], filings: [], now: NOW })).toEqual([]);
    expect(buildAttention({ approvals: null, resolutions: null, filings: null, now: NOW })).toEqual([]);
  });

  it("skips decided approvals, closed votes and filings that are fine", () => {
    const items = buildAttention({
      approvals: [approval("1", false)],
      resolutions: [vote("1", "2026-12-01T00:00:00Z", "PASSED")],
      filings: [filing("A", "UP_TO_DATE", null), filing("B", "PENDING", "2026-12-01")],
      now: NOW,
    });
    expect(items).toEqual([]);
  });

  it("ranks overdue filings and lapsed votes above soon-closing votes above waiting approvals", () => {
    const items = buildAttention({
      approvals: [approval("1")],
      resolutions: [
        vote("late", "2026-10-18T00:00:00Z"),
        vote("soon", "2026-10-21T00:00:00Z"),
        vote("far", "2026-11-30T00:00:00Z"),
      ],
      filings: [filing("OVER", "OVERDUE", "2026-10-01"), filing("SOON", "DUE_SOON", "2026-10-22")],
      now: NOW,
    });
    expect(items.map((i) => [i.id, i.severity])).toEqual([
      ["f-OVER", "high"],
      ["r-late", "high"],
      ["r-soon", "medium"],
      ["f-SOON", "medium"],
      ["a-1", "low"],
      ["r-far", "low"],
    ]);
  });
});

describe("checklist", () => {
  const empty = { hasLogo: false, classes: 0, holders: 0, members: 1, certificates: 0, resolutions: 0 };

  it("starts with only the company step done", () => {
    const p = checklistProgress(checklistSteps(empty));
    expect(p).toMatchObject({ done: 1, total: 7, pct: 14, complete: false });
  });

  it("is complete once the required steps are done, even without a logo or a team", () => {
    const p = checklistProgress(checklistSteps({ ...empty, classes: 1, holders: 2, certificates: 3, resolutions: 1 }));
    expect(p.complete).toBe(true);
    expect(p.done).toBe(5);
  });

  it("counts the team step only once someone besides the founder is added", () => {
    const team = (members: number) => checklistSteps({ ...empty, members }).find((s) => s.key === "team")!.done;
    expect(team(1)).toBe(false);
    expect(team(2)).toBe(true);
  });
});
