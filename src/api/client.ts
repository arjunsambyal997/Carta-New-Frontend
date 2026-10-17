const TOKEN_KEY = "equigcc.token";
const ORG_KEY = "equigcc.orgId";
const REFRESH_KEY = "equigcc.refresh";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
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
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
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

export async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
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
    if (res.status === 403)
      detail = detail && detail !== "Forbidden" ? detail : "Forbidden: check role, organization and MFA";
    throw new ApiError(res.status, detail);
  }
  if (res.status === 202 || res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

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

export const org = (orgId: string) => `/api/v1/organizations/${orgId}`;
