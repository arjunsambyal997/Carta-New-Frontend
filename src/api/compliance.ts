import { org, request } from "./client";
import type { ComplianceView, ComplianceItem } from "./types";

export const complianceApi = {
  compliance: (orgId: string) => request<ComplianceView>(`${org(orgId)}/compliance`),
  recordFiling: (orgId: string, key: string, body: { filedOn?: string; reference?: string }) =>
    request<ComplianceItem>(`${org(orgId)}/compliance/${key}/filings`, { method: "POST", body: JSON.stringify(body) }),
};
