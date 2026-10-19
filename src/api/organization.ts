import { org, request } from "./client";
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
};
