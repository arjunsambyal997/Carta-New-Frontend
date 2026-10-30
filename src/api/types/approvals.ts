/** A register change waiting for (or past) a second person's decision. Also the 202 answer to a gated action. */
export interface PendingChange {
  id: string;
  pending: boolean;
  kind: "ISSUE_CERTIFICATE" | "TRANSFER" | "BUY_BACK" | "EXERCISE_OPTIONS";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  summary: string;
  requestedBy: string;
  requestedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  result: string | null;
}
