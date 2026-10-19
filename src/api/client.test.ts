import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, authedFetch, clearSession, getSession, request, saveSession } from "./client";

const json = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(async () => {
  vi.stubGlobal("fetch", vi.fn());
  // The client shares one in-flight refresh and drops it on the next tick; let that happen between tests.
  await new Promise((resolve) => setTimeout(resolve, 1));
});
afterEach(() => vi.unstubAllGlobals());

describe("session storage", () => {
  it("round-trips a session and clears it", () => {
    expect(getSession()).toBeNull();
    saveSession(" tok ", " org-1 ", "refresh-1");
    expect(getSession()).toEqual({ token: "tok", orgId: "org-1" });
    clearSession();
    expect(getSession()).toBeNull();
  });

  it("announces changes so other components can react", () => {
    const seen = vi.fn();
    window.addEventListener("equigcc-session", seen);
    saveSession("t", "o");
    clearSession();
    window.removeEventListener("equigcc-session", seen);
    expect(seen).toHaveBeenCalledTimes(2);
  });
});

describe("request", () => {
  it("sends the bearer token and parses JSON", async () => {
    saveSession("tok", "org");
    vi.mocked(fetch).mockResolvedValueOnce(json(200, { ok: true }));
    await expect(request("/api/v1/x")).resolves.toEqual({ ok: true });
    const headers = new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer tok");
  });

  it("surfaces the server's detail message", async () => {
    saveSession("tok", "org");
    vi.mocked(fetch).mockResolvedValueOnce(json(422, { detail: "Rule violated" }));
    await expect(request("/api/v1/x")).rejects.toMatchObject({ status: 422, message: "Rule violated" });
  });

  it("refuses to call an authenticated endpoint without a session", async () => {
    await expect(request("/api/v1/x")).rejects.toBeInstanceOf(ApiError);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("token refresh", () => {
  it("refreshes once on a 401 and retries with the new token", async () => {
    saveSession("old", "org", "refresh-1");
    vi.mocked(fetch)
      .mockResolvedValueOnce(json(401))
      .mockResolvedValueOnce(json(200, { accessToken: "new", refreshToken: "refresh-2", organizationId: "org" }))
      .mockResolvedValueOnce(json(200, { ok: 1 }));
    const res = await authedFetch("/api/v1/x");
    expect(res.status).toBe(200);
    expect(getSession()?.token).toBe("new");
    const retry = new Headers(vi.mocked(fetch).mock.calls[2][1]?.headers);
    expect(retry.get("Authorization")).toBe("Bearer new");
  });

  it("signs out when the refresh token is rejected", async () => {
    saveSession("old", "org", "refresh-1");
    vi.mocked(fetch).mockResolvedValueOnce(json(401)).mockResolvedValueOnce(json(401));
    const res = await authedFetch("/api/v1/x");
    expect(res.status).toBe(401);
    expect(getSession()).toBeNull();
  });
});
