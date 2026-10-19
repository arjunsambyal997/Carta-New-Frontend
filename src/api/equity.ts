import { org, request } from "./client";
import type { RoundInput, RoundResult, VestingStatus } from "./types";

export const equityApi = {
  simulateRound: (orgId: string, body: RoundInput) =>
    request<RoundResult>(`${org(orgId)}/rounds/simulate`, { method: "POST", body: JSON.stringify(body) }),
  vesting: (orgId: string) => request<VestingStatus[]>(`${org(orgId)}/vesting`),
  setVesting: (
    orgId: string,
    certNo: string,
    body: { startDate: string; cliffMonths: number; vestingMonths: number },
  ) =>
    request<VestingStatus>(`${org(orgId)}/certificates/${encodeURIComponent(certNo)}/vesting`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  exerciseOptions: (orgId: string, certNo: string, body: { quantity: number; shareClassId?: string; date?: string }) =>
    request<unknown>(`${org(orgId)}/certificates/${encodeURIComponent(certNo)}/exercise`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
