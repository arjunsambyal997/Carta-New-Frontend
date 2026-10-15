"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "ar";

const dict = {
  en: {
    appName: "EquiGCC",
    navCapTable: "Cap table",
    navOwnership: "Ownership tree",
    navIssue: "Issue certificate",
    navWaterfall: "Exit waterfall",
    exitValue: "Exit value",
    calculate: "Calculate",
    calculating: "Calculating…",
    commonPrice: "Value per common share",
    invested: "Invested",
    preference: "Preference",
    prefPaid: "Preference paid",
    residual: "Share of remainder",
    total: "Total",
    pctExit: "% of exit",
    converted: "Converts to common",
    keepsPref: "Keeps preference",
    byClass: "By share class",
    byHolder: "By shareholder",
    waterfallHint: "Preferences are paid by seniority; the remainder is split by shares. Options, warrants and treasury shares are ignored.",
    navConnect: "Connect",
    switchLang: "العربية",
    notConnected: "Not connected to an organization yet.",
    goConnect: "Connect now",
    loading: "Loading…",
    asOf: "As of",
    issuedShares: "Issued shares",
    fullyDiluted: "Fully diluted",
    treasury: "Treasury shares",
    votingPower: "Total votes",
    shareholder: "Shareholder",
    issuedPct: "Issued %",
    fdPct: "Fully diluted %",
    votes: "Votes",
    votesPct: "Voting %",
    shareClasses: "Share classes",
    className: "Class",
    type: "Type",
    ownershipHint: "Node width is fully diluted ownership. Holding-company and UBO hierarchy needs the shareholder-link API, which is not built yet.",
    holders: "Holders",
    shareholderLabel: "Shareholder",
    classLabel: "Share class",
    quantity: "Quantity",
    pricePerShare: "Price per share",
    currency: "Currency",
    instrument: "Instrument",
    dateIssued: "Date issued",
    optionalDefault: "Optional",
    select: "Select…",
    parValueHint: "Par value",
    authorized: "Authorized",
    issue: "Issue certificate",
    issuing: "Issuing…",
    issued: "Certificate issued",
    certNo: "Certificate no.",
    consideration: "Total consideration",
    verifyQr: "Scan to verify",
    issueAnother: "Issue another",
    connectTitle: "Connect to an organization",
    token: "Access token (JWT)",
    orgId: "Organization ID",
    save: "Save",
    disconnect: "Disconnect",
    tokenHint: "Run `npm run dev-token -- <orgId>` for a local development token.",
    verifyTitle: "Certificate verification",
    authentic: "Authentic: this certificate matches the register.",
    notAuthentic: "Not authentic: the hash does not match the register.",
    issuer: "Issuer",
    status: "Status",
    error: "Something went wrong",
  },
  ar: {
    appName: "إكوي جي سي سي",
    navCapTable: "جدول الملكية",
    navOwnership: "شجرة الملكية",
    navIssue: "إصدار شهادة",
    navWaterfall: "شلال التخارج",
    exitValue: "قيمة التخارج",
    calculate: "احسب",
    calculating: "جارٍ الحساب…",
    commonPrice: "قيمة السهم العادي",
    invested: "رأس المال المستثمر",
    preference: "الأفضلية",
    prefPaid: "الأفضلية المدفوعة",
    residual: "حصة المتبقي",
    total: "الإجمالي",
    pctExit: "٪ من التخارج",
    converted: "يتحول إلى أسهم عادية",
    keepsPref: "يحتفظ بالأفضلية",
    byClass: "حسب فئة الأسهم",
    byHolder: "حسب المساهم",
    waterfallHint: "تُدفع الأفضليات حسب الأقدمية ثم يُقسَّم المتبقي بحسب عدد الأسهم. لا تُحتسب الخيارات والضمانات وأسهم الخزينة.",
    navConnect: "الاتصال",
    switchLang: "English",
    notConnected: "لم يتم الاتصال بمنشأة بعد.",
    goConnect: "اتصل الآن",
    loading: "جارٍ التحميل…",
    asOf: "حتى تاريخ",
    issuedShares: "الأسهم المصدرة",
    fullyDiluted: "على أساس التخفيف الكامل",
    treasury: "أسهم الخزينة",
    votingPower: "إجمالي الأصوات",
    shareholder: "المساهم",
    issuedPct: "٪ المصدر",
    fdPct: "٪ التخفيف الكامل",
    votes: "الأصوات",
    votesPct: "٪ التصويت",
    shareClasses: "فئات الأسهم",
    className: "الفئة",
    type: "النوع",
    ownershipHint: "عرض العقدة يمثل نسبة الملكية بعد التخفيف الكامل. التسلسل الهرمي للشركات القابضة والمستفيدين النهائيين يتطلب واجهة ربط المساهمين وهي غير مكتملة بعد.",
    holders: "المساهمون",
    shareholderLabel: "المساهم",
    classLabel: "فئة الأسهم",
    quantity: "الكمية",
    pricePerShare: "سعر السهم",
    currency: "العملة",
    instrument: "الأداة",
    dateIssued: "تاريخ الإصدار",
    optionalDefault: "اختياري",
    select: "اختر…",
    parValueHint: "القيمة الاسمية",
    authorized: "المصرح به",
    issue: "إصدار الشهادة",
    issuing: "جارٍ الإصدار…",
    issued: "تم إصدار الشهادة",
    certNo: "رقم الشهادة",
    consideration: "إجمالي المقابل",
    verifyQr: "امسح للتحقق",
    issueAnother: "إصدار شهادة أخرى",
    connectTitle: "الاتصال بمنشأة",
    token: "رمز الدخول (JWT)",
    orgId: "معرّف المنشأة",
    save: "حفظ",
    disconnect: "قطع الاتصال",
    tokenHint: "شغّل `npm run dev-token -- <orgId>` للحصول على رمز تطوير محلي.",
    verifyTitle: "التحقق من الشهادة",
    authentic: "أصلية: الشهادة مطابقة للسجل.",
    notAuthentic: "غير أصلية: الرمز لا يطابق السجل.",
    issuer: "الجهة المصدرة",
    status: "الحالة",
    error: "حدث خطأ",
  },
} as const;

export type Key = keyof (typeof dict)["en"];

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
      t: (key) => dict[locale][key],
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
