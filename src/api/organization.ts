import { authedFetch, org, request } from "./client";
import type {
  InviteResult,
  Member,
  Organization,
  ShareClass,
  ShareClassInput,
  Shareholder,
  ShareholderInput,
} from "./types";

export const organizationApi = {
  organization: (orgId: string) => request<Organization>(org(orgId)),
  shareClasses: (orgId: string) => request<ShareClass[]>(`${org(orgId)}/share-classes`),
  shareholders: (orgId: string) => request<Shareholder[]>(`${org(orgId)}/shareholders`),
  createShareClass: (orgId: string, body: ShareClassInput) =>
    request<ShareClass>(`${org(orgId)}/share-classes`, { method: "POST", body: JSON.stringify(body) }),
  createShareholder: (orgId: string, body: ShareholderInput) =>
    request<Shareholder>(`${org(orgId)}/shareholders`, { method: "POST", body: JSON.stringify(body) }),
  members: (orgId: string) => request<Member[]>(`${org(orgId)}/members`),
  invite: (orgId: string, body: { email: string; displayName: string; role: string; shareholderId?: string }) =>
    request<InviteResult>(`${org(orgId)}/members`, { method: "POST", body: JSON.stringify(body) }),
  /** Replaces the company logo. PNG, JPEG or WEBP up to 512 KB; the server rejects anything else. */
  uploadLogo: (orgId: string, file: File) => {
    const form = new FormData();
    form.set("file", file);
    return request<Organization>(`${org(orgId)}/logo`, { method: "PUT", body: form });
  },
  deleteLogo: (orgId: string) => request<void>(`${org(orgId)}/logo`, { method: "DELETE" }),
  /** The logo bytes as a blob, or null when the company has none. */
  logoBlob: async (orgId: string): Promise<Blob | null> => {
    const res = await authedFetch(`${org(orgId)}/logo`);
    return res.ok ? res.blob() : null;
  },
};
