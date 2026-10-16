"use client";

import { useI18n } from "@/lib/i18n";

/** Last-resort screen when a page crashes while rendering. The rest of the app keeps working. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1>{t("errorTitle")}</h1>
      <p className="text-sm text-slate-600">{t("errorBody")}</p>
      <button type="button" className="btn" onClick={reset}>{t("errorRetry")}</button>
    </div>
  );
}
