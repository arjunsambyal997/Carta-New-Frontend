"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, type Key, type Locale } from "@/i18n";

export type { Key, Locale };

interface I18n {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: Key) => string;
  toggle: () => void;
  /** Pick the Arabic name when the UI is Arabic and one exists. */
  name: (en: string, ar?: string | null) => string;
  num: (n: number, opts?: Intl.NumberFormatOptions) => string;
}

const Ctx = createContext<I18n | null>(null);
const KEY = "equigcc.locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "ar" || saved === "en") setLocale(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const toggle = useCallback(() => {
    setLocale((l) => {
      const next = l === "en" ? "ar" : "en";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<I18n>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: (key) => dictionaries[locale][key],
      toggle,
      name: (en, ar) => (locale === "ar" && ar ? ar : en),
      // Latin digits in both locales: share counts are compared against legal documents in Latin digits.
      num: (n, opts) => new Intl.NumberFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-US", opts).format(n),
    }),
    [locale, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}
