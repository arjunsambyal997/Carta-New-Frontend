import { org, request } from "./client";
import type { DocumentType, PortalSummary, SignatureView } from "./types";

export const portalApi = {
  portalSummary: () => request<PortalSummary>("/api/v1/portal/summary"),
  signatures: (orgId: string, documentType: DocumentType, documentRef: string) =>
    request<SignatureView[]>(
      `${org(orgId)}/signatures?documentType=${documentType}&documentRef=${encodeURIComponent(documentRef)}`,
    ),
  sign: (orgId: string, body: { documentType: DocumentType; documentRef: string; code: string; statement?: string }) =>
    request<SignatureView>(`${org(orgId)}/signatures`, { method: "POST", body: JSON.stringify(body) }),
};
