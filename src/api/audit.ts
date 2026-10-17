import { org, request } from "./client";
import type { AuditTrail } from "./types";

export const auditApi = {
  audit: (orgId: string) => request<AuditTrail>(`${org(orgId)}/audit`),
};
