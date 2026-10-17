import { renderHook, waitFor } from "@testing-library/react";
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
});
