import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FRESH_MS } from "./cache";
import { request, saveSession } from "./client";

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json({ n: 1, list: [3, 1, 2] })),
  );
  saveSession("tok", "org");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("request cache", () => {
  it("shares one request between callers asking at the same time", async () => {
    const [a, b] = await Promise.all([request("/api/v1/x"), request("/api/v1/x")]);
    expect(a).toEqual(b);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("answers from memory while fresh and asks again once stale", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    await request("/api/v1/x");
    await request("/api/v1/x");
    expect(fetch).toHaveBeenCalledOnce();
    vi.setSystemTime(Date.now() + FRESH_MS + 1);
    await request("/api/v1/x");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps different paths apart", async () => {
    await request("/api/v1/x");
    await request("/api/v1/y");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("forgets everything after a change", async () => {
    await request("/api/v1/x");
    await request("/api/v1/x", { method: "POST", body: "{}" });
    await request("/api/v1/x");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("forgets everything when the session changes", async () => {
    await request("/api/v1/x");
    saveSession("other", "org-2");
    await request("/api/v1/x");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not store an answer that started before a change", async () => {
    let finish: (r: Response) => void = () => undefined;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise((r) => (finish = r)));
    const slow = request("/api/v1/x");
    await request("/api/v1/y", { method: "DELETE" });
    finish(json({ n: "old" }));
    await slow;
    await request("/api/v1/x");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("hands out copies, so one page editing its data cannot change another's", async () => {
    const a = await request<{ list: number[] }>("/api/v1/x");
    a.list.sort();
    const b = await request<{ list: number[] }>("/api/v1/x");
    expect(b.list).toEqual([3, 1, 2]);
  });

  it("skips the cache when asked, and for failed answers", async () => {
    await request("/api/v1/x", { cache: "no-store" });
    await request("/api/v1/x", { cache: "no-store" });
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(request("/api/v1/z")).rejects.toMatchObject({ status: 500 });
    await request("/api/v1/z");
    expect(fetch).toHaveBeenCalledTimes(4);
  });
});
