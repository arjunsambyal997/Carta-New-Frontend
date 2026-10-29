import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { saveSession } from "@/api";
import { useRegister } from "./useRegister";

describe("useRegister", () => {
  it("reports not connected without a session and never calls the loader", async () => {
    const load = vi.fn();
    const { result } = renderHook(() => useRegister(load));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.connected).toBe(false);
    expect(load).not.toHaveBeenCalled();
  });

  it("loads data for the stored organization", async () => {
    saveSession("tok", "org-1");
    const load = vi.fn().mockResolvedValue({ n: 1 });
    const { result } = renderHook(() => useRegister(load));
    await waitFor(() => expect(result.current.data).toEqual({ n: 1 }));
    expect(load).toHaveBeenCalledWith("org-1");
  });

  it("exposes the loader's error", async () => {
    saveSession("tok", "org-1");
    const { result } = renderHook(() => useRegister(() => Promise.reject(new Error("nope"))));
    await waitFor(() => expect(result.current.error).toBe("nope"));
  });

  it("loads again on reload and recovers from an error", async () => {
    saveSession("tok", "org-1");
    const load = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ n: 2 });
    const { result } = renderHook(() => useRegister(load));
    await waitFor(() => expect(result.current.error).toBe("offline"));
    act(() => result.current.reload?.());
    await waitFor(() => expect(result.current.data).toEqual({ n: 2 }));
    expect(result.current.error).toBeNull();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("keeps the shown data while a refresh runs", async () => {
    saveSession("tok", "org-1");
    let finish: (v: { n: number }) => void = () => undefined;
    const load = vi
      .fn()
      .mockResolvedValueOnce({ n: 1 })
      .mockImplementationOnce(() => new Promise((r) => (finish = r)));
    const { result, rerender } = renderHook(({ key }) => useRegister(load, key), { initialProps: { key: 0 } });
    await waitFor(() => expect(result.current.data).toEqual({ n: 1 }));
    rerender({ key: 1 });
    await waitFor(() => expect(result.current.refreshing).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ n: 1 });
    act(() => finish({ n: 3 }));
    await waitFor(() => expect(result.current.data).toEqual({ n: 3 }));
    expect(result.current.refreshing).toBe(false);
  });

  it("uses the newest loader when it reloads", async () => {
    saveSession("tok", "org-1");
    const first = vi.fn().mockResolvedValue("a");
    const second = vi.fn().mockResolvedValue("b");
    const { result, rerender } = renderHook(({ load }) => useRegister(load), { initialProps: { load: first } });
    await waitFor(() => expect(result.current.data).toBe("a"));
    rerender({ load: second });
    act(() => result.current.reload?.());
    await waitFor(() => expect(result.current.data).toBe("b"));
    expect(first).toHaveBeenCalledOnce();
  });
});
