import { org, request } from "./client";
import type { Certificate, Conversion, SuccessionRule, SuccessionRuleInput } from "./types";

export const successionApi = {
  successionRules: (orgId: string) => request<SuccessionRule[]>(`${org(orgId)}/succession-rules`),
  createSuccessionRule: (orgId: string, body: SuccessionRuleInput) =>
    request<SuccessionRule>(`${org(orgId)}/succession-rules`, { method: "POST", body: JSON.stringify(body) }),
  previewSuccession: (orgId: string, id: string) =>
    request<Conversion[]>(`${org(orgId)}/succession-rules/${id}/preview`),
  executeSuccession: (orgId: string, id: string, resolutionId?: string) =>
    request<Certificate[]>(`${org(orgId)}/succession-rules/${id}/execute`, {
      method: "POST",
      body: JSON.stringify({ resolutionId: resolutionId || undefined }),
    }),
  cancelSuccession: (orgId: string, id: string) =>
    request<SuccessionRule>(`${org(orgId)}/succession-rules/${id}/cancel`, { method: "POST" }),
};
