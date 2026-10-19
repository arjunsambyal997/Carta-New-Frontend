export interface Release {
  version: string;
  date: string; // YYYY-MM-DD
  en: string[];
  ar: string[];
}

/** Newest first. Written for clients, not developers: say what they can now do, in both languages. */
export const RELEASES: Release[] = [
  {
    version: "0.1.0",
    date: "2026-10-19",
    en: [
      "Scheduled maintenance now shows as a banner in the app before it happens.",
      "During read-only maintenance you can still view the register and download certificates.",
    ],
    ar: [
      "تظهر الصيانة المجدولة الآن كشريط تنبيه داخل التطبيق قبل حدوثها.",
      "أثناء الصيانة للقراءة فقط، يمكنك مشاهدة السجل وتنزيل الشهادات.",
    ],
  },
];
