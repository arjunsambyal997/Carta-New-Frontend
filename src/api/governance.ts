import { org, request } from "./client";
import type { CreateResolutionRequest, Resolution, ResolutionDetail, ResolutionVote, VoteChoice } from "./types";

export const governanceApi = {
  resolutions: (orgId: string) => request<Resolution[]>(`${org(orgId)}/resolutions`),
  resolution: (orgId: string, id: string) => request<ResolutionDetail>(`${org(orgId)}/resolutions/${id}`),
  createResolution: (orgId: string, body: CreateResolutionRequest) =>
    request<Resolution>(`${org(orgId)}/resolutions`, { method: "POST", body: JSON.stringify(body) }),
  openResolution: (orgId: string, id: string) =>
    request<Resolution>(`${org(orgId)}/resolutions/${id}/open`, { method: "POST" }),
  closeResolution: (orgId: string, id: string) =>
    request<Resolution>(`${org(orgId)}/resolutions/${id}/close`, { method: "POST" }),
  remindResolution: (orgId: string, id: string) =>
    request<{ recipients: number; sentAt: string }>(`${org(orgId)}/resolutions/${id}/remind`, { method: "POST" }),
  castVote: (orgId: string, id: string, vote: VoteChoice, shareholderId?: string) =>
    request<ResolutionVote>(`${org(orgId)}/resolutions/${id}/votes`, {
      method: "POST",
      body: JSON.stringify({ vote, shareholderId: shareholderId || undefined }),
    }),
};
