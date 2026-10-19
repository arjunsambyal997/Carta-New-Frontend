import { downloadFile, org, request } from "./client";
import type { BuyBackRequest, ImportResult, TransferRequest } from "./types";

export const registerToolsApi = {
  importTemplate: (orgId: string, kind: "holders" | "issuances") =>
    downloadFile(`${org(orgId)}/import/templates/${kind}`, `${kind}-template.csv`),
  importCsv: (orgId: string, kind: "shareholders" | "issuances", file: File, dryRun: boolean) => {
    const form = new FormData();
    form.append("file", file);
    return request<ImportResult>(`${org(orgId)}/import/${kind}?dryRun=${dryRun}`, { method: "POST", body: form });
  },
  transfer: (orgId: string, body: TransferRequest) =>
    request<unknown>(`${org(orgId)}/transfers`, { method: "POST", body: JSON.stringify(body) }),
  buyBack: (orgId: string, body: BuyBackRequest) =>
    request<unknown>(`${org(orgId)}/buybacks`, { method: "POST", body: JSON.stringify(body) }),
};
