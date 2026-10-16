import type { PendingChange,
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
  ImportResult,
  SearchHit,
  TransferRequest,
  BuyBackRequest,
  RoundInput,
  RoundResult,
  VestingStatus,
  PortalSummary,
  SignatureView,
  DocumentType,
} from "./types";

const TOKEN_KEY = "equigcc.token";
const ORG_KEY = "equigcc.orgId";
const REFRESH_KEY = "equigcc.refresh";

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

export function saveSession(token: string, orgId: string, refreshToken?: string | null) {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.setItem(ORG_KEY, orgId.trim());
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  else localStorage.removeItem(REFRESH_KEY);
  window.dispatchEvent(new Event("equigcc-session"));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ORG_KEY);
  localStorage.removeItem(REFRESH_KEY);
  window.dispatchEvent(new Event("equigcc-session"));
}

/** Ends the session on the server too (best effort), then forgets it in this browser. */
export async function signOut(): Promise<void> {
  const s = getSession();
  if (s) {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${s.token}` } });
    } catch {
      /* offline or already expired: the local sign-out below is what matters to this browser */
    }
  }
  clearSession();
}

let refreshing: Promise<boolean> | null = null;

/**
 * Trades the stored refresh token for new tokens. One call at a time in this tab, and one at a time across tabs
 * (a refresh token works once, so two tabs refreshing together would look like a stolen token and end the session).
 * `stale` is the access token that just got a 401; if another tab already replaced it there is nothing left to do.
 */
function refreshTokens(stale: string): Promise<boolean> {
  const run = async () => {
    const s = getSession();
    if (s && s.token !== stale) return true;
    return doRefresh();
  };
  refreshing ??= (async () => {
    try {
      return navigator.locks ? await navigator.locks.request("equigcc-refresh", run) : await run();
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

async function doRefresh(): Promise<boolean> {
  try {
    const refresh = localStorage.getItem(REFRESH_KEY);
    const s = getSession();
    if (!refresh || !s) return false;
    const res = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const r = (await res.json()) as { accessToken?: string; refreshToken?: string; organizationId?: string };
    if (!r.accessToken) return false;
    saveSession(r.accessToken, r.organizationId ?? s.orgId, r.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/** fetch with the bearer token; on a 401 it refreshes once and retries, and signs out if that fails. */
async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const attempt = () => {
    const s = getSession();
    if (!s) throw new ApiError(401, "Not connected");
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${s.token}`);
    return fetch(path, { ...init, headers });
  };
  const sent = getSession()?.token ?? "";
  const res = await attempt();
  if (res.status !== 401) return res;
  if (await refreshTokens(sent)) return attempt();
  clearSession();
  return res;
}

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
  const res = auth ? await authedFetch(path, { ...init, headers }) : await fetch(path, { ...init, headers });
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
  if (res.status === 204) return undefined as T;
  if (res.status === 202) {
    // 202 is "accepted": usually no body, but a gated register change answers with the pending change.
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
  return res.json() as Promise<T>;
}

/** True when a gated action (issue, transfer, buy-back, exercise) was held for approval instead of carried out. */
export const isPendingChange = (x: unknown): x is PendingChange =>
  typeof x === "object" && x !== null && "pending" in x && "kind" in x && "summary" in x;

/** Fetches an authenticated binary response and hands it to the browser as a file download. */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const res = await authedFetch(path);
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
  remindResolution: (orgId: string, id: string) =>
    request<{ recipients: number; sentAt: string }>(`${org(orgId)}/resolutions/${id}/remind`, { method: "POST" }),
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
  forgotPassword: async (email: string) => {
    await request<void>("/api/v1/auth/password/forgot", { method: "POST", body: JSON.stringify({ email }) }, false);
  },
  resetPassword: async (token: string, newPassword: string) => {
    await request<void>("/api/v1/auth/password/reset", { method: "POST", body: JSON.stringify({ token, newPassword }) }, false);
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    await request<void>("/api/v1/auth/password/change", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
  },
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
  search: (orgId: string, q: string) =>
    request<{ query: string; hits: SearchHit[] }>(`${org(orgId)}/search?q=${encodeURIComponent(q)}`).then((r) => r.hits),
  capTableExport: (orgId: string, format: "csv" | "pdf") =>
    downloadFile(`${org(orgId)}/cap-table/export?format=${format}`, `cap-table.${format}`),
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
  simulateRound: (orgId: string, body: RoundInput) =>
    request<RoundResult>(`${org(orgId)}/rounds/simulate`, { method: "POST", body: JSON.stringify(body) }),
  vesting: (orgId: string) => request<VestingStatus[]>(`${org(orgId)}/vesting`),
  setVesting: (orgId: string, certNo: string, body: { startDate: string; cliffMonths: number; vestingMonths: number }) =>
    request<VestingStatus>(`${org(orgId)}/certificates/${encodeURIComponent(certNo)}/vesting`, { method: "PUT", body: JSON.stringify(body) }),
  exerciseOptions: (orgId: string, certNo: string, body: { quantity: number; shareClassId?: string; date?: string }) =>
    request<unknown>(`${org(orgId)}/certificates/${encodeURIComponent(certNo)}/exercise`, { method: "POST", body: JSON.stringify(body) }),
  portalSummary: () => request<PortalSummary>("/api/v1/portal/summary"),
  signatures: (orgId: string, documentType: DocumentType, documentRef: string) =>
    request<SignatureView[]>(`${org(orgId)}/signatures?documentType=${documentType}&documentRef=${encodeURIComponent(documentRef)}`),
  sign: (orgId: string, body: { documentType: DocumentType; documentRef: string; code: string; statement?: string }) =>
    request<SignatureView>(`${org(orgId)}/signatures`, { method: "POST", body: JSON.stringify(body) }),
  certificatePdf: (orgId: string, certNo: string) =>
    downloadFile(`${org(orgId)}/certificates/${encodeURIComponent(certNo)}/pdf`, `${certNo}.pdf`),
  approvals: (orgId: string) => request<PendingChange[]>(`${org(orgId)}/approvals`),
  approveChange: (orgId: string, id: string, note?: string) =>
    request<PendingChange>(`${org(orgId)}/approvals/${id}/approve`, { method: "POST", body: JSON.stringify({ note }) }),
  rejectChange: (orgId: string, id: string, note?: string) =>
    request<PendingChange>(`${org(orgId)}/approvals/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
  cancelChange: (orgId: string, id: string) => request<PendingChange>(`${org(orgId)}/approvals/${id}/cancel`, { method: "POST" }),
  setApprovalRequired: (orgId: string, required: boolean) =>
    request<{ required: boolean }>(`${org(orgId)}/settings/approvals`, { method: "PUT", body: JSON.stringify({ required }) }),
  issueCertificate: (orgId: string, body: IssueCertificateRequest) =>
    request<Certificate | PendingChange>(`${org(orgId)}/certificates`, { method: "POST", body: JSON.stringify(body) }),
  verifyCertificate: (certNo: string, hash?: string) =>
    request<CertificateVerification>(
      `/api/v1/certificates/${encodeURIComponent(certNo)}/verify${hash ? `?h=${encodeURIComponent(hash)}` : ""}`,
      {},
      false,
    ),
};
