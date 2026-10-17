import { downloadFile, org, request } from "./client";
import type { OwnershipLink, UboReport } from "./types";

export const ownershipApi = {
  ownershipLinks: (orgId: string) => request<OwnershipLink[]>(`${org(orgId)}/ownership-links`),
  setOwners: (
    orgId: string,
    holderId: string,
    owners: { ownerId: string; economicPct: number; votingPct?: number }[],
  ) =>
    request<OwnershipLink[]>(`${org(orgId)}/shareholders/${holderId}/owners`, {
      method: "PUT",
      body: JSON.stringify({ owners }),
    }),
  ubo: (orgId: string, threshold: number) =>
    request<UboReport>(`${org(orgId)}/ubo?threshold=${encodeURIComponent(threshold)}`),
  uboExport: (orgId: string, format: "csv" | "pdf", threshold: number) =>
    downloadFile(
      `${org(orgId)}/ubo/export?format=${format}&threshold=${encodeURIComponent(threshold)}`,
      `ubo-register.${format}`,
    ),
};
