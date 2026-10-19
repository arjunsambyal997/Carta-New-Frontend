import { org, request } from "./client";
import type { PendingChange } from "./types";

export const approvalsApi = {
  approvals: (orgId: string) => request<PendingChange[]>(`${org(orgId)}/approvals`),
  approveChange: (orgId: string, id: string, note?: string) =>
    request<PendingChange>(`${org(orgId)}/approvals/${id}/approve`, { method: "POST", body: JSON.stringify({ note }) }),
  rejectChange: (orgId: string, id: string, note?: string) =>
    request<PendingChange>(`${org(orgId)}/approvals/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
  cancelChange: (orgId: string, id: string) =>
    request<PendingChange>(`${org(orgId)}/approvals/${id}/cancel`, { method: "POST" }),
  setApprovalRequired: (orgId: string, required: boolean) =>
    request<{ required: boolean }>(`${org(orgId)}/settings/approvals`, {
      method: "PUT",
      body: JSON.stringify({ required }),
    }),
};
