import type {
  CapTable,
  Certificate,
  CertificateVerification,
  IssueCertificateRequest,
  Organization,
  ShareClass,
  Shareholder,
  Waterfall,
  AuditTrail,
  CreateResolutionRequest,
  Resolution,
  ResolutionDetail,
  ResolutionVote,
  VoteChoice,
} from "./types";

const TOKEN_KEY = "equigcc.token";
const ORG_KEY = "equigcc.orgId";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function getSession(): { token: string; orgId: string } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const orgId = localStorage.getItem(ORG_KEY);
    return token && orgId ? { token, orgId } : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, orgId: string) {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.setItem(ORG_KEY, orgId.trim());
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ORG_KEY);
}

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (auth) {
    const s = getSession();
    if (!s) throw new ApiError(401, "Not connected");
    headers.set("Authorization", `Bearer ${s.token}`);
  }
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 403) detail = detail && detail !== "Forbidden" ? detail : "Forbidden: check role, organization and MFA";
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

const org = (orgId: string) => `/api/v1/organizations/${orgId}`;

export const api = {
  organization: (orgId: string) => request<Organization>(org(orgId)),
  shareClasses: (orgId: string) => request<ShareClass[]>(`${org(orgId)}/share-classes`),
  shareholders: (orgId: string) => request<Shareholder[]>(`${org(orgId)}/shareholders`),
  capTable: (orgId: string) => request<CapTable>(`${org(orgId)}/cap-table`),
  waterfall: (orgId: string, exitValue: number) =>
    request<Waterfall>(`${org(orgId)}/waterfall?exitValue=${encodeURIComponent(exitValue)}`),
  resolutions: (orgId: string) => request<Resolution[]>(`${org(orgId)}/resolutions`),
  resolution: (orgId: string, id: string) => request<ResolutionDetail>(`${org(orgId)}/resolutions/${id}`),
  createResolution: (orgId: string, body: CreateResolutionRequest) =>
    request<Resolution>(`${org(orgId)}/resolutions`, { method: "POST", body: JSON.stringify(body) }),
  openResolution: (orgId: string, id: string) =>
    request<Resolution>(`${org(orgId)}/resolutions/${id}/open`, { method: "POST" }),
  closeResolution: (orgId: string, id: string) =>
    request<Resolution>(`${org(orgId)}/resolutions/${id}/close`, { method: "POST" }),
  castVote: (orgId: string, id: string, vote: VoteChoice, shareholderId?: string) =>
    request<ResolutionVote>(`${org(orgId)}/resolutions/${id}/votes`, {
      method: "POST",
      body: JSON.stringify({ vote, shareholderId: shareholderId || undefined }),
    }),
  audit: (orgId: string) => request<AuditTrail>(`${org(orgId)}/audit`),
  issueCertificate: (orgId: string, body: IssueCertificateRequest) =>
    request<Certificate>(`${org(orgId)}/certificates`, { method: "POST", body: JSON.stringify(body) }),
  verifyCertificate: (certNo: string, hash?: string) =>
    request<CertificateVerification>(
      `/api/v1/certificates/${encodeURIComponent(certNo)}/verify${hash ? `?h=${encodeURIComponent(hash)}` : ""}`,
      {},
      false,
    ),
};
