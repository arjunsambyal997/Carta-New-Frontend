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
  /**
   * A date (YYYY-MM-DD) or a moment in time. Gregorian by default; with Hijri dates switched on it shows the
   * Umm al-Qura Hijri date first and the Gregorian date after it, so nothing is ever shown without its legal date.
   */
  date: (value: string | Date | null | undefined, withTime?: boolean) => string;
  hijri: boolean;
  toggleHijri: () => void;
}

const Ctx = createContext<I18n | null>(null);
const KEY = "equigcc.locale";
const HIJRI_KEY = "equigcc.hijri";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [hijri, setHijri] = useState(false);

  useEffect(() => {
    try {
      setHijri(localStorage.getItem(HIJRI_KEY) === "1");
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

  const toggleHijri = useCallback(() => {
    setHijri((h) => {
      try {
        localStorage.setItem(HIJRI_KEY, h ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !h;
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
      date: (value, withTime = false) => {
        if (!value) return "";
        const isDay = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
        const d = value instanceof Date ? value : isDay ? new Date(`${value}T12:00:00Z`) : new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        const gregorian = isDay ? (value as string) : withTime ? d.toLocaleString() : d.toLocaleDateString();
        if (!hijri) return gregorian;
        const h = new Intl.DateTimeFormat(
          locale === "ar" ? "ar-SA-u-ca-islamic-umalqura-nu-latn" : "en-US-u-ca-islamic-umalqura",
          { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
        ).format(d);
        return `${h} (${gregorian})`;
      },
      hijri,
      toggleHijri,
    }),
    [locale, toggle, hijri, toggleHijri],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}
