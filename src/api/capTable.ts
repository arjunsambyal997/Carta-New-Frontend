import { downloadFile, org, request } from "./client";
import type { CapTable, Ledger, LineageNode, SearchHit, Waterfall } from "./types";

export const capTableApi = {
  capTable: (orgId: string, asOf?: string) =>
    request<CapTable>(`${org(orgId)}/cap-table${asOf ? `?asOf=${encodeURIComponent(asOf)}` : ""}`),
  ledger: (orgId: string, shareholderId: string) =>
    request<Ledger>(`${org(orgId)}/shareholders/${shareholderId}/ledger`),
  lineage: (orgId: string, certificateNo: string) =>
    request<LineageNode[]>(`${org(orgId)}/certificates/${encodeURIComponent(certificateNo)}/lineage`),
  waterfall: (orgId: string, exitValue: number) =>
    request<Waterfall>(`${org(orgId)}/waterfall?exitValue=${encodeURIComponent(exitValue)}`),
  search: (orgId: string, q: string) =>
    request<{ query: string; hits: SearchHit[] }>(`${org(orgId)}/search?q=${encodeURIComponent(q)}`).then(
      (r) => r.hits,
    ),
  capTableExport: (orgId: string, format: "csv" | "pdf") =>
    downloadFile(`${org(orgId)}/cap-table/export?format=${format}`, `cap-table.${format}`),
};
