import { downloadFile, org, request } from "./client";
import type { VaultCategory, VaultDocument } from "./types";

export const vaultApi = {
  vault: (orgId: string) => request<VaultDocument[]>(`${org(orgId)}/vault`),
  vaultUpload: (orgId: string, title: string, category: VaultCategory, file: File) => {
    const form = new FormData();
    form.set("title", title);
    form.set("category", category);
    form.set("file", file);
    return request<VaultDocument>(`${org(orgId)}/vault`, { method: "POST", body: form });
  },
  vaultDownload: (orgId: string, doc: { id: string; fileName: string }) =>
    downloadFile(`${org(orgId)}/vault/${doc.id}/content`, doc.fileName),
};
