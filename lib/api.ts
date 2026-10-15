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
  AuthResult,
  Enrollment,
  Me,
  Member,
  SignupRequest,
  ShareClassInput,
  ShareholderInput,
  InviteResult,
  OwnershipLink,
  UboReport,
  SuccessionRule,
  SuccessionRuleInput,
  Conversion,
  VaultDocument,
  VaultCategory,
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
  window.dispatchEvent(new Event("equigcc-session"));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ORG_KEY);
  window.dispatchEvent(new Event("equigcc-session"));
}

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
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

/** Fetches an authenticated binary response and hands it to the browser as a file download. */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const s = getSession();
  if (!s) throw new ApiError(401, "Not connected");
  const res = await fetch(path, { headers: { Authorization: `Bearer ${s.token}` } });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  const cd = res.headers.get("Content-Disposition") ?? "";
  const filename = /filename="([^"]+)"/.exec(cd)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
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
  signup: (body: SignupRequest) =>
    request<AuthResult>("/api/v1/auth/signup", { method: "POST", body: JSON.stringify(body) }, false),
  login: (email: string, password: string, organizationId?: string) =>
    request<AuthResult>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password, organizationId }) }, false),
  verifyMfa: (mfaToken: string, code: string) =>
    request<AuthResult>("/api/v1/auth/mfa/verify", { method: "POST", body: JSON.stringify({ mfaToken, code }) }, false),
  me: () => request<Me>("/api/v1/auth/me"),
  mfaEnroll: () => request<Enrollment>("/api/v1/auth/mfa/enroll", { method: "POST" }),
  mfaConfirm: (code: string) =>
    request<AuthResult>("/api/v1/auth/mfa/confirm", { method: "POST", body: JSON.stringify({ code }) }),
  createShareClass: (orgId: string, body: ShareClassInput) =>
    request<ShareClass>(`${org(orgId)}/share-classes`, { method: "POST", body: JSON.stringify(body) }),
  createShareholder: (orgId: string, body: ShareholderInput) =>
    request<Shareholder>(`${org(orgId)}/shareholders`, { method: "POST", body: JSON.stringify(body) }),
  members: (orgId: string) => request<Member[]>(`${org(orgId)}/members`),
  invite: (orgId: string, body: { email: string; displayName: string; role: string; shareholderId?: string }) =>
    request<InviteResult>(`${org(orgId)}/members`, { method: "POST", body: JSON.stringify(body) }),
  ownershipLinks: (orgId: string) => request<OwnershipLink[]>(`${org(orgId)}/ownership-links`),
  setOwners: (orgId: string, holderId: string, owners: { ownerId: string; economicPct: number; votingPct?: number }[]) =>
    request<OwnershipLink[]>(`${org(orgId)}/shareholders/${holderId}/owners`, { method: "PUT", body: JSON.stringify({ owners }) }),
  ubo: (orgId: string, threshold: number) => request<UboReport>(`${org(orgId)}/ubo?threshold=${encodeURIComponent(threshold)}`),
  uboExport: (orgId: string, format: "csv" | "pdf", threshold: number) =>
    downloadFile(`${org(orgId)}/ubo/export?format=${format}&threshold=${encodeURIComponent(threshold)}`, `ubo-register.${format}`),
  successionRules: (orgId: string) => request<SuccessionRule[]>(`${org(orgId)}/succession-rules`),
  createSuccessionRule: (orgId: string, body: SuccessionRuleInput) =>
    request<SuccessionRule>(`${org(orgId)}/succession-rules`, { method: "POST", body: JSON.stringify(body) }),
  previewSuccession: (orgId: string, id: string) => request<Conversion[]>(`${org(orgId)}/succession-rules/${id}/preview`),
  executeSuccession: (orgId: string, id: string, resolutionId?: string) =>
    request<Certificate[]>(`${org(orgId)}/succession-rules/${id}/execute`, {
      method: "POST",
      body: JSON.stringify({ resolutionId: resolutionId || undefined }),
    }),
  cancelSuccession: (orgId: string, id: string) =>
    request<SuccessionRule>(`${org(orgId)}/succession-rules/${id}/cancel`, { method: "POST" }),
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
  audit: (orgId: string) => request<AuditTrail>(`${org(orgId)}/audit`),
  certificates: (orgId: string) => request<Certificate[]>(`${org(orgId)}/certificates`),
  certificatePdf: (orgId: string, certNo: string) =>
    downloadFile(`${org(orgId)}/certificates/${encodeURIComponent(certNo)}/pdf`, `${certNo}.pdf`),
  issueCertificate: (orgId: string, body: IssueCertificateRequest) =>
    request<Certificate>(`${org(orgId)}/certificates`, { method: "POST", body: JSON.stringify(body) }),
  verifyCertificate: (certNo: string, hash?: string) =>
    request<CertificateVerification>(
      `/api/v1/certificates/${encodeURIComponent(certNo)}/verify${hash ? `?h=${encodeURIComponent(hash)}` : ""}`,
      {},
      false,
    ),
};
