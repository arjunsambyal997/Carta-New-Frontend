import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { I18nProvider, useI18n } from "./I18nContext";

const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider>{children}</I18nProvider>;

describe("I18nProvider", () => {
  it("starts in English and flips the document to right-to-left Arabic", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.locale).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
    act(() => result.current.toggle());
    expect(result.current.locale).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(localStorage.getItem("equigcc.locale")).toBe("ar");
  });

  it("prefers the Arabic name only in Arabic and only when one exists", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.name("Acme", "أكمي")).toBe("Acme");
    act(() => result.current.toggle());
    expect(result.current.name("Acme", "أكمي")).toBe("أكمي");
    expect(result.current.name("Acme", null)).toBe("Acme");
  });

  it("formats numbers with Latin digits in both languages", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.num(12345)).toMatch(/^12.?345$/);
  });
});
